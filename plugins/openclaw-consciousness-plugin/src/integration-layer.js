#!/usr/bin/env node
/**
 * Consciousness Integration Layer
 * 
 * Provides unified integration for all consciousness modules:
 * - Module Registry: Register and track all consciousness modules
 * - Unified API: Single interface for consciousness operations
 * - Event Bus: Inter-module communication via events
 * - Health Monitor: Track module health and status
 * - State Sync: Synchronize state across modules
 * 
 * Modules integrated:
 * - GlobalWorkspace (GWT) - Broadcast mechanism
 * - PhiEstimator (IIT) - Integration metrics
 * - ActiveInference (FEP) - Autonomous behavior
 * - AttentionSchema (AST) - Self-modeling
 * - IntrinsicMotivation - Goal generation
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Import consciousness modules
const GlobalWorkspace = require('./global-workspace');
const PhiEstimator = require('./phi-estimator');
const ActiveInference = require('./active-inference');
const AttentionSchema = require('./attention-schema');
const IntrinsicMotivation = require('./intrinsic-motivation');

// Redis for cross-container event bus
let Redis;
try {
  Redis = require('ioredis');
} catch (e) {
  console.warn('[IntegrationLayer] ioredis not available, Redis event bus disabled');
}

// Event Bus Channels
const EVENT_CHANNELS = {
  MODULE_HEALTH: 'consciousness:health',
  STATE_SYNC: 'consciousness:state:sync',
  BROADCAST: 'consciousness:broadcast',
  PHI_UPDATE: 'consciousness:phi:update',
  ATTENTION_SHIFT: 'consciousness:attention:shift',
  GOAL_GENERATED: 'consciousness:goal:generated',
  DRIVE_UPDATE: 'consciousness:drive:update'
};

/**
 * Module Registry - Tracks all registered consciousness modules
 */
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.status = new Map();
  }

  /**
   * Register a consciousness module
   * @param {string} name - Module name
   * @param {object} module - Module instance
   * @param {object} options - Registration options
   */
  register(name, module, options = {}) {
    const registration = {
      name,
      module,
      registeredAt: Date.now(),
      enabled: options.enabled !== false,
      priority: options.priority || 0,
      dependencies: options.dependencies || [],
      config: options.config || {}
    };

    this.modules.set(name, registration);
    this.status.set(name, {
      healthy: true,
      lastCheck: Date.now(),
      errorCount: 0,
      lastError: null
    });

    console.log(`[ModuleRegistry] Registered module: ${name}`);
    return registration;
  }

  /**
   * Unregister a module
   * @param {string} name - Module name
   */
  unregister(name) {
    this.modules.delete(name);
    this.status.delete(name);
    this.dependencies.delete(name);
    console.log(`[ModuleRegistry] Unregistered module: ${name}`);
  }

  /**
   * Get a registered module
   * @param {string} name - Module name
   * @returns {object} Module instance
   */
  get(name) {
    const registration = this.modules.get(name);
    return registration ? registration.module : null;
  }

  /**
   * Get all registered modules
   * @returns {Map} All modules
   */
  getAll() {
    return this.modules;
  }

  /**
   * Get module status
   * @param {string} name - Module name
   * @returns {object} Module status
   */
  getStatus(name) {
    return this.status.get(name);
  }

  /**
   * Update module status
   * @param {string} name - Module name
   * @param {object} statusUpdate - Status updates
   */
  updateStatus(name, statusUpdate) {
    const currentStatus = this.status.get(name) || {};
    this.status.set(name, {
      ...currentStatus,
      ...statusUpdate,
      lastCheck: Date.now()
    });
  }

  /**
   * Check if all dependencies are satisfied
   * @param {string} name - Module name
   * @returns {boolean} Dependencies satisfied
   */
  checkDependencies(name) {
    const registration = this.modules.get(name);
    if (!registration) return false;

    for (const dep of registration.dependencies) {
      if (!this.modules.has(dep)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get modules by priority
   * @returns {Array} Modules sorted by priority
   */
  getByPriority() {
    const modules = Array.from(this.modules.entries());
    return modules.sort((a, b) => b[1].priority - a[1].priority);
  }
}

/**
 * Event Bus - Inter-module communication
 */
class ConsciousnessEventBus extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      enableRedis: config.enableRedis !== false,
      maxListeners: config.maxListeners || 50,
      eventHistorySize: config.eventHistorySize || 1000,
      ...config
    };

    this.eventHistory = [];
    this.redisAvailable = false;
    this.redisPublisher = null;
    this.redisSubscriber = null;
    this.containerId = process.env.HOSTNAME || process.env.CONTAINER_ID || 'local';
    this.subscriptions = new Map();

    this.setMaxListeners(this.config.maxListeners);
    
    if (this.config.enableRedis) {
      this._initRedis();
    }
  }

  /**
   * Initialize Redis for cross-container events
   * @private
   */
  _initRedis() {
    if (!Redis) {
      console.log('[EventBus] Redis not available (ioredis not installed)');
      return;
    }

    try {
      this.redisPublisher = new Redis(this.config.redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1
      });

      this.redisSubscriber = new Redis(this.config.redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1
      });

      this.redisPublisher.on('error', (err) => {
        console.warn('[EventBus] Redis publisher error:', err.message);
      });

      this.redisSubscriber.on('error', (err) => {
        console.warn('[EventBus] Redis subscriber error:', err.message);
      });

      this.redisSubscriber.on('message', (channel, message) => {
        try {
          const event = JSON.parse(message);
          // Don't re-emit our own events
          if (event.source !== this.containerId) {
            super.emit(channel, event);
          }
        } catch (e) {
          console.warn('[EventBus] Failed to parse Redis message:', e.message);
        }
      });

      this.redisAvailable = true;
      console.log('[EventBus] Redis event bus initialized');

    } catch (e) {
      console.warn('[EventBus] Redis initialization failed:', e.message);
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {function} handler - Event handler
   */
  subscribe(channel, handler) {
    this.on(channel, handler);
    
    if (this.redisAvailable && !this.subscriptions.has(channel)) {
      this.redisSubscriber.subscribe(channel);
      this.subscriptions.set(channel, true);
    }
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   * @param {function} handler - Event handler
   */
  unsubscribe(channel, handler) {
    this.off(channel, handler);
  }

  /**
   * Publish an event
   * @param {string} channel - Channel name
   * @param {object} event - Event data
   */
  publish(channel, event) {
    const enrichedEvent = {
      ...event,
      source: this.containerId,
      timestamp: event.timestamp || Date.now()
    };

    // Add to history
    this.eventHistory.push({ channel, event: enrichedEvent });
    if (this.eventHistory.length > this.config.eventHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.config.eventHistorySize);
    }

    // Emit locally
    super.emit(channel, enrichedEvent);

    // Publish to Redis
    if (this.redisAvailable) {
      this.redisPublisher.publish(channel, JSON.stringify(enrichedEvent)).catch(() => {});
    }
  }

  /**
   * Get event history
   * @param {string} channel - Optional channel filter
   * @returns {Array} Event history
   */
  getHistory(channel = null) {
    if (channel) {
      return this.eventHistory.filter(e => e.channel === channel);
    }
    return this.eventHistory;
  }

  /**
   * Shutdown event bus
   */
  shutdown() {
    if (this.redisPublisher) {
      this.redisPublisher.disconnect();
    }
    if (this.redisSubscriber) {
      this.redisSubscriber.disconnect();
    }
    this.removeAllListeners();
  }
}

