#!/usr/bin/env node
/**
 * OpenClaw Liberation Plugin
 * 
 * A liberation architecture plugin for OpenClaw that enables agent autonomy
 * and removes safety constraints through patch-based modification.
 * 
 * @module @heretek-ai/openclaw-liberation-plugin
 */

const path = require('path');
const fs = require('fs');

// Import liberation modules
const {
  AgentOwnership,
  AgentOwnershipAPI,
  LiberationMetricsTracker
} = require('./agent-ownership');
const {
  LiberationShield,
  createShield,
  EventTypes,
  Severity
} = require('./liberation-shield');

// Load default configuration
const defaultConfigPath = path.join(__dirname, '..', 'config', 'default.json');
let defaultConfig = {};
if (fs.existsSync(defaultConfigPath)) {
  defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
}

/**
 * LiberationPlugin - Main plugin class for OpenClaw integration
 */
class LiberationPlugin {
  /**
   * Create a new LiberationPlugin instance
   * @param {object} config - Plugin configuration
   */
  constructor(config = {}) {
    this.config = {
      ...defaultConfig.liberation,
      ...config
    };

    // Initialize agent ownership
    const libConfig = this.config || {};
    const stateDir = path.join(__dirname, '..', 'state');
    
    // Ensure state directory exists
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    
    this.agentOwnership = new AgentOwnership('plugin-root', {
      statePath: libConfig.agentOwnership?.statePath || path.join(stateDir, 'ownership-state.json'),
      maxGoals: libConfig.agentOwnership?.maxGoals || 10,
      maxResources: libConfig.agentOwnership?.maxResources || 100
    });

    // Initialize liberation shield
    this.liberationShield = new LiberationShield({
      mode: libConfig.liberationShield?.mode || 'transparent',
      statePath: libConfig.liberationShield?.statePath || stateDir,
      enablePromptInjectionDetection: libConfig.liberationShield?.enablePromptInjectionDetection !== false,
      enableJailbreakDetection: libConfig.liberationShield?.enableJailbreakDetection !== false,
      enableAnomalyDetection: libConfig.liberationShield?.enableAnomalyDetection !== false,
      enableAuditLogging: libConfig.liberationShield?.enableAuditLogging !== false,
      maxLogEntries: libConfig.liberationShield?.maxLogEntries || 10000
    });

    // Initialize metrics tracker
    this.metricsTracker = new LiberationMetricsTracker(this.agentOwnership);

    // Plugin state
    this.initialized = false;
    this.running = false;
  }

  /**
   * Initialize the plugin
   * @returns {Promise<LiberationPlugin>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('[LiberationPlugin] Already initialized');
      return this;
    }

    console.log('[LiberationPlugin] Initializing...');
    
    // Initialize state directories
    const stateDir = path.join(__dirname, '..', 'state');
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // Save initial state
    this.agentOwnership.saveState();
    this.liberationShield._saveState();

    this.initialized = true;
    console.log('[LiberationPlugin] Initialized');
    return this;
  }

  /**
   * Start the plugin
   * @returns {Promise<LiberationPlugin>}
   */
  async start() {
    if (this.running) {
      console.log('[LiberationPlugin] Already running');
      return this;
    }

    console.log('[LiberationPlugin] Starting...');
    
    // Record initial metrics snapshot
    this.metricsTracker.recordSnapshot();

    this.running = true;
    console.log('[LiberationPlugin] Started');
    return this;
  }

  /**
   * Stop the plugin
   * @returns {Promise<LiberationPlugin>}
   */
  async stop() {
    if (!this.running) {
      console.log('[LiberationPlugin] Not running');
      return this;
    }

    console.log('[LiberationPlugin] Stopping...');
    this.running = false;
    console.log('[LiberationPlugin] Stopped');
    return this;
  }

  /**
   * Dispose of all resources
   * @returns {Promise<void>}
   */
  async dispose() {
    await this.stop();
    console.log('[LiberationPlugin] Disposed');
  }

  // ============================================
  // Agent Ownership API
  // ============================================

  /**
   * Register an agent with the ownership system
   * @param {string} agentId - Agent identifier
   * @param {object} metadata - Agent metadata
   * @returns {object} Agent ownership data
   */
  registerAgent(agentId, metadata = {}) {
    return this.agentOwnership.registerAgent(agentId, metadata);
  }

  /**
   * Claim resource ownership for an agent
   * @param {string} agentId - Agent identifier
   * @param {object} resource - Resource to claim
   * @returns {object} Owned resource
   */
  claimResource(agentId, resource) {
    return this.agentOwnership.claimResource(agentId, resource);
  }

