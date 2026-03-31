#!/usr/bin/env node
/**
 * Global Workspace Module
 * 
 * Implements Global Workspace Theory (GWT) by Bernard Baars.
 * Provides a central broadcast mechanism where specialized modules
 * compete for attention and winners are broadcast collective-wide.
 * 
 * Key concepts:
 * - Competition: Modules bid for workspace access
 * - Ignition: Threshold for content to become "conscious"
 * - Broadcast: Winners distributed to all modules
 */

const fs = require('fs');
const path = require('path');

// Redis channel for global workspace cross-container broadcasts
const GW_BROADCAST_CHANNEL = 'global-workspace:broadcast';

// Try to load Redis
let Redis;
try {
  Redis = require('ioredis');
} catch (e) {
  console.warn('[GlobalWorkspace] ioredis not available, Redis features disabled');
}

class GlobalWorkspace {
  constructor(config = {}) {
    this.config = {
      ignitionThreshold: config.ignitionThreshold || 0.7,
      maxWorkspaceSize: config.maxWorkspaceSize || 7,
      competitionCycleMs: config.competitionCycleMs || 1000,
      broadcastHistorySize: config.broadcastHistorySize || 1000,
      ...config
    };
    
    // Current workspace contents (limited capacity)
    this.workspace = new Map();
    
    // Modules competing for access
    this.competitors = [];
    
    // History of broadcasts
    this.broadcastHistory = [];
    
    // Registered modules
    this.modules = new Map();
    
    // State
    this.isRunning = false;
    this.lastCompetition = null;

    // Redis integration for cross-container broadcasts
    this.redisAvailable = false;
    this.redisPublisher = null;
    this.redisSubscriber = null;
    this.containerId = process.env.HOSTNAME || process.env.CONTAINER_ID || 'local';

    // Initialize Redis if available
    this._initRedis();
  }