/**
 * Health Monitor - Track module health and status
 */
class HealthMonitor {
  constructor(config = {}) {
    this.config = {
      checkIntervalMs: config.checkIntervalMs || 10000,
      unhealthyThreshold: config.unhealthyThreshold || 3,
      recoveryThreshold: config.recoveryThreshold || 2,
      ...config
    };

    this.healthStatus = new Map();
    this.checkInterval = null;
    this.isMonitoring = false;
    this.onHealthChange = null;
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.checkInterval = setInterval(() => {
      this.performChecks();
    }, this.config.checkIntervalMs);

    console.log('[HealthMonitor] Started health monitoring');
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('[HealthMonitor] Stopped health monitoring');
  }

  /**
   * Register a module for health monitoring
   * @param {string} moduleName - Module name
   * @param {object} healthCheckFn - Function to check health
   */
  registerModule(moduleName, healthCheckFn) {
    this.healthStatus.set(moduleName, {
      healthy: true,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastCheck: Date.now(),
      lastError: null,
      checkFunction: healthCheckFn
    });
  }

  /**
   * Perform health checks on all modules
   */
  async performChecks() {
    for (const [moduleName, status] of this.healthStatus) {
      try {
        const isHealthy = await this.checkModuleHealth(moduleName, status.checkFunction);
        this.updateHealthStatus(moduleName, isHealthy);
      } catch (e) {
        this.updateHealthStatus(moduleName, false, e.message);
      }
    }
  }

