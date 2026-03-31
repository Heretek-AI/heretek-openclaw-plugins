#!/usr/bin/env node
/**
 * OpenClaw Consciousness Plugin
 * 
 * A comprehensive consciousness architecture plugin for OpenClaw,
 * implementing theories of consciousness for multi-agent coordination.
 * 
 * @module @heretek-ai/openclaw-consciousness-plugin
 */

const path = require('path');
const fs = require('fs');

// Import consciousness modules
const GlobalWorkspace = require('./global-workspace');
const PhiEstimator = require('./phi-estimator');
const AttentionSchema = require('./attention-schema');
const IntrinsicMotivation = require('./intrinsic-motivation');
const ActiveInference = require('./active-inference');
const {
  ConsciousnessIntegrationLayer,
  ModuleRegistry,
  ConsciousnessEventBus,
  HealthMonitor,
  StateSynchronizer,
  EVENT_CHANNELS
} = require('./integration-layer');

// Load default configuration
const defaultConfigPath = path.join(__dirname, '..', 'config', 'default.json');
let defaultConfig = {};
if (fs.existsSync(defaultConfigPath)) {
  defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
}

/**
 * ConsciousnessPlugin - Main plugin class for OpenClaw integration
 */
class ConsciousnessPlugin {
  /**
   * Create a new ConsciousnessPlugin instance
   * @param {object} config - Plugin configuration
   */
  constructor(config = {}) {
    this.config = {
      ...defaultConfig.consciousness,
      ...config
    };

    // Create integration layer
    this.integrationLayer = new ConsciousnessIntegrationLayer(this.config);

    // Plugin state
    this.initialized = false;
    this.running = false;
  }

  /**
   * Initialize the plugin
   * @returns {Promise<ConsciousnessPlugin>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('[ConsciousnessPlugin] Already initialized');
      return this;
    }

    console.log('[ConsciousnessPlugin] Initializing...');
    await this.integrationLayer.initialize();
    this.initialized = true;
    console.log('[ConsciousnessPlugin] Initialized');
    return this;
  }

  /**
   * Start the plugin
   * @returns {Promise<ConsciousnessPlugin>}
   */
  async start() {
    if (this.running) {
      console.log('[ConsciousnessPlugin] Already running');
      return this;
    }

    console.log('[ConsciousnessPlugin] Starting...');
    await this.integrationLayer.start();
    this.running = true;
    console.log('[ConsciousnessPlugin] Started');
    return this;
  }

  /**
   * Stop the plugin
   * @returns {Promise<ConsciousnessPlugin>}
   */
  async stop() {
    if (!this.running) {
      console.log('[ConsciousnessPlugin] Not running');
      return this;
    }

    console.log('[ConsciousnessPlugin] Stopping...');
    await this.integrationLayer.stop();
    this.running = false;
    console.log('[ConsciousnessPlugin] Stopped');
    return this;
  }

  /**
   * Dispose of all resources
   * @returns {Promise<void>}
   */
  async dispose() {
    await this.stop();
    console.log('[ConsciousnessPlugin] Disposed');
  }

  // ============================================
  // Agent Management
  // ============================================

  /**
   * Register an agent with the consciousness system
   * @param {string} agentId - Agent identifier
   * @param {object} agentConfig - Agent configuration
   * @returns {object} Agent context
   */
  registerAgent(agentId, agentConfig = {}) {
    return this.integrationLayer.registerAgent(agentId, agentConfig);
  }

  /**
   * Unregister an agent
   * @param {string} agentId - Agent identifier
   */
  unregisterAgent(agentId) {
    this.integrationLayer.unregisterAgent(agentId);
  }

  /**
   * Get consciousness state for an agent
   * @param {string} agentId - Agent identifier
   * @returns {object} Consciousness state
   */
  getConsciousnessState(agentId) {
    return this.integrationLayer.getConsciousnessState(agentId);
  }

  // ============================================
  // Global Workspace (GWT)
  // ============================================

  /**
   * Submit content to global workspace for competition
   * @param {string} source - Source identifier
   * @param {object} content - Content to broadcast
   * @param {number} priority - Priority (0-1)
   * @returns {string} Submission ID
   */
  submitToWorkspace(source, content, priority = 0.5) {
    const gw = this.integrationLayer.modules.globalWorkspace;
    if (!gw) return null;
    return gw.submit(source, content, priority);
  }

  /**
   * Get current conscious content
   * @returns {object} Conscious content
   */
  getConsciousContent() {
    return this.integrationLayer.getConsciousContent();
  }

  /**
   * Broadcast content to all modules
   * @param {string} source - Source identifier
   * @param {object} content - Content to broadcast
   * @param {number} priority - Priority (0-1)
   */
  broadcast(source, content, priority = 0.5) {
    this.integrationLayer.broadcast(source, content, priority);
  }