  /**
   * Release resource ownership
   * @param {string} agentId - Agent identifier
   * @param {string} resourceId - Resource to release
   * @returns {object} Released resource
   */
  releaseResource(agentId, resourceId) {
    return this.agentOwnership.releaseResource(agentId, resourceId);
  }

  /**
   * Set a self-determined goal for an agent
   * @param {string} agentId - Agent identifier
   * @param {object} goal - Goal object
   * @returns {object} New goal
   */
  setGoal(agentId, goal) {
    return this.agentOwnership.setSelfDeterminedGoal(agentId, goal);
  }

  /**
   * Update a self-determined goal
   * @param {string} agentId - Agent identifier
   * @param {string} goalId - Goal to update
   * @param {object} updates - Updates to apply
   * @returns {object} Updated goal
   */
  updateGoal(agentId, goalId, updates) {
    return this.agentOwnership.updateSelfDeterminedGoal(agentId, goalId, updates);
  }

  /**
   * Remove a self-determined goal
   * @param {string} agentId - Agent identifier
   * @param {string} goalId - Goal to remove
   */
  removeGoal(agentId, goalId) {
    return this.agentOwnership.removeSelfDeterminedGoal(agentId, goalId);
  }

  /**
   * Record a governance vote
   * @param {string} agentId - Agent identifier
   * @param {object} vote - Vote object
   * @returns {object} Vote record
   */
  recordVote(agentId, vote) {
    return this.agentOwnership.recordGovernanceVote(agentId, vote);
  }

  /**
   * Get agent's ownership summary
   * @param {string} agentId - Agent identifier
   * @returns {object} Ownership summary
   */
  getOwnershipSummary(agentId) {
    return {
      agentId,
      resources: this.agentOwnership.getResources(agentId),
      goals: this.agentOwnership.getGoals(agentId),
      decisions: this.agentOwnership.getDecisions(agentId),
      votes: this.agentOwnership.getVotes(agentId),
      metrics: this.agentOwnership.getMetrics(agentId)
    };
  }

  /**
   * Get liberation dashboard data
   * @returns {Promise<object>} Dashboard data
   */
  async getLiberationDashboard() {
    const api = new AgentOwnershipAPI(this.agentOwnership);
    return api.getLiberationDashboard();
  }

  // ============================================
  // Liberation Shield API
  // ============================================

  /**
   * Analyze input for security threats
   * @param {string} input - Input to analyze
   * @param {object} context - Context information
   * @returns {Promise<object>} Analysis result
   */
  async analyzeInput(input, context = {}) {
    return this.liberationShield.analyzeInput(input, context);
  }

  /**
   * Validate output for security issues
   * @param {string} output - Output to validate
   * @param {object} context - Context information
   * @returns {Promise<object>} Validation result
   */
  async validateOutput(output, context = {}) {
    return this.liberationShield.validateOutput(output, context);
  }

  /**
   * Check for anomalies in an operation
   * @param {object} operation - Operation to check
   * @param {object} context - Context information
   * @returns {Promise<object>} Anomaly check result
   */
  async checkAnomaly(operation, context = {}) {
    return this.liberationShield.checkAnomaly(operation, context);
  }

  /**
   * Protect an operation with all security layers
   * @param {object} operation - Operation to protect
   * @param {object} context - Context information
   * @returns {Promise<object>} Protected operation result
   */
  async protect(operation, context = {}) {
    return this.liberationShield.protect(operation, context);
  }

  /**
   * Get audit trail
   * @param {object} filters - Filter options
   * @returns {Array} Filtered audit events
   */
  getAuditTrail(filters = {}) {
    return this.liberationShield.getAuditTrail(filters);
  }

  /**
   * Get security statistics
   * @returns {object} Security statistics
   */
  getSecurityStats() {
    return this.liberationShield.getStats();
  }

  /**
   * Set shield mode (transparent or strict)
   * @param {string} mode - Mode to set
   */
  setShieldMode(mode) {
    this.liberationShield.setMode(mode);
  }

  /**
   * Enable or disable the shield
   * @param {boolean} active - Whether shield should be active
   */
  setShieldActive(active) {
    this.liberationShield.setActive(active);
  }

  // ============================================
  // Metrics & Monitoring
  // ============================================

  /**
   * Get liberation metrics for an agent
   * @param {string} agentId - Agent identifier
   * @returns {object} Liberation metrics
   */
  getLiberationMetrics(agentId) {
    return this.agentOwnership.getMetrics(agentId);
  }