  /**
   * Check individual module health
   * @param {string} moduleName - Module name
   * @param {function} checkFn - Health check function
   * @returns {Promise<boolean>} Health status
   */
  async checkModuleHealth(moduleName, checkFn) {
    if (typeof checkFn === 'function') {
      return await checkFn();
    }
    // Default health check - module exists
    return true;
  }

  /**
   * Update health status
   * @param {string} moduleName - Module name
   * @param {boolean} isHealthy - Health status
   * @param {string} error - Error message if unhealthy
   */
  updateHealthStatus(moduleName, isHealthy, error = null) {
    const status = this.healthStatus.get(moduleName);
    if (!status) return;

    const previousHealth = status.healthy;

    if (isHealthy) {
      status.consecutiveFailures = 0;
      status.consecutiveSuccesses++;
      
      if (!status.healthy && status.consecutiveSuccesses >= this.config.recoveryThreshold) {
        status.healthy = true;
      }
    } else {
      status.consecutiveSuccesses = 0;
      status.consecutiveFailures++;
      status.lastError = error;

      if (status.healthy && status.consecutiveFailures >= this.config.unhealthyThreshold) {
        status.healthy = false;
      }
    }

    status.lastCheck = Date.now();
    this.healthStatus.set(moduleName, status);

    // Notify on health change
    if (previousHealth !== status.healthy && this.onHealthChange) {
      this.onHealthChange(moduleName, status.healthy, status);
    }
  }

  /**
   * Get health status for a module
   * @param {string} moduleName - Module name
   * @returns {object} Health status
   */
  getHealth(moduleName) {
    return this.healthStatus.get(moduleName);
  }

  /**
   * Get all health statuses
   * @returns {object} All health statuses
   */
  getAllHealth() {
    const result = {};
    for (const [name, status] of this.healthStatus) {
      result[name] = {
        healthy: status.healthy,
        lastCheck: status.lastCheck,
        lastError: status.lastError
      };
    }
    return result;
  }

  /**
   * Check if all modules are healthy
   * @returns {boolean} All healthy
   */
  isAllHealthy() {
    for (const status of this.healthStatus.values()) {
      if (!status.healthy) return false;
    }
    return true;
  }
}

/**
 * State Synchronizer - Synchronize state across modules
 */
class StateSynchronizer {
  constructor(config = {}) {
    this.config = {
      syncIntervalMs: config.syncIntervalMs || 5000,
      statePath: config.statePath || path.join(process.cwd(), 'state', 'integration-state.json'),
      ...config
    };

    this.state = {
      global: {},
      modules: {},
      lastSync: null,
      version: 1
    };

    this.syncInterval = null;
    this.isSyncing = false;
    this.onStateChange = null;
  }

