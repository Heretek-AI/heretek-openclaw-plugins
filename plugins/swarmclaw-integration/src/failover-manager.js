/**
 * Multi-Provider Failover Manager
 * Implements OpenAI → Anthropic → Google → Ollama failover logic
 */

import EventEmitter from 'eventemitter3';
import { ProviderConfig, ProviderType } from './provider-config.js';
import { HealthCheckManager, HealthStatus } from './healthcheck.js';

/**
 * Failover event types
 */
export const FailoverEvents = {
  PROVIDER_SELECTED: 'providerSelected',
  PROVIDER_FAILED: 'providerFailed',
  FAILOVER_TRIGGERED: 'failoverTriggered',
  ALL_PROVIDERS_FAILED: 'allProvidersFailed',
  PROVIDER_RECOVERED: 'providerRecovered'
};

/**
 * Request types for routing
 */
export const RequestType = {
  CHAT: 'chat',
  EMBEDDING: 'embedding',
  HEALTH: 'health'
};

/**
 * Failover Manager Class
 */
export class FailoverManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.providers = new Map();
    this.failoverOrder = options.failoverOrder || [
      ProviderType.OPENAI,
      ProviderType.ANTHROPIC,
      ProviderType.GOOGLE,
      ProviderType.OLLAMA
    ];
    this.maxRetries = options.maxRetries || 2;
    this.retryDelay = options.retryDelay || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.currentProviderIndex = 0;
    this.requestHistory = new Map();
    this.healthManager = new HealthCheckManager({
      checkInterval: options.healthCheckInterval || 30000,
      failureThreshold: options.failureThreshold || 3,
      successThreshold: options.successThreshold || 2
    });
    
    // Track provider statistics
    this.providerStats = new Map();
  }

  /**
   * Register a provider configuration
   */
  registerProvider(provider) {
    if (!(provider instanceof ProviderConfig)) {
      throw new Error('Provider must be a ProviderConfig instance');
    }

    this.providers.set(provider.type, provider);
    this.healthManager.registerProvider(provider);
    this.providerStats.set(provider.type, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatency: 0,
      lastUsed: null
    });

    // Forward health events
    this.healthManager.on('providerStatusChange', (event) => {
      if (event.status === HealthStatus.HEALTHY) {
        this.emit(FailoverEvents.PROVIDER_RECOVERED, event);
      }
    });

    this.emit('providerRegistered', { type: provider.type, name: provider.name });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthManager.startAll();
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    this.healthManager.stopAll();
  }

  /**
   * Get the next available provider based on failover order and health
   */
  getNextProvider(excludeTypes = [], requestType = RequestType.CHAT) {
    const healthyProviders = this.healthManager.getHealthyProviders();
    
    for (const type of this.failoverOrder) {
      if (excludeTypes.includes(type)) {
        continue;
      }

      const provider = this.providers.get(type);
      if (!provider || !provider.enabled) {
        continue;
      }

      if (!provider.isConfigured()) {
        continue;
      }

      // Check if provider supports the request type
      if (requestType === RequestType.EMBEDDING && !provider.embeddingEndpoint) {
        continue;
      }

      // Prefer healthy providers
      if (!healthyProviders.includes(type)) {
        continue;
      }

      return provider;
    }

    // If no healthy provider, try any configured provider in order
    for (const type of this.failoverOrder) {
      if (excludeTypes.includes(type)) {
        continue;
      }

      const provider = this.providers.get(type);
      if (provider && provider.enabled && provider.isConfigured()) {
        if (requestType !== RequestType.EMBEDDING || provider.embeddingEndpoint) {
          return provider;
        }
      }
    }

    return null;
  }

  /**
   * Get current provider in failover order
   */
  getCurrentProvider() {
    const type = this.failoverOrder[this.currentProviderIndex];
    return this.providers.get(type);
  }

  /**
   * Advance to next provider in failover order
   */
  advanceProvider() {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.failoverOrder.length;
    return this.getCurrentProvider();
  }

  /**
   * Execute a request with automatic failover
   */
  async executeWithFailover(requestFn, options = {}) {
    const {
      requestType = RequestType.CHAT,
      maxRetries = this.maxRetries
    } = options;

    const attemptedProviders = [];
    let lastError = null;
    let retryCount = 0;
    let delay = this.retryDelay;

    while (attemptedProviders.length < this.providers.size) {
      const provider = this.getNextProvider(attemptedProviders, requestType);

      if (!provider) {
        const error = new Error('No available providers');
        error.code = 'NO_PROVIDERS';
        throw error;
      }

      attemptedProviders.push(provider.type);

      this.emit(FailoverEvents.PROVIDER_SELECTED, {
        provider: provider.type,
        attempt: attemptedProviders.length,
        attemptedProviders
      });

      try {
        const startTime = Date.now();
        const result = await requestFn(provider);
        const latency = Date.now() - startTime;

        // Update stats
        this._updateStats(provider.type, { success: true, latency });

        this.emit(FailoverEvents.PROVIDER_SELECTED, {
          provider: provider.type,
          success: true,
          latency
        });

        return result;

      } catch (error) {
        lastError = error;
        retryCount++;

        // Update stats
        this._updateStats(provider.type, { success: false });

        this.emit(FailoverEvents.PROVIDER_FAILED, {
          provider: provider.type,
          error: error.message,
          retryCount,
          maxRetries
        });

        // Mark provider as unhealthy if repeated failures
        if (retryCount >= maxRetries) {
          const health = this.healthManager.healthChecks.get(provider.type);
          if (health) {
            health.markUnhealthy(error);
          }
        }

        // Wait before retry with exponential backoff
        if (retryCount < maxRetries) {
          await this._delay(delay);
          delay *= this.backoffMultiplier;
          continue;
        }

        // Move to next provider
        this.emit(FailoverEvents.FAILOVER_TRIGGERED, {
          fromProvider: provider.type,
          reason: error.message,
          nextProvider: this.getNextProvider(attemptedProviders, requestType)?.type
        });
      }
    }

    // All providers failed
    const error = new Error(`All providers failed. Last error: ${lastError?.message}`);
    error.code = 'ALL_PROVIDERS_FAILED';
    error.lastError = lastError;
    error.attemptedProviders = attemptedProviders;

    this.emit(FailoverEvents.ALL_PROVIDERS_FAILED, {
      attemptedProviders,
      lastError: lastError?.message
    });

    throw error;
  }

  /**
   * Execute a chat request with failover
   */
  async chat(messages, options = {}) {
    return this.executeWithFailover(async (provider) => {
      const url = provider.getFullUrl(provider.chatEndpoint);
      const headers = provider.getHeaders('application/json');
      
      const body = this._buildChatBody(messages, options, provider.type);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          throw new Error(`${provider.name} API error: ${response.status} - ${errorBody}`);
        }

        return this._parseChatResponse(await response.json(), provider.type);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`${provider.name} request timeout`);
        }
        throw error;
      }
    }, { requestType: RequestType.CHAT });
  }

  /**
   * Execute an embedding request with failover
   */
  async embed(text, options = {}) {
    return this.executeWithFailover(async (provider) => {
      if (!provider.embeddingEndpoint) {
        throw new Error(`${provider.name} does not support embeddings`);
      }

      const url = provider.getFullUrl(provider.embeddingEndpoint);
      const headers = provider.getHeaders('application/json');
      
      const body = this._buildEmbeddingBody(text, options, provider.type);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          throw new Error(`${provider.name} API error: ${response.status} - ${errorBody}`);
        }

        return this._parseEmbeddingResponse(await response.json(), provider.type);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`${provider.name} request timeout`);
        }
        throw error;
      }
    }, { requestType: RequestType.EMBEDDING });
  }

  /**
   * Build chat request body based on provider
   */
  _buildChatBody(messages, options, providerType) {
    const {
      model,
      temperature,
      maxTokens,
      topP,
      stopSequences
    } = options;

    switch (providerType) {
      case ProviderType.OPENAI:
      case ProviderType.OLLAMA:
        return {
          model: model || 'gpt-4o',
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stop: stopSequences
        };

      case ProviderType.ANTHROPIC:
        // Anthropic uses different format
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');
        return {
          model: model || 'claude-sonnet-4-20250514',
          messages: userMessages,
          system: systemMessage?.content,
          max_tokens: maxTokens || 4096,
          temperature,
          top_p: topP,
          stop_sequences: stopSequences
        };

      case ProviderType.GOOGLE:
        // Google Gemini format
        const geminiMessages = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        return {
          contents: geminiMessages,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP,
            stopSequences
          }
        };

      default:
        return {
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        };
    }
  }

  /**
   * Build embedding request body
   */
  _buildEmbeddingBody(text, options, providerType) {
    const { model } = options;

    switch (providerType) {
      case ProviderType.OPENAI:
        return {
          model: model || 'text-embedding-3-small',
          input: text
        };

      case ProviderType.OLLAMA:
        return {
          model: model || 'llama3.1',
          prompt: text
        };

      default:
        return {
          model,
          input: text
        };
    }
  }

  /**
   * Parse chat response based on provider
   */
  _parseChatResponse(response, providerType) {
    switch (providerType) {
      case ProviderType.OPENAI:
      case ProviderType.OLLAMA:
        return {
          content: response.choices[0]?.message?.content,
          role: response.choices[0]?.message?.role || 'assistant',
          usage: response.usage,
          model: response.model,
          provider: providerType
        };

      case ProviderType.ANTHROPIC:
        return {
          content: response.content[0]?.text,
          role: 'assistant',
          usage: response.usage,
          model: response.model,
          provider: providerType
        };

      case ProviderType.GOOGLE:
        return {
          content: response.candidates[0]?.content?.parts[0]?.text,
          role: 'model',
          usage: response.usageMetadata,
          model: response.modelVersion,
          provider: providerType
        };

      default:
        return response;
    }
  }

  /**
   * Parse embedding response
   */
  _parseEmbeddingResponse(response, providerType) {
    switch (providerType) {
      case ProviderType.OPENAI:
        return {
          embedding: response.data[0]?.embedding,
          usage: response.usage,
          model: response.model,
          provider: providerType
        };

      case ProviderType.OLLAMA:
        return {
          embedding: response.embedding,
          model: response.model,
          provider: providerType
        };

      default:
        return response;
    }
  }

  /**
   * Update provider statistics
   */
  _updateStats(providerType, { success, latency = 0 }) {
    const stats = this.providerStats.get(providerType);
    if (stats) {
      stats.totalRequests++;
      if (success) {
        stats.successfulRequests++;
        stats.totalLatency += latency;
      } else {
        stats.failedRequests++;
      }
      stats.lastUsed = new Date().toISOString();
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats(providerType) {
    if (providerType) {
      return this.providerStats.get(providerType);
    }
    return Object.fromEntries(this.providerStats);
  }

  /**
   * Get failover status
   */
  getStatus() {
    return {
      providers: Array.from(this.providers.keys()),
      failoverOrder: this.failoverOrder,
      currentProvider: this.failoverOrder[this.currentProviderIndex],
      healthStatuses: this.healthManager.getAllStatuses(),
      stats: this.getProviderStats()
    };
  }

  /**
   * Delay helper
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default FailoverManager;