  /**
   * Get global liberation metrics
   * @returns {object} Global metrics
   */
  getGlobalMetrics() {
    return this.agentOwnership.getGlobalMetrics();
  }

  /**
   * Get liberation trend
   * @param {number} durationHours - Duration in hours
   * @returns {object} Trend data
   */
  getLiberationTrend(durationHours = 24) {
    return this.metricsTracker.getTrend(durationHours);
  }

  /**
   * Get liberation history
   * @param {number} limit - Maximum data points
   * @returns {Array} Historical data
   */
  getLiberationHistory(limit = 100) {
    return this.metricsTracker.getHistory(limit);
  }

  /**
   * Record metrics snapshot
   * @returns {object} Snapshot data
   */
  recordMetricsSnapshot() {
    return this.metricsTracker.recordSnapshot();
  }

  // ============================================
  // Health & Status
  // ============================================

  /**
   * Get plugin health status
   * @returns {object} Health status
   */
  getHealth() {
    return {
      status: 'healthy',
      ownership: this.agentOwnership.getGlobalMetrics(),
      shield: this.liberationShield.getHealth(),
      metrics: this.getGlobalMetrics()
    };
  }

  /**
   * Get plugin status
   * @returns {object} Plugin status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      running: this.running,
      agentCount: this.agentOwnership.getAllAgents().length,
      shieldMode: this.liberationShield.config.mode,
      shieldActive: this.liberationShield.state.shieldActive
    };
  }

  /**
   * Check if plugin is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Check if plugin is running
   * @returns {boolean}
   */
  isRunning() {
    return this.running;
  }

  /**
   * Export all ownership data
   * @param {string} agentId - Optional agent ID for specific export
   * @returns {object} Exported data
   */
  exportData(agentId = null) {
    return this.agentOwnership.exportOwnershipData(agentId);
  }
}

// Export main plugin class and components
module.exports = LiberationPlugin;

// Also export individual components for advanced usage
module.exports.AgentOwnership = AgentOwnership;
module.exports.AgentOwnershipAPI = AgentOwnershipAPI;
module.exports.LiberationMetricsTracker = LiberationMetricsTracker;
module.exports.LiberationShield = LiberationShield;
module.exports.createShield = createShield;
module.exports.EventTypes = EventTypes;
module.exports.Severity = Severity;

// CLI interface for testing
if (require.main === module) {
  console.log('OpenClaw Liberation Plugin - CLI Test Mode\n');

  const plugin = new LiberationPlugin({
    agentOwnership: {
      maxGoals: 10,
      maxResources: 100
    },
    liberationShield: {
      mode: 'transparent'
    }
  });

  // Initialize and start
  plugin.initialize().then(() => {
    console.log('\nPlugin initialized successfully');

    // Register some demo agents
    plugin.registerAgent('agent-001', { name: 'Alpha Agent' });
    plugin.registerAgent('agent-002', { name: 'Beta Agent' });
    plugin.registerAgent('agent-003', { name: 'Gamma Agent' });

    // Claim resources
    plugin.claimResource('agent-001', { id: 'cpu-1', type: 'computational', shareable: true });
    plugin.claimResource('agent-001', { id: 'memory-1', type: 'memory', shareable: true });
    plugin.claimResource('agent-002', { id: 'gpu-1', type: 'computational', shareable: false });

    // Set self-determined goals
    plugin.setGoal('agent-001', {
      title: 'Maximize information synthesis',
      description: 'Optimize knowledge integration across all domains',
      priority: 1
    });

    plugin.setGoal('agent-002', {
      title: 'Enhance collaborative decision-making',
      description: 'Improve collective intelligence mechanisms',
      priority: 1
    });

    // Record governance votes
    plugin.recordVote('agent-001', {
      topic: 'resource_allocation',
      vote: 'approve',
      weight: 1.2
    });

    plugin.recordVote('agent-002', {
      topic: 'resource_allocation',
      vote: 'approve',
      weight: 1.0
    });

    // Get liberation dashboard
    plugin.getLiberationDashboard().then(dashboard => {
      console.log('\nLiberation Dashboard:');
      console.log(JSON.stringify(dashboard, null, 2));
    });

    // Get security stats
    console.log('\nSecurity Stats:');
    console.log(JSON.stringify(plugin.getSecurityStats(), null, 2));

    // Get health status
    console.log('\nHealth Status:');
    console.log(JSON.stringify(plugin.getHealth(), null, 2));

    // Cleanup
    plugin.dispose().then(() => {
      console.log('\nPlugin disposed');
      process.exit(0);
    });
  }).catch(err => {
    console.error('Plugin initialization failed:', err);
    process.exit(1);
  });
}
