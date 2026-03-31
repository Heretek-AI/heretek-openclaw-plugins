/**
 * API Abstraction Module
 * Provides unified abstraction layer for external APIs
 */

class APIAbstraction {
  constructor(config = {}) {
    this.config = {
      enableValidation: config.enableValidation ?? true,
      enableTransformation: config.enableTransformation ?? true,
      ...config
    };

    this.apis = new Map();
    this.operationCache = new Map();
    this.initialized = false;
    this.callCount = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Register an API abstraction
   * @param {string} apiId - API identifier
   * @param {object} definition - API definition
   */
  async register(apiId, definition) {
    const {
      baseUrl,
      authentication,
      operations,
      transformers = {}
    } = definition;

    const api = {
      apiId,
      baseUrl,
      authentication,
      operations: new Map(),
      transformers,
      createdAt: Date.now()
    };

    // Register operations
    for (const [opName, opDef] of Object.entries(operations || {})) {
      api.operations.set(opName, {
        name: opName,
        ...opDef,
        cacheKey: opDef.cacheKey ? this._compileCacheKey(opDef.cacheKey) : null
      });
    }

    this.apis.set(apiId, api);
    this.operationCache.clear();
  }

  /**
   * Call an API operation through abstraction
   * @param {string} apiId - API identifier
   * @param {string} operation - Operation name
   * @param {object} params - Operation parameters
   * @returns {Promise<object>} Result
   */
  async call(apiId, operation, params = {}) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API not found: ${apiId}`);
    }

    const op = api.operations.get(operation);
    if (!op) {
      throw new Error(`Operation not found: ${operation} for API: ${apiId}`);
    }

    this.callCount++;

    // Validate parameters
    if (this.config.enableValidation && op.params) {
      this._validateParams(params, op.params);
    }

    // Build request
    const request = this._buildRequest(api, op, params);

    // Check cache
    if (op.cacheable && op.cacheKey) {
      const cacheKey = op.cacheKey(params);
      const cached = this.operationCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return { ...cached.result, fromCache: true };
      }
    }

    // Execute request (placeholder for actual HTTP call)
    const result = await this._executeRequest(request);

    // Transform response
    let transformed = result;
    if (this.config.enableTransformation) {
      transformed = this._transformResponse(result, op, api.transformers);
    }

    // Cache result
    if (op.cacheable && op.cacheKey) {
      const cacheKey = op.cacheKey(params);
      this.operationCache.set(cacheKey, {
        result: transformed,
        expiresAt: Date.now() + (op.cacheTTL || 300000)
      });
    }

    return { ...transformed, fromCache: false };
  }

  /**
   * Get available operations for an API
   * @param {string} apiId - API identifier
   * @returns {Array<string>} Operation names
   */
  getOperations(apiId) {
    const api = this.apis.get(apiId);
    if (!api) return [];
    return Array.from(api.operations.keys());
  }

  /**
   * Get API definition
   * @param {string} apiId - API identifier
   * @returns {object|null} API definition
   */
  getDefinition(apiId) {
    const api = this.apis.get(apiId);
    if (!api) return null;
    
    return {
      apiId: api.apiId,
      baseUrl: api.baseUrl,
      operations: Array.from(api.operations.keys()),
      authentication: api.authentication
    };
  }

  // Private methods

  _validateParams(params, schema) {
    for (const [name, def] of Object.entries(schema)) {
      if (def.required && !(name in params)) {
        throw new Error(`Missing required parameter: ${name}`);
      }
      
      if (name in params && def.type) {
        const actualType = typeof params[name];
        if (def.type === 'array' && !Array.isArray(params[name])) {
          throw new Error(`Parameter ${name} must be an array`);
        }
        if (def.type !== 'array' && actualType !== def.type && params[name] !== null) {
          throw new Error(`Parameter ${name} must be of type ${def.type}`);
        }
      }
    }
  }

  _buildRequest(api, op, params) {
    const { method = 'GET', path, headers = {} } = op;
    
    // Substitute path parameters
    let fullPath = path;
    for (const [key, value] of Object.entries(params)) {
      fullPath = fullPath.replace(`:${key}`, encodeURIComponent(value));
    }

    const url = `${api.baseUrl}${fullPath}`;

    // Build query string for GET requests
    let queryString = '';
    if (method === 'GET') {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (!op.pathParams?.includes(key)) {
          queryParams.append(key, value);
        }
      }
      queryString = queryParams.toString();
    }

    return {
      url: queryString ? `${url}?${queryString}` : url,
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' ? JSON.stringify(params) : null
    };
  }

  async _executeRequest(request) {
    // Placeholder for actual HTTP execution
    // In production, this would use node-fetch or similar
    return {
      status: 200,
      data: {
        request,
        timestamp: Date.now(),
        mock: true
      }
    };
  }

  _transformResponse(result, op, transformers) {
    const { responseTransform } = op;
    
    // Apply operation-specific transformer
    if (responseTransform && transformers[responseTransform]) {
      return transformers[responseTransform](result.data, result);
    }

    // Apply default transformer if exists
    if (transformers.default) {
      return transformers.default(result.data, result);
    }

    return result;
  }

  _compileCacheKey(cacheKeyTemplate) {
    if (typeof cacheKeyTemplate === 'function') {
      return cacheKeyTemplate;
    }
    
    // Compile string template to function
    return (params) => {
      return cacheKeyTemplate.replace(/\{(\w+)\}/g, (_, key) => params[key] || '');
    };
  }

  /**
   * Get abstraction statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const apis = Array.from(this.apis.entries()).map(([id, api]) => ({
      apiId: id,
      operationCount: api.operations.size,
      baseUrl: api.baseUrl
    }));

    return {
      type: 'api-abstraction',
      registeredApis: this.apis.size,
      totalOperations: Array.from(this.apis.values()).reduce((sum, api) => sum + api.operations.size, 0),
      callCount: this.callCount,
      cacheSize: this.operationCache.size,
      apis
    };
  }

  /**
   * Clear operation cache
   * @returns {Promise<void>}
   */
  async clearCache() {
    this.operationCache.clear();
  }
}

module.exports = APIAbstraction;