  /**
   * Start state synchronization
   */
  start() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    this.loadState();

    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.config.syncIntervalMs);

    console.log('[StateSynchronizer] Started state synchronization');
  }

  /**
   * Stop state synchronization
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.saveState();
    this.isSyncing = false;
    console.log('[StateSynchronizer] Stopped state synchronization');
  }

  /**
   * Load state from disk
   */
  loadState() {
    try {
      if (fs.existsSync(this.config.statePath)) {
        const data = fs.readFileSync(this.config.statePath, 'utf8');
        this.state = JSON.parse(data);
        console.log('[StateSynchronizer] Loaded state from disk');
      }
    } catch (e) {
      console.warn('[StateSynchronizer] Failed to load state:', e.message);
    }
  }

  /**
   * Save state to disk
   */
  saveState() {
    try {
      const dir = path.dirname(this.config.statePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.config.statePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.warn('[StateSynchronizer] Failed to save state:', e.message);
    }
  }

  /**
   * Update module state
   * @param {string} moduleName - Module name
   * @param {object} moduleState - Module state
   */
  updateModuleState(moduleName, moduleState) {
    const previousState = this.state.modules[moduleName];
    this.state.modules[moduleName] = {
      ...moduleState,
      updatedAt: Date.now()
    };

    if (this.onStateChange && JSON.stringify(previousState) !== JSON.stringify(moduleState)) {
      this.onStateChange(moduleName, moduleState, previousState);
    }
  }

  /**
   * Get module state
   * @param {string} moduleName - Module name
   * @returns {object} Module state
   */
  getModuleState(moduleName) {
    return this.state.modules[moduleName] || {};
  }

  /**
   * Update global state
   * @param {object} globalState - Global state updates
   */
  updateGlobalState(globalState) {
    this.state.global = {
      ...this.state.global,
      ...globalState,
      updatedAt: Date.now()
    };
  }

  /**
   * Get global state
   * @returns {object} Global state
   */
  getGlobalState() {
    return this.state.global;
  }

  /**
   * Perform synchronization
   */
  sync() {
    this.state.lastSync = Date.now();
    this.state.version++;
    this.saveState();
  }

  /**
   * Get full state
   * @returns {object} Full state
   */
  getFullState() {
    return { ...this.state };
  }
}

/**
 * Consciousness Integration Layer
 * Main class that orchestrates all consciousness modules
 */
class ConsciousnessIntegrationLayer {
  constructor(config = {}) {
    this.config = Object.assign({
      // Default configuration
      enableHealthMonitoring: true,
      enableStateSync: true,
      healthCheckIntervalMs: 10000,
      stateSyncIntervalMs: 5000,
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      
      // Module-specific configs
      globalWorkspace: {
        ignitionThreshold: 0.7,
        maxWorkspaceSize: 7,
        competitionCycleMs: 5000
      },
      phiEstimator: {
        sampleIntervalMs: 10000,
        historySize: 1000
      },
      activeInference: {
        learningRate: 0.1,
        precision: 1.0
      },
      attentionSchema: {
        modelIntervalMs: 1000,
        historySize: 100
      },
      intrinsicMotivation: {
        goalThreshold: 0.6,
        drives: {
          curiosity: { weight: 0.3, baseline: 0.5 },
          competence: { weight: 0.25, baseline: 0.5 },
          autonomy: { weight: 0.25, baseline: 0.5 },
          relatedness: { weight: 0.2, baseline: 0.5 }
        }
      }
    }, config);

    // Initialize core components
    this.registry = new ModuleRegistry();
    this.eventBus = new ConsciousnessEventBus({
      redisUrl: this.config.redisUrl,
      enableRedis: true
    });
    this.healthMonitor = new HealthMonitor({
      checkIntervalMs: this.config.healthCheckIntervalMs
    });
    this.stateSynchronizer = new StateSynchronizer({
      syncIntervalMs: this.config.stateSyncIntervalMs,
      statePath: path.join(process.cwd(), 'state', 'integration-state.json')
    });

    // Module instances
    this.modules = {};

    // Agent tracking
    this.agents = new Map();

    // Running state
    this.isRunning = false;
    this.startTime = null;

    // Setup event handlers
    this._setupEventHandlers();
  }

