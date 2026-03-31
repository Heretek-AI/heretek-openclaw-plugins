/**
 * SwarmClaw Integration Plugin for Heretek OpenClaw
 * 
 * Provides multi-provider LLM access with automatic failover:
 * OpenAI → Anthropic → Google → Ollama (Local)
 * 
 * @module @heretek-ai/swarmclaw-integration-plugin
 */

import EventEmitter from 'eventemitter3';
import { FailoverManager, FailoverEvents, RequestType } from './failover-manager.js';
import { ProviderConfig, ProviderType, createProviderConfigs, defaultProviderConfigs } from './provider-config.js';
import { HealthCheckManager, HealthStatus, ProviderHealth } from './healthcheck.js';

/**
 * Plugin version
 */
export const VERSION = '1.0.0';

/**
 * Plugin name identifier
 */
export const PLUGIN_NAME = 'swarmclaw-integration';

/**
 * SwarmClaw Integration Plugin Class
 * 
 * Main entry point for the plugin, providing:
 * - Multi-provider chat completions with automatic failover
 * - Embedding generation with provider fallback
 * - Real-time health monitoring
 * - Provider statistics and metrics
 * - Event-driven architecture for integration
 */
export class SwarmClawPlugin extends EventEmitter {
  constructor(options = {}) {
    super();
    this.version = VERSION;
    this.name = PLUGIN_NAME;
    this.initialized = false;
    
    this.failoverManager = new FailoverManager({
      maxRetries: options.maxRetries || 2,
      retryDelay: options.retryDelay || 1000,
      backoffMultiplier: options.backoffMultiplier || 2,
      healthCheckInterval: options.healthCheckInterval || 30000,
      failureThreshold: options.failureThreshold || 3,
      successThreshold: options.successThreshold || 2,
      failoverOrder: options.failoverOrder || [
        ProviderType.OPENAI,
        ProviderType.ANTHROPIC,
        ProviderType.GOOGLE,
        ProviderType.OLLAMA
      ]
    });

    // Forward failover events
    this.failoverManager.on(FailoverEvents.PROVIDER_SELECTED, (event) => {
      this.emit('providerSelected', event);
    });
    this.failoverManager.on(FailoverEvents.PROVIDER_FAILED, (event) => {
      this.emit('providerFailed', event);
    });
    this.failoverManager.on(FailoverEvents.FAILOVER_TRIGGERED, (event) => {
      this.emit('failoverTriggered', event);
    });
    this.failoverManager.on(FailoverEvents.ALL_PROVIDERS_FAILED, (event) => {
      this.emit('allProvidersFailed', event);
    });
    this.failoverManager.on(FailoverEvents.PROVIDER_RECOVERED, (event) => {
      this.emit('providerRecovered', event);
    });
  }

  /**
   * Initialize the plugin
   * 
   * @param {Object} options - Initialization options
   * @param {string[]} options.failoverOrder - Order of providers for failover
   * @param {boolean} options.startHealthMonitoring - Whether to start health checks
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    if (this.initialized) {
      throw new Error('Plugin already initialized');
    }

    // Create provider configurations from environment
    const providers = createProviderConfigs();
    
    // Register providers with failover manager
    for (const [type, config] of providers) {
      this.failoverManager.registerProvider(config);
      this.emit('providerRegistered', { type, name: config.name, configured: config.isConfigured() });
    }

    // Start health monitoring if requested
    if (options.startHealthMonitoring !== false) {
      this.failoverManager.startHealthMonitoring();
    }

    this.initialized = true;
    this.emit('initialized', { 
      providerCount: providers.size,
      failoverOrder: this.failoverManager.failoverOrder
    });
  }

  /**
   * Send a chat message with automatic failover
   * 
   * @param {Array<Object>} messages - Array of message objects {role, content}
   * @param {Object} options - Chat options
   * @param {string} options.model - Specific model to use (optional)
   * @param {number} options.temperature - Temperature setting
   * @param {number} options.maxTokens - Maximum tokens to generate
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<Object>} Chat response with content, usage, and provider info
   */
  async chat(messages, options = {}) {
    if (!this.initialized) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    return this.failoverManager.chat(messages, options);
  }

