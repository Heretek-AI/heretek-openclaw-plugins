/**
 * {{pluginDisplayName}}
 * 
 * @module {{pluginName}}
 * @version 1.0.0
 */

import EventEmitter from 'eventemitter3';
import { {{skillName}} } from './skills/{{skillName}}.js';

/**
 * Skill Plugin class
 */
export class {{pluginDisplayName}}Plugin extends EventEmitter {
  name = '{{pluginName}}';
  version = '1.0.0';
  gateway = null;
  config = {};

  defaultConfig = {
    enabled: true,
    timeout: 30000,
    debug: false,
    skills: {}
  };

  /**
   * Initialize the plugin
   * @param {Object} gateway - Gateway instance
   * @param {Object} options - Plugin options
   */
  async initialize(gateway, options = {}) {
    this.gateway = gateway;
    this.config = { ...this.defaultConfig, ...options };
    
    await this.registerWithGateway();
    this.setupEventListeners();
    
    this.emit('initialized', { name: this.name, version: this.version });
    
    return this;
  }

  async registerWithGateway() {
    if (this.gateway.skills) {
      const skills = await this.getSkills();
      for (const skill of skills) {
        this.gateway.skills.register(skill);
      }
    }
  }

  setupEventListeners() {
    this.gateway?.on('agent:message', this.handleMessage.bind(this));
  }

  async start() {
    if (!this.config.enabled) {
      this.emit('disabled', { reason: 'Plugin disabled' });
      return;
    }
    
    this.emit('started', { name: this.name });
  }

  async stop() {
    this.emit('stopped', { name: this.name });
  }

  /**
   * Get plugin skills
   * @returns {Promise<Array>}
   */
  async getSkills() {
    return [
      {
        name: '{{skillName}}',
        description: '{{skillDescription}}',
        parameters: {
          query: { 
            type: 'string', 
            required: true, 
            description: 'Query to process' 
          },
          options: { 
            type: 'object', 
            required: false, 
            description: 'Additional options',
            default: {}
          }
        },
        handler: async (params, context) => {
          return {{skillName}}(params, context);
        }
      }
    ];
  }

  async getTools() {
    return [];
  }

  async handleMessage(message) {
    if (this.config.debug) {
      console.log(`[{{pluginName}}] Message:`, message);
    }
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      enabled: this.config.enabled,
      running: true,
      skills: (await this.getSkills()).map(s => s.name)
    };
  }

  async shutdown() {
    await this.stop();
    this.removeAllListeners();
    this.emit('shutdown');
  }
}

export async function createPlugin(options = {}) {
  const plugin = new {{pluginDisplayName}}Plugin();
  return plugin;
}

export default {{pluginDisplayName}}Plugin;