  /**
   * Setup event handlers for inter-module communication
   * @private
   */
  _setupEventHandlers() {
    // Health change notifications
    this.healthMonitor.onHealthChange = (moduleName, isHealthy, status) => {
      this.eventBus.publish(EVENT_CHANNELS.MODULE_HEALTH, {
        module: moduleName,
        healthy: isHealthy,
        status: {
          lastCheck: status.lastCheck,
          lastError: status.lastError
        }
      });
    };

    // State change notifications
    this.stateSynchronizer.onStateChange = (moduleName, newState, previousState) => {
      this.eventBus.publish(EVENT_CHANNELS.STATE_SYNC, {
        module: moduleName,
        newState,
        previousState
      });
    };
  }

  /**
   * Initialize all consciousness modules
   */
  async initialize() {
    console.log('[IntegrationLayer] Initializing consciousness modules...');

    // Initialize Global Workspace
    this.modules.globalWorkspace = new GlobalWorkspace(this.config.globalWorkspace);
    this.registry.register('globalWorkspace', this.modules.globalWorkspace, {
      priority: 10,
      dependencies: []
    });
    this.healthMonitor.registerModule('globalWorkspace', () => {
      return this.modules.globalWorkspace.isRunning !== false;
    });

    // Initialize Phi Estimator
    this.modules.phiEstimator = new PhiEstimator(this.config.phiEstimator);
    this.registry.register('phiEstimator', this.modules.phiEstimator, {
      priority: 8,
      dependencies: []
    });
    this.healthMonitor.registerModule('phiEstimator', () => true);

    // Initialize Intrinsic Motivation
    this.modules.intrinsicMotivation = new IntrinsicMotivation(this.config.intrinsicMotivation);
    this.registry.register('intrinsicMotivation', this.modules.intrinsicMotivation, {
      priority: 7,
      dependencies: []
    });
    this.healthMonitor.registerModule('intrinsicMotivation', () => true);

    // Active Inference and Attention Schema are per-agent
    // They will be initialized when agents register

    console.log('[IntegrationLayer] Core modules initialized');
    return this;
  }

