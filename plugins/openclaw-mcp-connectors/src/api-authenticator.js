/**
 * API Authenticator Module
 * Handles authentication for external API connections
 */

const CryptoJS = require('crypto-js');

class APIAuthenticator {
  constructor(config = {}) {
    this.config = {
      tokenRefreshThreshold: config.tokenRefreshThreshold || 300, // 5 minutes
      ...config
    };

    this.authConfigs = new Map();
    this.activeTokens = new Map();
    this.tokenRefreshTimers = new Map();
  }

  /**
   * Configure authentication for a server
   * @param {string} serverId - Server identifier
   * @param {object} authConfig - Authentication configuration
   * @returns {Promise<void>}
   */
  async configure(serverId, authConfig) {
    const { type, ...credentials } = authConfig;

    const config = {
      type,
      serverId,
      createdAt: Date.now(),
      ...credentials
    };

    this.authConfigs.set(serverId, config);

    // Initialize token if provided
    if (credentials.accessToken || credentials.token) {
      await this.setToken(serverId, credentials.accessToken || credentials.token, {
        expiresIn: credentials.expiresIn,
        refreshToken: credentials.refreshToken
      });
    }
  }

  /**
   * Get authentication credentials for a server
   * @param {string} serverId - Server identifier
   * @returns {Promise<object|null>} Auth credentials
   */
  async getAuth(serverId) {
    const config = this.authConfigs.get(serverId);
    if (!config) return null;

    switch (config.type) {
      case 'bearer':
        return this._getBearerAuth(serverId, config);
      case 'basic':
        return this._getBasicAuth(config);
      case 'apikey':
        return this._getApiKeyAuth(config);
      case 'hmac':
        return this._getHmacAuth(serverId, config);
      case 'oauth2':
        return this._getOAuth2Auth(serverId, config);
      default:
        return null;
    }
  }

  /**
   * Build headers from auth credentials
   * @param {object} auth - Auth credentials
   * @returns {object} Headers object
   */
  buildHeaders(auth) {
    if (!auth) return {};

    const headers = {};

    if (auth.authorization) {
      headers['Authorization'] = auth.authorization;
    }
    if (auth.apiKey) {
      headers['X-API-Key'] = auth.apiKey;
    }
    if (auth.signature) {
      headers['X-Signature'] = auth.signature;
    }
    if (auth.timestamp) {
      headers['X-Timestamp'] = auth.timestamp;
    }

    return headers;
  }

  /**
   * Set an access token
   * @param {string} serverId - Server identifier
   * @param {string} token - Access token
   * @param {object} options - Token options
   */
  async setToken(serverId, token, options = {}) {
    const { expiresIn, refreshToken } = options;

    const tokenData = {
      accessToken: token,
      refreshToken,
      expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : null,
      createdAt: Date.now()
    };

    this.activeTokens.set(serverId, tokenData);

    // Schedule refresh if refresh token provided
    if (refreshToken && expiresIn) {
      this._scheduleRefresh(serverId, expiresIn - this.config.tokenRefreshThreshold);
    }
  }

  /**
   * Refresh an access token
   * @param {string} serverId - Server identifier
   * @returns {Promise<string>} New access token
   */
  async refreshToken(serverId) {
    const tokenData = this.activeTokens.get(serverId);
    const config = this.authConfigs.get(serverId);

    if (!tokenData?.refreshToken) {
      throw new Error('No refresh token available');
    }

    // In production, this would call the token endpoint
    const newToken = `refreshed_token_${serverId}`;
    
    await this.setToken(serverId, newToken, {
      expiresIn: config.tokenExpiresIn,
      refreshToken: tokenData.refreshToken
    });

    return newToken;
  }

  /**
   * Clear authentication for a server
   * @param {string} serverId - Server identifier
   */
  clear(serverId) {
    this.authConfigs.delete(serverId);
    this.activeTokens.delete(serverId);
    
    if (this.tokenRefreshTimers.has(serverId)) {
      clearTimeout(this.tokenRefreshTimers.get(serverId));
      this.tokenRefreshTimers.delete(serverId);
    }
  }

  // Private methods

  _getBearerAuth(serverId, config) {
    const tokenData = this.activeTokens.get(serverId);
    const token = tokenData?.accessToken || config.token;
    
    if (!token) return null;

    return {
      type: 'bearer',
      authorization: `Bearer ${token}`
    };
  }

  _getBasicAuth(config) {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    
    return {
      type: 'basic',
      authorization: `Basic ${credentials}`
    };
  }

  _getApiKeyAuth(config) {
    return {
      type: 'apikey',
      apiKey: config.apiKey,
      headerName: config.headerName || 'X-API-Key'
    };
  }

  _getHmacAuth(serverId, config) {
    const timestamp = Date.now().toString();
    const method = config.method || 'GET';
    const path = config.path || '/';
    
    const body = config.body || '';
    const toSign = `${method}\n${timestamp}\n${path}\n${body}`;
    
    const signature = CryptoJS.HmacSHA256(toSign, config.secret).toString(CryptoJS.enc.Hex);

    return {
      type: 'hmac',
      apiKey: config.apiKey,
      signature,
      timestamp,
      algorithm: config.algorithm || 'HmacSHA256'
    };
  }

  async _getOAuth2Auth(serverId, config) {
    const tokenData = this.activeTokens.get(serverId);
    
    // Check if token needs refresh
    if (tokenData?.expiresAt && Date.now() > tokenData.expiresAt - (this.config.tokenRefreshThreshold * 1000)) {
      await this.refreshToken(serverId);
      return this._getBearerAuth(serverId, config);
    }

    return this._getBearerAuth(serverId, config);
  }

  _scheduleRefresh(serverId, delay) {
    if (this.tokenRefreshTimers.has(serverId)) {
      clearTimeout(this.tokenRefreshTimers.get(serverId));
    }

    const timer = setTimeout(async () => {
      try {
        await this.refreshToken(serverId);
      } catch (error) {
        console.error(`[Authenticator] Failed to refresh token for ${serverId}:`, error.message);
      }
    }, delay * 1000);

    this.tokenRefreshTimers.set(serverId, timer);
  }
}

module.exports = APIAuthenticator;
