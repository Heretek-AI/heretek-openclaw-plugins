/**
 * Rate Limiter Module
 * Implements token bucket rate limiting for API requests
 */

const { Mutex } = require('async-mutex');

class RateLimiter {
  constructor(config = {}) {
    this.config = {
      defaultRateLimit: config.defaultRateLimit || 10, // requests per second
      defaultBurstSize: config.defaultBurstSize || 20,
      enablePerServerLimits: config.enablePerServerLimits ?? true,
      ...config
    };

    this.buckets = new Map(); // serverId -> {tokens, lastRefill}
    this.serverConfigs = new Map();
    this.mutex = new Mutex();
    this.requestCount = 0;
    this.throttledCount = 0;
  }

  async initialize() {
    // Initialize default bucket
    this.buckets.set('default', {
      tokens: this.config.defaultBurstSize,
      lastRefill: Date.now()
    });
  }

  /**
   * Configure rate limit for a server
   * @param {string} serverId - Server identifier
   * @param {object} config - Rate limit configuration
   */
  configure(serverId, config) {
    const { rateLimit, burstSize } = config;

    this.serverConfigs.set(serverId, {
      rateLimit: rateLimit || this.config.defaultRateLimit,
      burstSize: burstSize || this.config.defaultBurstSize
    });

    // Initialize bucket
    this.buckets.set(serverId, {
      tokens: burstSize || this.config.defaultBurstSize,
      lastRefill: Date.now()
    });
  }

  /**
   * Acquire a token for rate limiting
   * @param {string} serverId - Server identifier
   * @returns {Promise<object>} Rate limit info
   */
  async acquire(serverId) {
    const release = await this.mutex.acquire();
    
    try {
      const config = this.serverConfigs.get(serverId) || {
        rateLimit: this.config.defaultRateLimit,
        burstSize: this.config.defaultBurstSize
      };

      let bucket = this.buckets.get(serverId);
      if (!bucket) {
        bucket = { tokens: config.burstSize, lastRefill: Date.now() };
        this.buckets.set(serverId, bucket);
      }

      // Refill tokens based on elapsed time
      const now = Date.now();
      const elapsed = (now - bucket.lastRefill) / 1000;
      const refillAmount = elapsed * config.rateLimit;
      
      bucket.tokens = Math.min(config.burstSize, bucket.tokens + refillAmount);
      bucket.lastRefill = now;

      this.requestCount++;

      if (bucket.tokens < 1) {
        this.throttledCount++;
        const waitTime = (1 - bucket.tokens) / config.rateLimit * 1000;
        
        return {
          allowed: false,
          waitTime,
          retryAfter: waitTime,
          limit: config.rateLimit,
          remaining: 0
        };
      }

      bucket.tokens -= 1;

      return {
        allowed: true,
        limit: config.rateLimit,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + (1000 / config.rateLimit)
      };
    } finally {
      release();
    }
  }

  /**
   * Wait until a token is available
   * @param {string} serverId - Server identifier
   * @returns {Promise<void>}
   */
  async waitForToken(serverId) {
    let result = await this.acquire(serverId);
    
    while (!result.allowed) {
      await new Promise(resolve => setTimeout(resolve, result.waitTime + 10));
      result = await this.acquire(serverId);
    }
  }

  /**
   * Get current rate limit status
   * @param {string} serverId - Server identifier
   * @returns {Promise<object>} Status
   */
  async getStatus(serverId) {
    const config = this.serverConfigs.get(serverId) || {
      rateLimit: this.config.defaultRateLimit,
      burstSize: this.config.defaultBurstSize
    };

    const bucket = this.buckets.get(serverId);
    
    return {
      limit: config.rateLimit,
      burstSize: config.burstSize,
      available: bucket?.tokens || config.burstSize,
      used: config.burstSize - (bucket?.tokens || 0)
    };
  }

  /**
   * Get rate limiter statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const buckets = Array.from(this.buckets.entries()).map(([id, bucket]) => ({
      serverId: id,
      tokens: bucket.tokens,
      lastRefill: bucket.lastRefill
    }));

    return {
      type: 'rate-limiter',
      requestCount: this.requestCount,
      throttledCount: this.throttledCount,
      throttleRate: this.requestCount > 0 ? this.throttledCount / this.requestCount : 0,
      configuredServers: this.serverConfigs.size,
      buckets
    };
  }

  /**
   * Close rate limiter
   * @returns {Promise<void>}
   */
  async close() {
    this.buckets.clear();
    this.serverConfigs.clear();
  }
}

module.exports = RateLimiter;
