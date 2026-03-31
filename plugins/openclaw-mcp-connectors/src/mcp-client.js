/**
 * MCP Client Module
 * Handles Model Context Protocol communication with external servers
 */

const { EventEmitter } = require('events');
const { Mutex } = require('async-mutex');

class MCPClient extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      transportType: config.transportType || 'stdio',
      connectionTimeout: config.connectionTimeout || 30000,
      requestTimeout: config.requestTimeout || 60000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      ...config
    };

    this.connections = new Map();
    this.pendingRequests = new Map();
    this.messageId = 0;
    this.mutex = new Mutex();
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Connect to an MCP server
   * @param {string} serverId - Server identifier
   * @param {object} config - Connection configuration
   * @returns {Promise<object>} Connection status
   */
  async connect(serverId, config) {
    const release = await this.mutex.acquire();
    
    try {
      if (this.connections.has(serverId)) {
        return { connected: true, serverId, existing: true };
      }

      const connection = {
        serverId,
        config,
        status: 'connecting',
        capabilities: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      // Simulate connection (in production, this would establish actual MCP transport)
      connection.status = 'connected';
      connection.capabilities = config.capabilities || ['resources', 'tools', 'prompts'];

      this.connections.set(serverId, connection);
      this.emit('connected', { serverId });

      return {
        connected: true,
        serverId,
        capabilities: connection.capabilities
      };
    } finally {
      release();
    }
  }

  /**
   * Disconnect from an MCP server
   * @param {string} serverId - Server identifier
   * @returns {Promise<void>}
   */
  async disconnect(serverId) {
    const release = await this.mutex.acquire();
    
    try {
      const connection = this.connections.get(serverId);
      if (connection) {
        connection.status = 'disconnected';
        this.connections.delete(serverId);
        this.emit('disconnected', { serverId });
      }
    } finally {
      release();
    }
  }

  /**
   * Make an MCP call
   * @param {string} serverId - Server identifier
   * @param {string} method - MCP method
   * @param {object} params - Method parameters
   * @returns {Promise<object>} Response
   */
  async call(serverId, method, params = {}) {
    const connection = this.connections.get(serverId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Not connected to server: ${serverId}`);
    }

    const id = ++this.messageId;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`));
      }, this.config.requestTimeout);

      this.pendingRequests.set(id, { resolve, reject, timeout, serverId });
    });

    // Simulate sending message (in production, this would send via transport)
    connection.lastActivity = Date.now();
    this.emit('message', { serverId, message });

    // Simulate response (in production, this would wait for actual response)
    setTimeout(() => {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve({
          jsonrpc: '2.0',
          id,
          result: {
            success: true,
            data: this._mockResponse(method, params)
          }
        });
        this.pendingRequests.delete(id);
      }
    }, 50);

    const response = await responsePromise;
    connection.lastActivity = Date.now();

    return response.result;
  }

  /**
   * List available resources from an MCP server
   * @param {string} serverId - Server identifier
   * @returns {Promise<Array>} Available resources
   */
  async listResources(serverId) {
    const result = await this.call(serverId, 'resources/list');
    return result.data?.resources || [];
  }

  /**
   * Read a resource from an MCP server
   * @param {string} serverId - Server identifier
   * @param {string} uri - Resource URI
   * @returns {Promise<object>} Resource content
   */
  async readResource(serverId, uri) {
    const result = await this.call(serverId, 'resources/read', { uri });
    return result.data;
  }

  /**
   * List available tools from an MCP server
   * @param {string} serverId - Server identifier
   * @returns {Promise<Array>} Available tools
   */
  async listTools(serverId) {
    const result = await this.call(serverId, 'tools/list');
    return result.data?.tools || [];
  }

  /**
   * Call a tool on an MCP server
   * @param {string} serverId - Server identifier
   * @param {string} toolName - Tool name
   * @param {object} args - Tool arguments
   * @returns {Promise<object>} Tool result
   */
  async callTool(serverId, toolName, args = {}) {
    const result = await this.call(serverId, 'tools/call', {
      name: toolName,
      arguments: args
    });
    return result.data;
  }

  /**
   * List available prompts from an MCP server
   * @param {string} serverId - Server identifier
   * @returns {Promise<Array>} Available prompts
   */
  async listPrompts(serverId) {
    const result = await this.call(serverId, 'prompts/list');
    return result.data?.prompts || [];
  }

  /**
   * Get a prompt from an MCP server
   * @param {string} serverId - Server identifier
   * @param {string} name - Prompt name
   * @param {object} args - Prompt arguments
   * @returns {Promise<object>} Prompt content
   */
  async getPrompt(serverId, name, args = {}) {
    const result = await this.call(serverId, 'prompts/get', { name, arguments: args });
    return result.data;
  }

  /**
   * Handle incoming MCP messages
   * @param {object} message - MCP message
   */
  handleMessage(message) {
    const { id, result, error } = message;

    if (error) {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.reject(new Error(error.message));
        this.pendingRequests.delete(id);
      }
    } else if (result !== undefined) {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(message);
        this.pendingRequests.delete(id);
      }
    }
  }

  /**
   * Get client statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const connections = Array.from(this.connections.values()).map(c => ({
      serverId: c.serverId,
      status: c.status,
      capabilities: c.capabilities,
      uptime: Date.now() - c.createdAt
    }));

    return {
      type: 'mcp-client',
      connectedServers: this.connections.size,
      pendingRequests: this.pendingRequests.size,
      connections,
      transportType: this.config.transportType
    };
  }

  /**
   * Close all connections
   * @returns {Promise<void>}
   */
  async close() {
    for (const serverId of this.connections.keys()) {
      await this.disconnect(serverId);
    }
    this.pendingRequests.clear();
  }

  /**
   * Generate mock response for demonstration
   */
  _mockResponse(method, params) {
    return {
      method,
      params,
      timestamp: Date.now(),
      mock: true
    };
  }
}

module.exports = MCPClient;
