/**
 * OpenClaw MCP Connectors Plugin
 * Model Context Protocol connectors for external service integration
 */

const MCPClient = require('./mcp-client');
const APIAuthenticator = require('./api-authenticator');
const ResponseCache = require('./response-cache');
const RateLimiter = require('./rate-limiter');
const APIAbstraction = require('./api-abstraction');

class MCPConnectorsPlugin {
  constructor(config = {}) {
    this.config = {
      defaultTimeout: config.defaultTimeout || 30000,
      maxRetries: config.maxRetries || 3,
      enableCache: config.enableCache ?? true,
      enableRateLimiting: config.enableRateLimiting ?? true,
      ...config
    };

    this.mcpClient = new MCPClient(config.mcp);
    this.authenticator = new APIAuthenticator(config.auth);
    this.cache = new ResponseCache(config.cache);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.abstraction = new APIAbstraction(config.abstraction);

    this.initialized = false;
    this.requestCount = 0;
  }

  async initialize() {
    await this.mcpClient.initialize();
    await this.cache.initialize();
    await this.rateLimiter.initialize();
    await this.abstraction.initialize();
    this.initialized = true;
    console.log('[MCPConnectors] Plugin initialized');
  }

  /**
   * Connect to an MCP server
   * @param {string} serverId - Server identifier
   * @param {object} config - Connection configuration
   * @returns {Promise<object>} Connection result
   */
  async connect(serverId, config) {
    if (!this.initialized) {
      await this.initialize();
    }

    const connection = await this.mcpClient.connect(serverId, config);
    return connection;
  }

  /**
   * Disconnect from an MCP server
   * @param {string} serverId - Server identifier
   * @returns {Promise<void>}
   */
  async disconnect(serverId) {
    await this.mcpClient.disconnect(serverId);
  }

  /**
   * Make an API request through MCP
   * @param {string} serverId - MCP server ID
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @returns {Promise<object>} API response
   */
  async request(serverId, endpoint, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      method = 'GET',
      params = {},
      body = null,
      useCache = this.config.enableCache,
      cacheKey = null,
      timeout = this.config.defaultTimeout
    } = options;

    // Check cache first
    const cacheKeyActual = cacheKey || `${serverId}:${method}:${endpoint}:${JSON.stringify(params)}`;
    if (useCache) {
      const cached = await this.cache.get(cacheKeyActual);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // Apply rate limiting
    if (this.config.enableRateLimiting) {
      await this.rateLimiter.acquire(serverId);
    }

    // Apply authentication
    const authConfig = await this.authenticator.getAuth(serverId);
    const headers = authConfig ? this.authenticator.buildHeaders(authConfig) : {};

    // Make request
    const startTime = Date.now();
    let response;

    try {
      response = await this.mcpClient.call(serverId, endpoint, {
        method,
        params,
        body,
        headers,
        timeout
      });

      // Cache successful response
      if (useCache && response) {
        await this.cache.set(cacheKeyActual, response, options.ttl);
      }

      this.requestCount++;
      return { ...response, fromCache: false, responseTime: Date.now() - startTime };
    } catch (error) {
      throw new Error(`MCP request failed: ${error.message}`);
    }
  }

  /**
   * Register a custom API abstraction
   * @param {string} apiId - API identifier
   * @param {object} definition - API definition
   * @returns {Promise<void>}
   */
  async registerAPI(apiId, definition) {
    await this.abstraction.register(apiId, definition);
  }

  /**
   * Call a registered API abstraction
   * @param {string} apiId - API identifier
   * @param {string} operation - Operation name
   * @param {object} params - Operation parameters
   * @returns {Promise<object>} API response
   */
  async callAPI(apiId, operation, params = {}) {
    return await this.abstraction.call(apiId, operation, params);
  }

  /**
   * Configure API authentication
   * @param {string} serverId - Server identifier
   * @param {object} authConfig - Authentication configuration
   * @returns {Promise<void>}
   */
  async configureAuth(serverId, authConfig) {
    await this.authenticator.configure(serverId, authConfig);
  }

  /**
   * Clear cache for a specific server or all servers
   * @param {string} serverId - Optional server ID to clear
   * @returns {Promise<void>}
   */
  async clearCache(serverId) {
    await this.cache.clear(serverId);
  }

  /**
   * Get plugin statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const [mcpStats, cacheStats, rateLimitStats, abstractionStats] = await Promise.all([
      this.mcpClient.getStats(),
      this.cache.getStats(),
      this.rateLimiter.getStats(),
      this.abstraction.getStats()
    ]);

    return {
      mcp: mcpStats,
      cache: cacheStats,
      rateLimit: rateLimitStats,
      abstraction: abstractionStats,
      totalRequests: this.requestCount,
      cacheHitRate: this.cache.hitRate
    };
  }

  /**
   * Close all connections
   * @returns {Promise<void>}
   */
  async close() {
    await Promise.all([
      this.mcpClient.close(),
      this.cache.clear(),
      this.rateLimiter.close()
    ]);
  }
}

module.exports = MCPConnectorsPlugin;
