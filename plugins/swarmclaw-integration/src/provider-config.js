/**
 * Provider Configuration for SwarmClaw Integration
 * Defines provider endpoints, models, and authentication
 */

import { EventEmitter } from 'eventemitter3';

/**
 * Provider types supported by the integration
 */
export const ProviderType = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama'
};

/**
 * Default provider configurations
 */
export const defaultProviderConfigs = {
  [ProviderType.OPENAI]: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    envPrefix: 'OPENAI',
    defaultModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    chatEndpoint: '/chat/completions',
    embeddingEndpoint: '/embeddings',
    healthEndpoint: '/models'
  },
  [ProviderType.ANTHROPIC]: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    authHeader: 'x-api-key',
    authPrefix: '',
    envPrefix: 'ANTHROPIC',
    defaultModels: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    chatEndpoint: '/v1/messages',
    embeddingEndpoint: null, // Anthropic doesn't have embeddings API
    healthEndpoint: '/v1/complete', // Use a minimal completion for health check
    requiresVersion: '2023-06-01' // Anthropic API version header
  },
  [ProviderType.GOOGLE]: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authHeader: null, // Google uses query param for API key
    authPrefix: '',
    envPrefix: 'GOOGLE',
    defaultModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    chatEndpoint: '/models/{model}:generateContent',
    embeddingEndpoint: '/models/{model}:embedContent',
    healthEndpoint: '/models'
  },
  [ProviderType.OLLAMA]: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    authHeader: null, // No auth required for local Ollama
    authPrefix: '',
    envPrefix: 'OLLAMA',
    defaultModels: ['llama3.1', 'qwen2.5', 'mistral'],
    chatEndpoint: '/api/chat',
    embeddingEndpoint: '/api/embeddings',
    healthEndpoint: '/api/tags'
  }
};

/**
 * Provider configuration class
 */
export class ProviderConfig extends EventEmitter {
  constructor(options = {}) {
    super();
    this.type = options.type;
    this.name = options.name;
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.models = options.models || [];
    this.chatEndpoint = options.chatEndpoint;
    this.embeddingEndpoint = options.embeddingEndpoint;
    this.healthEndpoint = options.healthEndpoint;
    this.authHeader = options.authHeader;
    this.authPrefix = options.authPrefix || '';
    this.requiresVersion = options.requiresVersion;
    this.enabled = options.enabled !== false;
    this.priority = options.priority || 0;
  }

  /**
   * Load provider configuration from environment variables
   */
  static fromEnv(type, options = {}) {
    const defaultConfig = defaultProviderConfigs[type];
    if (!defaultConfig) {
      throw new Error(`Unknown provider type: ${type}`);
    }

    const envPrefix = options.envPrefix || defaultConfig.envPrefix;
    const apiKey = process.env[`${envPrefix}_API_KEY`];
    const baseUrl = process.env[`${envPrefix}_BASE_URL`] || defaultConfig.baseUrl;
    const models = process.env[`${envPrefix}_MODELS`]
      ? process.env[`${envPrefix}_MODELS`].split(',').map(m => m.trim())
      : defaultConfig.defaultModels;

    return new ProviderConfig({
      type,
      name: options.name || defaultConfig.name,
      baseUrl,
      apiKey,
      models,
      chatEndpoint: options.chatEndpoint || defaultConfig.chatEndpoint,
      embeddingEndpoint: options.embeddingEndpoint || defaultConfig.embeddingEndpoint,
      healthEndpoint: options.healthEndpoint || defaultConfig.healthEndpoint,
      authHeader: options.authHeader || defaultConfig.authHeader,
      authPrefix: options.authPrefix || defaultConfig.authPrefix,
      requiresVersion: options.requiresVersion || defaultConfig.requiresVersion,
      enabled: options.enabled !== undefined ? options.enabled : true,
      priority: options.priority || 0
    });
  }

  /**
   * Get the full URL for an endpoint
   */
  getFullUrl(endpoint, model = null) {
    let url = endpoint;
    if (!url.startsWith('http')) {
      url = `${this.baseUrl}${endpoint}`;
    }
    // Replace model placeholder if present
    if (model && url.includes('{model}')) {
      url = url.replace('{model}', model);
    }
    // Add API key as query param for Google
    if (this.type === ProviderType.GOOGLE && this.apiKey) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}key=${this.apiKey}`;
    }
    return url;
  }

  /**
   * Get headers for API requests
   */
  getHeaders(contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType
    };

    if (this.authHeader && this.apiKey) {
      headers[this.authHeader] = `${this.authPrefix}${this.apiKey}`;
    }

    if (this.requiresVersion) {
      headers['anthropic-version'] = this.requiresVersion;
    }

    return headers;
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured() {
    if (!this.enabled) return false;
    if (this.authHeader && !this.apiKey) return false;
    return true;
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    if (!this.type) {
      errors.push('Provider type is required');
    }
    
    if (!this.baseUrl) {
      errors.push('Base URL is required');
    }
    
    if (this.authHeader && !this.apiKey) {
      errors.push(`API key is required for ${this.name}`);
    }
    
    if (!this.models || this.models.length === 0) {
      errors.push('At least one model must be configured');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create provider configurations from environment
 */
export function createProviderConfigs() {
  const providers = new Map();
  const failoverOrder = process.env.SWARMCLAW_FAILOVER_ORDER
    ? process.env.SWARMCLAW_FAILOVER_ORDER.split(',').map(s => s.trim())
    : ['openai', 'anthropic', 'google', 'ollama'];

  let priority = 0;
  for (const type of failoverOrder) {
    if (defaultProviderConfigs[type]) {
      const config = ProviderConfig.fromEnv(type, { priority });
      providers.set(type, config);
      priority++;
    }
  }

  return providers;
}

export default ProviderConfig;