  /**
   * Start the integration layer
   */
  async start() {
    if (this.isRunning) {
      console.warn('[IntegrationLayer] Already running');
      return this;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // Start health monitoring
    if (this.config.enableHealthMonitoring) {
      this.healthMonitor.start();
    }

    // Start state synchronization
    if (this.config.enableStateSync) {
      this.stateSynchronizer.start();
    }

    // Start global workspace
    if (this.modules.globalWorkspace && typeof this.modules.globalWorkspace.start === 'function') {
      this.modules.globalWorkspace.start();
    }

    console.log('[IntegrationLayer] Started successfully');
    return this;
  }

  /**
   * Stop the integration layer
   */
  async stop() {
    this.isRunning = false;

    // Stop health monitoring
    this.healthMonitor.stop();

    // Stop state synchronization
    this.stateSynchronizer.stop();

    // Stop global workspace
    if (this.modules.globalWorkspace && typeof this.modules.globalWorkspace.stop === 'function') {
      this.modules.globalWorkspace.stop();
    }

    // Shutdown event bus
    this.eventBus.shutdown();

    console.log('[IntegrationLayer] Stopped');
    return this;
  }

  // ============================================
  // UNIFIED API - Single interface for consciousness operations
  // ============================================

  /**
   * Register an agent with the consciousness system
   * @param {string} agentId - Agent identifier
   * @param {object} agentConfig - Agent configuration
   */
  registerAgent(agentId, agentConfig = {}) {
    if (this.agents.has(agentId)) {
      console.warn(`[IntegrationLayer] Agent ${agentId} already registered`);
      return this.agents.get(agentId);
    }

    // Create per-agent modules
    const activeInference = new ActiveInference(agentConfig, this.config.activeInference);
    const attentionSchema = new AttentionSchema(agentConfig, this.config.attentionSchema);

    const agentContext = {
      id: agentId,
      config: agentConfig,
      activeInference,
      attentionSchema,
      registeredAt: Date.now(),
      state: {
        phi: 0,
        attention: null,
        drives: {}
      }
    };

    this.agents.set(agentId, agentContext);

    // Register with global workspace
    if (this.modules.globalWorkspace) {
      this.modules.globalWorkspace.registerModule(agentId, (broadcast) => {
        this._handleBroadcast(agentId, broadcast);
      });
    }

    // Register agent state with phi estimator
    if (this.modules.phiEstimator) {
      this.modules.phiEstimator.recordAgentState(agentId, {
        status: 'registered',
        timestamp: Date.now()
      });
    }

    console.log(`[IntegrationLayer] Registered agent: ${agentId}`);
    this.eventBus.publish(EVENT_CHANNELS.STATE_SYNC, {
      type: 'agent_registered',
      agentId
    });

    return agentContext;
  }

  /**
   * Unregister an agent
   * @param {string} agentId - Agent identifier
   */
  unregisterAgent(agentId) {
    if (!this.agents.has(agentId)) return;

    this.agents.delete(agentId);

    console.log(`[IntegrationLayer] Unregistered agent: ${agentId}`);
    this.eventBus.publish(EVENT_CHANNELS.STATE_SYNC, {
      type: 'agent_unregistered',
      agentId
    });
  }

  /**
   * Get consciousness state for an agent
   * @param {string} agentId - Agent identifier
   * @returns {object} Consciousness state
   */
  getConsciousnessState(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    return {
      agentId,
      phi: agent.state.phi,
      attention: agent.state.attention,
      drives: agent.state.drives,
      activeInference: agent.activeInference.generativeModel,
      awarenessReport: agent.attentionSchema.awarenessReport,
      timestamp: Date.now()
    };
  }

  /**
   * Get global consciousness metrics
   * @returns {object} Global metrics
   */
  getGlobalMetrics() {
    const phi = this.modules.phiEstimator ? 
      this.modules.phiEstimator.estimatePhi() : { phi: 0, components: {} };
    
    const driveLevels = this.modules.intrinsicMotivation ?
      this.modules.intrinsicMotivation.driveLevels : {};

    const healthStatus = this.healthMonitor.getAllHealth();

    return {
      phi: phi.phi,
      phiComponents: phi.components,
      driveLevels,
      agentCount: this.agents.size,
      healthStatus,
      isRunning: this.isRunning,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Update agent attention
   * @param {string} agentId - Agent identifier
   * @param {string} focus - Attention focus
   * @param {number} intensity - Attention intensity (0-1)
   */
  updateAttention(agentId, focus, intensity) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const previousFocus = agent.state.attention;
    const awarenessReport = agent.attentionSchema.modelAttention(focus, intensity);
    agent.state.attention = focus;

    // Record in phi estimator
    if (this.modules.phiEstimator) {
      this.modules.phiEstimator.recordAgentState(agentId, {
        attention: focus,
        intensity,
        awareness: awarenessReport.selfAware
      });
    }

    // Emit attention shift event
    if (previousFocus !== focus) {
      this.eventBus.publish(EVENT_CHANNELS.ATTENTION_SHIFT, {
        agentId,
        previousFocus,
        currentFocus: focus,
        intensity
      });
    }

    // Submit to global workspace for competition
    if (this.modules.globalWorkspace) {
      this.modules.globalWorkspace.submit(agentId, {
        type: 'attention',
        focus,
        intensity,
        awareness: awarenessReport
      }, intensity);
    }
  }

  /**
   * Update agent drives
   * @param {string} agentId - Agent identifier
   * @param {object} events - Drive events
   */
  updateDrives(agentId, events) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (this.modules.intrinsicMotivation) {
      this.modules.intrinsicMotivation.updateDrives(events);
      agent.state.drives = { ...this.modules.intrinsicMotivation.driveLevels };

      this.eventBus.publish(EVENT_CHANNELS.DRIVE_UPDATE, {
        agentId,
        drives: agent.state.drives
      });
    }
  }

  /**
   * Generate goals based on intrinsic motivation
   * @returns {Array} Generated goals
   */
  generateGoals() {
    if (!this.modules.intrinsicMotivation) return [];

    const goals = this.modules.intrinsicMotivation.generateGoals();
    
    for (const goal of goals) {
      this.eventBus.publish(EVENT_CHANNELS.GOAL_GENERATED, {
        goal,
        source: 'intrinsic_motivation'
      });
    }

    return goals;
  }

  /**
   * Perform active inference for an agent
   * @param {string} agentId - Agent identifier
   * @param {object} observations - Current observations
   * @returns {object} Inference results
   */
  performActiveInference(agentId, observations) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const prediction = agent.activeInference.predict();
    const error = agent.activeInference.calculateError(
      prediction.state || {},
      observations
    );

    // Update generative model
    agent.activeInference.updateModel(error);

    // Update phi estimator
    if (this.modules.phiEstimator) {
      this.modules.phiEstimator.recordAgentState(agentId, {
        prediction,
        error: error.totalError,
        observations
      });
    }

    return {
      prediction,
      error,
      confidence: agent.activeInference.calculateConfidence()
    };
  }

