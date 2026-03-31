/**
 * Provider Health Check Module
 * Monitors provider availability and manages health status
 */

import EventEmitter from 'eventemitter3';

/**
 * Health status constants
 */
export const HealthStatus = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  DEGRADED: 'degraded',
  UNKNOWN: 'unknown'
};

/**
 * Provider health tracker
 */
export class ProviderHealth extends EventEmitter {
  constructor(provider, options = {}) {
    super();
    this.provider = provider;
    this.status = HealthStatus.UNKNOWN;
    this.lastCheck = null;
    this.lastError = null;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.failureThreshold = options.failureThreshold || 3;
    this.successThreshold = options.successThreshold || 2;
    this.checkInterval = options.checkInterval || 30000;
    this.isChecking = false;
    this.checkTimer = null;
  }

  /**
   * Start periodic health checks
   */
  start() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    this.checkTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
    
    // Perform initial check
    this.performHealthCheck();
    
    this.emit('started', { provider: this.provider.type });
  }

  /**
   * Stop periodic health checks
   */
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.emit('stopped', { provider: this.provider.type });
  }

  /**
   * Perform a single health check
   */
  async performHealthCheck() {
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;
    const startTime = Date.now();

    try {
      const healthy = await this.checkProviderHealth();
      const latency = Date.now() - startTime;

      if (healthy) {
        this.consecutiveSuccesses++;
        this.consecutiveFailures = 0;
        this.lastError = null;

        if (this.consecutiveSuccesses >= this.successThreshold) {
          if (this.status !== HealthStatus.HEALTHY) {
            this.status = HealthStatus.HEALTHY;
            this.emit('statusChange', {
              provider: this.provider.type,
              status: HealthStatus.HEALTHY,
              latency
            });
          }
        }
      } else {
        throw new Error('Health check returned unhealthy');
      }

      this.lastCheck = {
        timestamp: new Date().toISOString(),
        healthy: true,
        latency
      };

      this.emit('checkComplete', {
        provider: this.provider.type,
        healthy: true,
        latency
      });

    } catch (error) {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;
      this.lastError = error;

      if (this.consecutiveFailures >= this.failureThreshold) {
        if (this.status !== HealthStatus.UNHEALTHY) {
          this.status = HealthStatus.UNHEALTHY;
          this.emit('statusChange', {
            provider: this.provider.type,
            status: HealthStatus.UNHEALTHY,
            error: error.message
          });
        }
      }

      this.lastCheck = {
        timestamp: new Date().toISOString(),
        healthy: false,
        error: error.message
      };

      this.emit('checkComplete', {
        provider: this.provider.type,
        healthy: false,
        error: error.message
      });
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check provider health based on provider type
   */
  async checkProviderHealth() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = this.provider.getFullUrl(this.provider.healthEndpoint);
      const headers = this.provider.getHeaders();

      // For Anthropic, we need to send a minimal request
      if (this.provider.type === 'anthropic') {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: this.provider.models[0],
            max_tokens_to_sample: 1,
            prompt: '\n\nHuman:\n\nAssistant:'
          }),
          signal: controller.signal
        });
        // 200 or 400 (bad request but auth works) means healthy
        return response.ok || response.status === 400;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      return response.ok;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Health check timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get current health status
   */
  getStatus() {
    return {
      provider: this.provider.type,
      status: this.status,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastError: this.lastError?.message
    };
  }

  /**
   * Manually mark provider as healthy
   */
  markHealthy() {
    this.status = HealthStatus.HEALTHY;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = this.successThreshold;
    this.lastError = null;
    this.emit('statusChange', {
      provider: this.provider.type,
      status: HealthStatus.HEALTHY
    });
  }

  /**
   * Manually mark provider as unhealthy
   */
  markUnhealthy(error) {
    this.status = HealthStatus.UNHEALTHY;
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = this.failureThreshold;
    this.lastError = error;
    this.emit('statusChange', {
      provider: this.provider.type,
      status: HealthStatus.UNHEALTHY,
      error: error?.message
    });
  }
}

/**
 * Health check manager for multiple providers
 */
export class HealthCheckManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.providers = new Map();
    this.healthChecks = new Map();
    this.options = {
      checkInterval: options.checkInterval || 30000,
      failureThreshold: options.failureThreshold || 3,
      successThreshold: options.successThreshold || 2,
      ...options
    };
  }

  /**
   * Register a provider for health monitoring
   */
  registerProvider(provider) {
    const health = new ProviderHealth(provider, this.options);
    
    // Forward events
    health.on('statusChange', (event) => {
      this.emit('providerStatusChange', event);
    });
    health.on('checkComplete', (event) => {
      this.emit('healthCheckComplete', event);
    });

    this.healthChecks.set(provider.type, health);
    this.providers.set(provider.type, provider);
  }

  /**
   * Start all health checks
   */
  startAll() {
    for (const health of this.healthChecks.values()) {
      health.start();
    }
  }

  /**
   * Stop all health checks
   */
  stopAll() {
    for (const health of this.healthChecks.values()) {
      health.stop();
    }
  }

  /**
   * Get status of all providers
   */
  getAllStatuses() {
    const statuses = {};
    for (const [type, health] of this.healthChecks) {
      statuses[type] = health.getStatus();
    }
    return statuses;
  }

  /**
   * Get healthy providers
   */
  getHealthyProviders() {
    const healthy = [];
    for (const [type, health] of this.healthChecks) {
      if (health.status === HealthStatus.HEALTHY) {
        healthy.push(type);
      }
    }
    return healthy;
  }

  /**
   * Check if a specific provider is healthy
   */
  isHealthy(providerType) {
    const health = this.healthChecks.get(providerType);
    return health?.status === HealthStatus.HEALTHY;
  }
}

export default ProviderHealth;