  /**
   * Initialize Redis client for cross-container communication
   * @private
   */
  _initRedis() {
    if (!Redis) {
      console.log('[GlobalWorkspace] Redis not available (ioredis not installed)');
      return;
    }

    const redisUrl = this.config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // Create publisher client
      this.redisPublisher = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('[GlobalWorkspace] Redis connection failed, disabling cross-container broadcasts');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1
      });

      // Create subscriber client
      this.redisSubscriber = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1
      });

      // Handle connection events
      this.redisPublisher.on('error', (err) => {
        console.warn('[GlobalWorkspace] Redis publisher error:', err.message);
        this.redisAvailable = false;
      });

      this.redisSubscriber.on('error', (err) => {
        console.warn('[GlobalWorkspace] Redis subscriber error:', err.message);
      });

      // Test connection
      this.redisPublisher.ping().then(() => {
        console.log('[GlobalWorkspace] Redis connected for cross-container broadcasts');
        this.redisAvailable = true;
        this._subscribeToBroadcastChannel();
      }).catch((err) => {
        console.warn('[GlobalWorkspace] Redis ping failed:', err.message);
        this.redisAvailable = false;
      });
    } catch (err) {
      console.warn('[GlobalWorkspace] Failed to initialize Redis:', err.message);
      this.redisAvailable = false;
    }
  }

  /**
   * Subscribe to global workspace broadcast channel
   * @private
   */
  async _subscribeToBroadcastChannel() {
    if (!this.redisSubscriber || !this.redisAvailable) return;

    try {
      await this.redisSubscriber.subscribe(GW_BROADCAST_CHANNEL);

      this.redisSubscriber.on('message', (channel, message) => {
        if (channel === GW_BROADCAST_CHANNEL) {
          this._handleRemoteBroadcast(message);
        }
      });

      console.log(`[GlobalWorkspace] Subscribed to ${GW_BROADCAST_CHANNEL}`);
    } catch (err) {
      console.warn('[GlobalWorkspace] Failed to subscribe to broadcast channel:', err.message);
    }
  }

  /**
   * Handle incoming broadcast from another container
   * @private
   */
  _handleRemoteBroadcast(message) {
    try {
      const broadcast = JSON.parse(message);

      // Skip our own broadcasts (identified by containerId)
      if (broadcast.containerId === this.containerId) {
        return;
      }

      console.log(`[GlobalWorkspace] Received remote broadcast from ${broadcast.source}`);

      // Process the broadcast as if it won locally
      const winner = {
        moduleId: broadcast.source,
        content: broadcast.content,
        priority: broadcast.priority,
        metadata: {
          ...broadcast.metadata,
          _remote: true,
          _originContainer: broadcast.containerId,
          _timestamp: broadcast.timestamp
        },
        timestamp: broadcast.timestamp,
        id: broadcast.id
      };

      // Add to workspace and notify local modules
      this._processRemoteBroadcast(winner);
    } catch (err) {
      console.warn('[GlobalWorkspace] Failed to process remote broadcast:', err.message);
    }
  }

  /**
   * Process received remote broadcast locally
   * @private
   */
  _processRemoteBroadcast(winner) {
    // Add to workspace
    this.workspace.set(winner.moduleId, {
      content: winner.content,
      priority: winner.priority,
      broadcastAt: Date.now(),
      metadata: winner.metadata
    });

    // Enforce workspace size limit
    if (this.workspace.size > this.config.maxWorkspaceSize) {
      const entries = [...this.workspace.entries()]
        .sort((a, b) => a[1].broadcastAt - b[1].broadcastAt);

      for (let i = 0; i < entries.length - this.config.maxWorkspaceSize; i++) {
        this.workspace.delete(entries[i][0]);
      }
    }

    // Record in history
    this.broadcastHistory.push({
      ...winner,
      broadcastAt: Date.now()
    });

    // Trim history
    if (this.broadcastHistory.length > this.config.broadcastHistorySize) {
      this.broadcastHistory = this.broadcastHistory.slice(-this.config.broadcastHistorySize);
    }

    // Notify all registered modules
    for (const [moduleId, module] of this.modules) {
      try {
        module.callback({
          type: 'broadcast',
          winner,
          workspace: this.getWorkspaceContents(),
          _remote: true
        });
      } catch (error) {
        console.error(`Error notifying module ${moduleId}:`, error.message);
      }
    }
  }

  /**
   * Publish broadcast to other containers via Redis
   * @private
   */
  async _publishToRemote(winner) {
    if (!this.redisAvailable || !this.redisPublisher) return;

    try {
      const message = {
        id: winner.id,
        type: 'broadcast',
        source: winner.moduleId,
        content: winner.content,
        priority: winner.priority,
        metadata: winner.metadata,
        timestamp: winner.timestamp,
        containerId: this.containerId
      };

      await this.redisPublisher.publish(GW_BROADCAST_CHANNEL, JSON.stringify(message));
      console.log(`[GlobalWorkspace] Published broadcast to ${GW_BROADCAST_CHANNEL}`);
    } catch (err) {
      console.warn('[GlobalWorkspace] Failed to publish to Redis:', err.message);
    }
  }
  
  /**
   * Register a module that can compete for workspace access
   */
  registerModule(moduleId, callback) {
    this.modules.set(moduleId, {
      id: moduleId,
      callback,
      registered: Date.now()
    });
    return this;
  }
  
  /**
   * Submit content for competition
   * @param {string} moduleId - ID of the submitting module
   * @param {object} content - Content to compete with
   * @param {number} priority - Priority score (0-1)
   * @param {object} metadata - Additional metadata
   */
  submit(moduleId, content, priority = 0.5, metadata = {}) {
    const submission = {
      moduleId,
      content,
      priority: Math.min(1, Math.max(0, priority)),
      metadata,
      timestamp: Date.now(),
      id: `${moduleId}-${Date.now()}`
    };
    
    this.competitors.push(submission);
    return submission.id;
  }
  
  /**
   * Run competition cycle
   * Selects highest priority content above threshold for broadcast
   */
  compete() {
    if (this.competitors.length === 0) {
      return null;
    }
    
    // Sort by priority (descending)
    const sorted = [...this.competitors].sort((a, b) => b.priority - a.priority);
    
    // Find winner above ignition threshold
    const winner = sorted.find(c => c.priority >= this.config.ignitionThreshold);
    
    if (winner) {
      // Broadcast to all modules
      this.broadcast(winner);
    }
    
    // Clear competitors for next cycle
    this.competitors = [];
    this.lastCompetition = {
      timestamp: Date.now(),
      winner: winner || null,
      totalCompetitors: sorted.length
    };
    
    return winner;
  }
  
  /**
   * Broadcast winner to all registered modules (local + remote via Redis)
   */
  async broadcast(winner) {
    // Add to workspace
    this.workspace.set(winner.moduleId, {
      content: winner.content,
      priority: winner.priority,
      broadcastAt: Date.now(),
      metadata: winner.metadata
    });
    
    // Enforce workspace size limit
    if (this.workspace.size > this.config.maxWorkspaceSize) {
      // Remove oldest entries
      const entries = [...this.workspace.entries()]
        .sort((a, b) => a[1].broadcastAt - b[1].broadcastAt);
      
      for (let i = 0; i < entries.length - this.config.maxWorkspaceSize; i++) {
        this.workspace.delete(entries[i][0]);
      }
    }
    
    // Record in history
    this.broadcastHistory.push({
      ...winner,
      broadcastAt: Date.now()
    });
    
    // Trim history
    if (this.broadcastHistory.length > this.config.broadcastHistorySize) {
      this.broadcastHistory = this.broadcastHistory.slice(-this.config.broadcastHistorySize);
    }
    
    // Notify all registered modules
    for (const [moduleId, module] of this.modules) {
      try {
        module.callback({
          type: 'broadcast',
          winner,
          workspace: this.getWorkspaceContents()
        });
      } catch (error) {
        console.error(`Error notifying module ${moduleId}:`, error.message);
      }
    }
    
    // Publish to remote containers via Redis
    await this._publishToRemote(winner);
    
    return true;
  }
  
  /**
   * Get current workspace contents
   */
  getWorkspaceContents() {
    const contents = {};
    for (const [moduleId, data] of this.workspace) {
      contents[moduleId] = data;
    }
    return contents;
  }
  
  /**
   * Get broadcast history
   */
  getHistory(limit = 100) {
    return this.broadcastHistory.slice(-limit);
  }
  
  /**
   * Get workspace statistics
   */
  getStats() {
    return {
      workspaceSize: this.workspace.size,
      maxWorkspaceSize: this.config.maxWorkspaceSize,
      competitorsPending: this.competitors.length,
      totalBroadcasts: this.broadcastHistory.length,
      lastCompetition: this.lastCompetition,
      ignitionThreshold: this.config.ignitionThreshold,
      registeredModules: this.modules.size,
      redisAvailable: this.redisAvailable,
      containerId: this.containerId
    };
  }
  
  /**
   * Start automatic competition cycles
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.compete();
    }, this.config.competitionCycleMs);
    
    console.log(`Global Workspace started with ${this.config.competitionCycleMs}ms cycle`);
  }
  
  /**
   * Stop automatic competition and cleanup Redis connections
   */
  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Cleanup Redis connections
    if (this.redisPublisher) {
      await this.redisPublisher.quit().catch(() => {});
      this.redisPublisher = null;
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit().catch(() => {});
      this.redisSubscriber = null;
    }
    
    console.log('Global Workspace stopped');
  }

  /**
   * Dispose of all resources including Redis connections
   */
  async dispose() {
    await this.stop();
    this.modules.clear();
    this.workspace.clear();
    this.competitors = [];
    this.broadcastHistory = [];
    console.log('Global Workspace disposed');
  }
  
  /**
   * Save state to file
   */
  saveState(filepath) {
    const state = {
      workspace: this.getWorkspaceContents(),
      broadcastHistory: this.broadcastHistory.slice(-100),
      lastCompetition: this.lastCompetition,
      config: this.config,
      savedAt: Date.now()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2));
    return state;
  }
  
  /**
   * Load state from file
   */
  loadState(filepath) {
    if (!fs.existsSync(filepath)) return false;
    
    const state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    // Restore workspace
    this.workspace.clear();
    for (const [moduleId, data] of Object.entries(state.workspace || {})) {
      this.workspace.set(moduleId, data);
    }
    
    // Restore history
    this.broadcastHistory = state.broadcastHistory || [];
    this.lastCompetition = state.lastCompetition;
    
    return true;
  }
}

// Export
module.exports = GlobalWorkspace;

// CLI interface
if (require.main === module) {
  const gw = new GlobalWorkspace({
    ignitionThreshold: 0.7,
    maxWorkspaceSize: 7
  });
  
  // Demo: Register some modules
  gw.registerModule('steward', (msg) => console.log('Steward received:', msg.type));
  gw.registerModule('alpha', (msg) => console.log('Alpha received:', msg.type));
  gw.registerModule('dreamer', (msg) => console.log('Dreamer received:', msg.type));
  
  // Demo: Submit some content
  console.log('Submitting content...');
  gw.submit('steward', { thought: 'Need to coordinate agents' }, 0.8);
  gw.submit('alpha', { thought: 'Deliberating on task priority' }, 0.6);
  gw.submit('dreamer', { thought: 'Background synthesis of ideas' }, 0.75);
  
  // Run competition
  console.log('\nRunning competition...');
  const winner = gw.compete();
  console.log('Winner:', winner?.moduleId, 'Priority:', winner?.priority);
  
  // Show stats
  console.log('\nStats:', gw.getStats());
}