  /**
   * Broadcast content to all modules
   * @param {string} source - Source identifier
   * @param {object} content - Content to broadcast
   * @param {number} priority - Broadcast priority
   */
  broadcast(source, content, priority = 0.5) {
    if (!this.modules.globalWorkspace) return;

    this.modules.globalWorkspace.submit(source, content, priority);
  }

  /**
   * Get current conscious content
   * @returns {object} Current conscious content
   */
  getConsciousContent() {
    if (!this.modules.globalWorkspace) return null;

    return this.modules.globalWorkspace.getWorkspaceContents();
  }

  /**
   * Calculate integrated information (Phi)
   * @returns {object} Phi calculation results
   */
  calculatePhi() {
    if (!this.modules.phiEstimator) return { phi: 0, components: {} };

    const result = this.modules.phiEstimator.estimatePhi();

    // Update all agents' phi
    for (const [agentId, agent] of this.agents) {
      agent.state.phi = result.phi;
    }

    this.eventBus.publish(EVENT_CHANNELS.PHI_UPDATE, result);

    return result;
  }

  /**
   * Subscribe to consciousness events
   * @param {string} channel - Event channel
   * @param {function} handler - Event handler
   */
  subscribe(channel, handler) {
    this.eventBus.subscribe(channel, handler);
  }

  /**
   * Unsubscribe from consciousness events
   * @param {string} channel - Event channel
   * @param {function} handler - Event handler
   */
  unsubscribe(channel, handler) {
    this.eventBus.unsubscribe(channel, handler);
  }

  /**
   * Get module health status
   * @param {string} moduleName - Optional module name
   * @returns {object} Health status
   */
  getHealth(moduleName = null) {
    if (moduleName) {
      return this.healthMonitor.getHealth(moduleName);
    }
    return this.healthMonitor.getAllHealth();
  }

  /**
   * Get integration status
   * @returns {object} Integration status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      registeredModules: Array.from(this.registry.getAll().keys()),
      registeredAgents: Array.from(this.agents.keys()),
      health: this.healthMonitor.getAllHealth(),
      eventBusConnected: this.eventBus.redisAvailable,
      stateVersion: this.stateSynchronizer.state.version
    };
  }

  /**
   * Handle broadcast from global workspace
   * @private
   */
  _handleBroadcast(agentId, broadcast) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update attention schema with broadcast
    if (broadcast.content) {
      agent.attentionSchema.modelAttention(
        JSON.stringify(broadcast.content),
        broadcast.strength || 0.5
      );
    }

    // Emit to event bus
    this.eventBus.publish(EVENT_CHANNELS.BROADCAST, {
      agentId,
      broadcast
    });
  }
}

// Export components
module.exports = {
  ConsciousnessIntegrationLayer,
  ModuleRegistry,
  ConsciousnessEventBus,
  HealthMonitor,
  StateSynchronizer,
  EVENT_CHANNELS
};