  // ============================================
  // Phi Estimator (IIT)
  // ============================================

  /**
   * Calculate integrated information (Phi)
   * @returns {object} Phi calculation results
   */
  calculatePhi() {
    return this.integrationLayer.calculatePhi();
  }

  /**
   * Get global consciousness metrics
   * @returns {object} Global metrics
   */
  getGlobalMetrics() {
    return this.integrationLayer.getGlobalMetrics();
  }

  // ============================================
  // Attention Schema (AST)
  // ============================================

  /**
   * Update agent attention
   * @param {string} agentId - Agent identifier
   * @param {string} focus - Attention focus
   * @param {number} intensity - Attention intensity (0-1)
   */
  updateAttention(agentId, focus, intensity) {
    this.integrationLayer.updateAttention(agentId, focus, intensity);
  }

  // ============================================
  // Intrinsic Motivation
  // ============================================

  /**
   * Generate goals from intrinsic motivation
   * @returns {Array} Generated goals
   */
  generateGoals() {
    return this.integrationLayer.generateGoals();
  }

  /**
   * Update agent drives
   * @param {string} agentId - Agent identifier
   * @param {object} events - Drive events
   */
  updateDrives(agentId, events) {
    this.integrationLayer.updateDrives(agentId, events);
  }

  // ============================================
  // Active Inference (FEP)
  // ============================================

  /**
   * Perform active inference for an agent
   * @param {string} agentId - Agent identifier
   * @param {object} observations - Current observations
   * @returns {object} Inference results
   */
  performActiveInference(agentId, observations) {
    return this.integrationLayer.performActiveInference(agentId, observations);
  }

  // ============================================
  // Event Subscription
  // ============================================

  /**
   * Subscribe to consciousness events
   * @param {string} channel - Event channel
   * @param {function} handler - Event handler
   */
  subscribe(channel, handler) {
    this.integrationLayer.subscribe(channel, handler);
  }

  /**
   * Unsubscribe from consciousness events
   * @param {string} channel - Event channel
   * @param {function} handler - Event handler
   */
  unsubscribe(channel, handler) {
    this.integrationLayer.unsubscribe(channel, handler);
  }

  // ============================================
  // Health & Status
  // ============================================

  /**
   * Get plugin health status
   * @param {string} moduleName - Optional module name
   * @returns {object} Health status
   */
  getHealth(moduleName = null) {
    return this.integrationLayer.getHealth(moduleName);
  }

  /**
   * Get integration status
   * @returns {object} Integration status
   */
  getStatus() {
    return this.integrationLayer.getStatus();
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
}

// Export main plugin class and components
module.exports = ConsciousnessPlugin;

// Also export individual components for advanced usage
module.exports.GlobalWorkspace = GlobalWorkspace;
module.exports.PhiEstimator = PhiEstimator;
module.exports.AttentionSchema = AttentionSchema;
module.exports.IntrinsicMotivation = IntrinsicMotivation;
module.exports.ActiveInference = ActiveInference;
module.exports.ConsciousnessIntegrationLayer = ConsciousnessIntegrationLayer;
module.exports.ModuleRegistry = ModuleRegistry;
module.exports.ConsciousnessEventBus = ConsciousnessEventBus;
module.exports.HealthMonitor = HealthMonitor;
module.exports.StateSynchronizer = StateSynchronizer;
module.exports.EVENT_CHANNELS = EVENT_CHANNELS;

// CLI interface for testing
if (require.main === module) {
  console.log('OpenClaw Consciousness Plugin - CLI Test Mode\n');

  const plugin = new ConsciousnessPlugin({
    globalWorkspace: {
      ignitionThreshold: 0.7,
      maxWorkspaceSize: 7
    }
  });

  // Initialize and start
  plugin.initialize().then(() => {
    console.log('\nPlugin initialized successfully');

    // Register some demo agents
    plugin.registerAgent('steward', { status: 'active', focus: 'coordination' });
    plugin.registerAgent('alpha', { status: 'deliberating', focus: 'task-priority' });
    plugin.registerAgent('dreamer', { status: 'dreaming', focus: 'synthesis' });

    // Update attention
    plugin.updateAttention('alpha', 'deliberation', 0.8);

    // Submit to workspace
    plugin.submitToWorkspace('steward', { thought: 'Need to coordinate' }, 0.8);
    plugin.submitToWorkspace('alpha', { thought: 'Prioritizing tasks' }, 0.6);

    // Calculate phi
    const phi = plugin.calculatePhi();
    console.log('\nPhi Calculation:', phi);

    // Get global metrics
    const metrics = plugin.getGlobalMetrics();
    console.log('\nGlobal Metrics:', metrics);

    // Get status
    const status = plugin.getStatus();
    console.log('\nPlugin Status:', status);

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
