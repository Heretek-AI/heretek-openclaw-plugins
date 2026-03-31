/**
 * Response Cache Module
 * Caches API responses with TTL and invalidation support
 */

const { LRU } = require('lru-cache');

class ResponseCache {
  constructor(config = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      maxTTL: config.maxTTL || 3600000, // 1 hour
      enableStaleWhileRevalidate: config.staleWhileRevalidate ?? true,
      ...config
    };

    this.cache = new LRU({
      max: this.config.maxSize,
      ttl: this.config.defaultTTL,
      updateAgeOnGet: true
    });

    this.staleCache = new Map(); // For stale-while-revalidate
    this.hitCount = 0;
    this.missCount = 0;
  }

  async initialize() {
    // Cache is ready to use
  }

  /**
   * Get a cached response
   * @param {string} key - Cache key
   * @returns {Promise<object|null>} Cached response
   */
  async get(key) {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.hitCount++;
      return {
        data: entry.data,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt,
        isStale: entry.isStale
      };
    }

    // Check stale cache for stale-while-revalidate
    if (this.config.enableStaleWhileRevalidate) {
      const staleEntry = this.staleCache.get(key);
      if (staleEntry) {
        this.hitCount++;
        return {
          data: staleEntry.data,
          cachedAt: staleEntry.cachedAt,
          expiresAt: staleEntry.expiresAt,
          isStale: true
        };
      }
    }

    this.missCount++;
    return null;
  }

  /**
   * Set a cached response
   * @param {string} key - Cache key
   * @param {object} data - Response data
   * @param {number} ttl - Time to live in ms
   * @returns {Promise<void>}
   */
  async set(key, data, ttl = this.config.defaultTTL) {
    const actualTTL = Math.min(ttl, this.config.maxTTL);
    const now = Date.now();

    // Move current entry to stale cache before updating
    if (this.config.enableStaleWhileRevalidate) {
      const existing = this.cache.get(key);
      if (existing) {
        this.staleCache.set(key, {
          ...existing,
          isStale: true
        });
      }
    }

    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + actualTTL,
      isStale: false
    }, actualTTL);
  }

  /**
   * Delete a cached response
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(key) {
    const deleted = this.cache.delete(key);
    this.staleCache.delete(key);
    return deleted;
  }

  /**
   * Clear cache for a specific server or all
   * @param {string} serverPrefix - Optional server prefix to clear
   * @returns {Promise<void>}
   */
  async clear(serverPrefix) {
    if (serverPrefix) {
      // Clear entries matching prefix
      for (const key of this.cache.keys()) {
        if (key.startsWith(serverPrefix)) {
          this.cache.delete(key);
          this.staleCache.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.staleCache.clear();
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param {RegExp} pattern - Pattern to match keys
   * @returns {Promise<number>} Number of invalidated entries
   */
  async invalidate(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        this.staleCache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const total = this.hitCount + this.missCount;
    
    return {
      type: 'response-cache',
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
      staleCacheSize: this.staleCache.size,
      defaultTTL: this.config.defaultTTL,
      maxTTL: this.config.maxTTL
    };
  }

  get hitRate() {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }
}

module.exports = ResponseCache;
