/**
 * {{pluginDisplayName}}
 * 
 * @module {{pluginName}}
 * @version 1.0.0
 */

import EventEmitter from 'eventemitter3';

/**
 * Plugin class
 */
export class {{pluginDisplayName}}Plugin extends EventEmitter {
  /**
   * Plugin name
   * @type {string}
   */
  name = '{{pluginName}}';

  /**
   * Plugin version
   * @type {string}
   */
  version = '1.0.0';

  /**
   * Gateway instance
   * @type {Object}
   */
  gateway = null;

  /**
   * Plugin configuration
   * @type {Object}
   */
  config = {};

  /**
   * Default configuration
   * @type {Object}
   */
  defaultConfig = {
    enabled: true,
    timeout: 30000,
    debug: false
  };

  /**
   * Initialize the plugin
   * @param {Object} gateway - Gateway instance
   * @param {Object} options - Plugin options
   * @returns {Promise<{{pluginDisplayName}}Plugin>}
   */
  async initialize(gateway, options = {}) {
    this.gateway = gateway;
    this.config = { ...this.defaultConfig, ...options };
    
    // Register with Gateway
    await this.registerWithGateway();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.emit('initialized', { name: this.name, version: this.version });
    
    return this;
  }

  /**
   * Register with Gateway
   * @private
   */
  async registerWithGateway() {
    // Register plugin tools
    if (this.gateway.tools) {
      const tools = await this.getTools();
      for (const tool of tools) {
        this.gateway.tools.register(tool);
      }
    }
    
    // Register plugin skills
    if (this.gateway.skills) {
      const skills = await this.getSkills();
      for (const skill of skills) {
        this.gateway.skills.register(skill);
      }
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for Gateway events
    this.gateway?.on('agent:message', this.handleMessage.bind(this));
    this.gateway?.on('agent:started', this.handleAgentStarted.bind(this));
  }

  /**
   * Start the plugin
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.config.enabled) {
      this.emit('disabled', { reason: 'Plugin disabled in configuration' });
      return;
    }
    
    this.emit('started', { name: this.name });
  }

  /**
   * Stop the plugin
   * @returns {Promise<void>}
   */
  async stop() {
    this.emit('stopped', { name: this.name });
  }

  /**
   * Get plugin tools
   * @returns {Promise<Array>}
   */
  async getTools() {
    return [
      {
        name: '{{pluginName}}-tool',
        description: 'A basic tool from {{pluginDisplayName}}',
        parameters: {
          message: { type: 'string', required: true, description: 'Message to process' }
        },
        handler: async (params, context) => {
          return this.executeTool(params, context);
        }
      }
    ];
  }

  /**
   * Get plugin skills
   * @returns {Promise<Array>}
   */
  async getSkills() {
    return [];
  }

  /**
   * Handle agent messages
   * @param {Object} message - Message object
   */
  async handleMessage(message) {
    if (this.config.debug) {
      console.log(`[{{pluginName}}] Message received:`, message);
    }
  }

  /**
   * Handle agent started event
   * @param {Object} agent - Agent object
   */
  async handleAgentStarted(agent) {
    if (this.config.debug) {
      console.log(`[{{pluginName}}] Agent started:`, agent.id);
    }
  }

  /**
   * Execute tool
   * @param {Object} params - Tool parameters
   * @param {Object} context - Execution context
   * @returns {Promise<Object>}
   */
  async executeTool(params, context) {
    // Tool implementation
    return { 
      success: true, 
      data: params,
      plugin: this.name,
      timestamp: Date.now()
    };
  }

  /**
   * Get plugin status
   * @returns {Object}
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      enabled: this.config.enabled,
      running: true,
      config: this.config
    };
  }

  /**
   * Shutdown the plugin
   * @returns {Promise<void>}
   */
  async shutdown() {
    await this.stop();
    this.removeAllListeners();
    this.emit('shutdown');
  }
}

/**
 * Create plugin instance
 * @param {Object} options - Plugin options
 * @returns {Promise<{{pluginDisplayName}}Plugin>}
 */
export async function createPlugin(options = {}) {
  const plugin = new {{pluginDisplayName}}Plugin();
  return plugin;
}

export default {{pluginDisplayName}}Plugin;