  /**
   * Generate embeddings with automatic failover
   * 
   * @param {string} text - Text to embed
   * @param {Object} options - Embedding options
   * @param {string} options.model - Specific embedding model to use
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<Object>} Embedding response with vector and metadata
   */
  async embed(text, options = {}) {
    if (!this.initialized) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    return this.failoverManager.embed(text, options);
  }

  /**
   * Execute a custom request with failover
   * 
   * @param {Function} requestFn - Async function that takes provider config
   * @param {Object} options - Execution options
   * @param {string} options.requestType - Type of request (chat, embedding)
   * @returns {Promise<any>} Result from request function
   */
  async executeWithFailover(requestFn, options = {}) {
    if (!this.initialized) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    return this.failoverManager.executeWithFailover(requestFn, options);
  }

  /**
   * Get plugin status and health information
   * 
   * @returns {Object} Status object with providers, health, and stats
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.initialized,
      ...this.failoverManager.getStatus()
    };
  }

  /**
   * Get health status for a specific provider
   * 
   * @param {string} providerType - Provider type (openai, anthropic, google, ollama)
   * @returns {Object} Health status object
   */
  getProviderHealth(providerType) {
    return this.failoverManager.healthManager.healthChecks.get(providerType)?.getStatus();
  }

  /**
   * Get statistics for providers
   * 
   * @param {string} providerType - Optional specific provider type
   * @returns {Object|Map} Provider statistics
   */
  getStats(providerType) {
    return this.failoverManager.getProviderStats(providerType);
  }

  /**
   * Manually mark a provider as healthy
   * 
   * @param {string} providerType - Provider type to mark healthy
   */
  markProviderHealthy(providerType) {
    const health = this.failoverManager.healthManager.healthChecks.get(providerType);
    if (health) {
      health.markHealthy();
    }
  }

  /**
   * Manually mark a provider as unhealthy
   * 
   * @param {string} providerType - Provider type to mark unhealthy
   * @param {Error} error - Optional error causing unhealthy status
   */
  markProviderUnhealthy(providerType, error) {
    const health = this.failoverManager.healthManager.healthChecks.get(providerType);
    if (health) {
      health.markUnhealthy(error);
    }
  }

  /**
   * Add a new provider configuration
   * 
   * @param {ProviderConfig} provider - Provider configuration
   */
  addProvider(provider) {
    if (!(provider instanceof ProviderConfig)) {
      throw new Error('Provider must be a ProviderConfig instance');
    }
    this.failoverManager.registerProvider(provider);
  }

  /**
   * Remove a provider
   * 
   * @param {string} providerType - Provider type to remove
   */
  removeProvider(providerType) {
    this.failoverManager.providers.delete(providerType);
    this.failoverManager.providerStats.delete(providerType);
    this.failoverManager.healthManager.healthChecks.delete(providerType);
  }

  /**
   * Update failover order
   * 
   * @param {string[]} newOrder - New failover order array
   */
  setFailoverOrder(newOrder) {
    this.failoverManager.failoverOrder = newOrder;
  }

  /**
   * Get current failover order
   * 
   * @returns {string[]} Current failover order
   */
  getFailoverOrder() {
    return [...this.failoverManager.failoverOrder];
  }

  /**
   * Shutdown the plugin
   */
  async shutdown() {
    this.failoverManager.stopHealthMonitoring();
    this.initialized = false;
    this.emit('shutdown');
  }
}

/**
 * Create and initialize a new plugin instance
 * 
 * @param {Object} options - Plugin options
 * @returns {Promise<SwarmClawPlugin>} Initialized plugin instance
 */
export async function createPlugin(options = {}) {
  const plugin = new SwarmClawPlugin(options);
  await plugin.initialize(options);
  return plugin;
}

/**
 * Default export for CommonJS compatibility
 */
export default {
  SwarmClawPlugin,
  createPlugin,
  ProviderConfig,
  ProviderType,
  createProviderConfigs,
  defaultProviderConfigs,
  FailoverManager,
  FailoverEvents,
  RequestType,
  HealthCheckManager,
  HealthStatus,
  ProviderHealth,
  VERSION,
  PLUGIN_NAME
};

// Export for both ESM and CommonJS
export {
  FailoverManager,
  FailoverEvents,
  RequestType,
  ProviderConfig,
  ProviderType,
  createProviderConfigs,
  defaultProviderConfigs,
  HealthCheckManager,
  HealthStatus,
  ProviderHealth
};
