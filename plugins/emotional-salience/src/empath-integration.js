/**
 * Empath Integration Module
 * 
 * Integrates with the Empath agent for user emotional state tracking.
 * Provides bidirectional communication between the Emotional Salience Plugin
 * and the Empath agent's user modeling capabilities.
 * 
 * Maps to: Amygdala-Prefrontal connectivity for emotional regulation
 */

import EventEmitter from 'eventemitter3';

/**
 * Default configuration for Empath integration
 */
const DEFAULT_CONFIG = {
  // Empath agent endpoint (WebSocket RPC)
  empathEndpoint: 'ws://127.0.0.1:18789',
  
  // Empath agent ID
  empathAgentId: 'empath',
  
  // Connection settings
  connectionTimeout: 5000,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  
  // User state caching
  cacheTimeout: 60000, // 1 minute
  
  // Emotional state synchronization
  syncInterval: 10000, // 10 seconds
  enableAutoSync: true
};

/**
 * User emotional state schema
 */
const USER_STATE_SCHEMA = {
  id: 'string',
  profile: {
    name: 'string',
    preferred: 'string',
    timezone: 'string'
  },
  emotionalState: {
    currentMood: 'string',
    moodValence: 'number',  // -1 to 1
    moodIntensity: 'number', // 0 to 1
    detectedAt: 'number'
  },
  preferences: {
    communicationStyle: 'string',
    responseLength: 'string'
  },
  interactionHistory: 'array',
  relationshipMetrics: {
    trustLevel: 'number',
    satisfactionTrend: 'string'
  }
};

/**
 * EmpathIntegration class for Empath agent communication
 */
export class EmpathIntegration extends EventEmitter {
  /**
   * Create a new EmpathIntegration instance
   * @param {object} config - Integration configuration
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // WebSocket connection
    this.ws = null;
    
    // Connection state
    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    
    // User state cache
    this.userStateCache = new Map();
    
    // Pending requests
    this.pendingRequests = new Map();
    
    // Sync interval
    this.syncIntervalId = null;
    
    // Message ID counter
    this.messageId = 0;
  }
  
  /**
   * Initialize the Empath integration
   * @returns {Promise<EmpathIntegration>}
   */
  async initialize() {
    if (this.connecting || this.connected) {
      return this;
    }
    
    this.connecting = true;
    
    try {
      await this._connect();
      
      if (this.config.enableAutoSync) {
        this._startSync();
      }
      
      this.emit('initialized');
      return this;
    } catch (error) {
      this.connecting = false;
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }
  
  /**
   * Connect to Empath agent
   * @private
   */
  async _connect() {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would create a WebSocket connection
        // For now, we simulate the connection
        this.ws = {
          send: (data) => this._simulateSend(data),
          close: () => this._simulateClose()
        };
        
        this.connected = true;
        this.connecting = false;
        this.reconnectAttempts = 0;
        
        this.emit('connected');
        resolve(this);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from Empath agent
   */
  async disconnect() {
    this._stopSync();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connected = false;
    this.connecting = false;
    
    this.emit('disconnected');
  }
  
  /**
   * Get user emotional state
   * @param {string} userId - User ID
   * @param {boolean} forceRefresh - Force refresh from Empath
   * @returns {Promise<object>} User emotional state
   */
  async getUserState(userId, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.userStateCache.get(userId);
      if (cached && Date.now() - cached.cachedAt < this.config.cacheTimeout) {
        return cached.state;
      }
    }
    
    // Request from Empath
    try {
      const state = await this._requestUserState(userId);
      
      // Update cache
      this.userStateCache.set(userId, {
        state,
        cachedAt: Date.now()
      });
      
      this.emit('user-state-updated', { userId, state });
      return state;
    } catch (error) {
      this.emit('error', { type: 'user-state', userId, error });
      throw error;
    }
  }
  
  /**
   * Update user emotional state (push to Empath)
   * @param {string} userId - User ID
   * @param {object} stateUpdate - State update
   * @returns {Promise<object>} Updated state
   */
  async updateUserState(userId, stateUpdate) {
    try {
      const result = await this._sendUpdate(userId, stateUpdate);
      
      // Update local cache
      const cached = this.userStateCache.get(userId) || { state: {}, cachedAt: Date.now() };
      cached.state = { ...cached.state, ...result };
      cached.cachedAt = Date.now();
      this.userStateCache.set(userId, cached);
      
      this.emit('user-state-updated', { userId, state: result });
      return result;
    } catch (error) {
      this.emit('error', { type: 'update-state', userId, error });
      throw error;
    }
  }
  
  /**
   * Report emotional detection to Empath
   * @param {string} userId - User ID
   * @param {object} detection - Emotional detection result
   * @returns {Promise<object>} Empath response
   */
  async reportEmotionalDetection(userId, detection) {
    return this.updateUserState(userId, {
      emotionalState: {
        currentMood: detection.primaryEmotion,
        moodValence: detection.valence,
        moodIntensity: detection.intensity,
        detectedAt: detection.timestamp,
        emotions: detection.emotions
      },
      lastDetection: detection
    });
  }
  
  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<object>} User preferences
   */
  async getUserPreferences(userId) {
    const state = await this.getUserState(userId);
    return state.preferences || {};
  }
  
  /**
   * Get relationship metrics for user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Relationship metrics
   */
  async getRelationshipMetrics(userId) {
    const state = await this.getUserState(userId);
    return state.relationshipMetrics || {
      trustLevel: 0.5,
      satisfactionTrend: 'stable'
    };
  }
  
  /**
   * Subscribe to user state changes
   * @param {string} userId - User ID
   * @param {function} callback - State change callback
   * @returns {function} Unsubscribe function
   */
  subscribeToUserState(userId, callback) {
    const handler = (event) => {
      if (event.userId === userId) {
        callback(event.state);
      }
    };
    
    this.on('user-state-updated', handler);
    
    return () => {
      this.removeListener('user-state-updated', handler);
    };
  }
  
  /**
   * Get connection status
   * @returns {object} Connection status
   */
  getConnectionStatus() {
    return {
      connected: this.connected,
      connecting: this.connecting,
      reconnectAttempts: this.reconnectAttempts,
      cachedUsers: this.userStateCache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
  
  /**
   * Clear user state cache
   * @param {string} userId - Optional user ID to clear specific user
   */
  clearCache(userId) {
    if (userId) {
      this.userStateCache.delete(userId);
      this.emit('cache-cleared', { userId });
    } else {
      this.userStateCache.clear();
      this.emit('cache-cleared');
    }
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  /**
   * Start automatic synchronization
   * @private
   */
  _startSync() {
    if (this.syncIntervalId) return;
    
    this.syncIntervalId = setInterval(() => {
      this._syncUserStates();
    }, this.config.syncInterval);
  }
  
  /**
   * Stop automatic synchronization
   * @private
   */
  _stopSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
  
  /**
   * Sync user states
   * @private
   */
  async _syncUserStates() {
    if (!this.connected) return;
    
    for (const userId of this.userStateCache.keys()) {
      try {
        await this.getUserState(userId, true);
      } catch (error) {
        // Ignore sync errors
      }
    }
  }
  
  /**
   * Request user state from Empath
   * @private
   */
  async _requestUserState(userId) {
    const requestId = ++this.messageId;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for user ${userId}`));
      }, this.config.connectionTimeout);
      
      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      
      // Simulate Empath response
      setTimeout(() => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(requestId);
          
          // Return simulated user state
          resolve(this._generateSimulatedState(userId));
        }
      }, 50);
    });
  }
  
  /**
   * Send state update to Empath
   * @private
   */
  async _sendUpdate(userId, stateUpdate) {
    // In real implementation, send via WebSocket
    return new Promise((resolve) => {
      // Simulate Empath processing and response
      setTimeout(() => {
        resolve({
          userId,
          updatedAt: Date.now(),
          ...stateUpdate
        });
      }, 50);
    });
  }
  
  /**
   * Generate simulated user state (for testing)
   * @private
   */
  _generateSimulatedState(userId) {
    return {
      id: userId,
      profile: {
        name: `User ${userId}`,
        preferred: userId,
        timezone: 'UTC'
      },
      emotionalState: {
        currentMood: 'neutral',
        moodValence: 0,
        moodIntensity: 0.3,
        detectedAt: Date.now()
      },
      preferences: {
        communicationStyle: 'adaptive',
        responseLength: 'adaptive'
      },
      interactionHistory: [],
      relationshipMetrics: {
        trustLevel: 0.7,
        satisfactionTrend: 'stable'
      }
    };
  }
  
  /**
   * Simulate WebSocket send
   * @private
   */
  _simulateSend(data) {
    // In real implementation, send via WebSocket
    console.log('[EmpathIntegration] Sending:', data);
  }
  
  /**
   * Simulate WebSocket close
   * @private
   */
  _simulateClose() {
    this.connected = false;
    this.emit('disconnected');
    this._attemptReconnect();
  }
  
  /**
   * Attempt reconnection
   * @private
   */
  async _attemptReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('error', { 
        type: 'reconnect-failed', 
        attempts: this.reconnectAttempts 
      });
      return;
    }
    
    this.reconnectAttempts++;
    this.connecting = true;
    
    setTimeout(async () => {
      try {
        await this._connect();
      } catch (error) {
        this._attemptReconnect();
      }
    }, this.config.reconnectInterval);
  }
}

/**
 * EmpathAdapter - Adapts Empath state for salience calculations
 */
export class EmpathAdapter {
  /**
   * Create Empath adapter
   * @param {EmpathIntegration} empath - Empath integration instance
   */
  constructor(empath) {
    this.empath = empath;
    
    // Local emotional baselines per user
    this.baselines = new Map();
  }
  
  /**
   * Get emotional context for salience calculation
   * @param {string} userId - User ID
   * @param {object} messageContext - Message context
   * @returns {object} Emotional context for salience
   */
  async getEmotionalContext(userId, messageContext = {}) {
    try {
      const userState = await this.empath.getUserState(userId);
      
      // Get or create baseline
      let baseline = this.baselines.get(userId);
      if (!baseline) {
        baseline = this._calculateBaseline(userState);
        this.baselines.set(userId, baseline);
      }
      
      return {
        userId,
        
        // Current emotional state
        currentMood: userState.emotionalState?.currentMood || 'neutral',
        currentValence: userState.emotionalState?.moodValence || 0,
        currentIntensity: userState.emotionalState?.moodIntensity || 0,
        
        // Baseline for comparison
        baselineValence: baseline.valence,
        baselineIntensity: baseline.intensity,
        
        // Deviation from baseline (important for salience)
        valenceDeviation: (userState.emotionalState?.moodValence || 0) - baseline.valence,
        intensityDeviation: (userState.emotionalState?.moodIntensity || 0) - baseline.intensity,
        
        // Relationship context
        trustLevel: userState.relationshipMetrics?.trustLevel || 0.5,
        
        // Communication preferences
        communicationStyle: userState.preferences?.communicationStyle || 'adaptive',
        
        // Raw state for reference
        rawState: userState
      };
    } catch (error) {
      // Return default context on error
      return {
        userId,
        currentMood: 'neutral',
        currentValence: 0,
        currentIntensity: 0,
        baselineValence: 0,
        baselineIntensity: 0,
        valenceDeviation: 0,
        intensityDeviation: 0,
        trustLevel: 0.5,
        communicationStyle: 'adaptive',
        error: error.message
      };
    }
  }
  
  /**
   * Apply emotional context to valence detection
   * @param {object} valenceResult - Valence detection result
   * @param {object} emotionalContext - Emotional context from Empath
   * @returns {object} Contextualized valence result
   */
  applyContext(valenceResult, emotionalContext) {
    const contextualized = { ...valenceResult };
    
    // Adjust valence based on user's current mood
    const moodWeight = emotionalContext.currentIntensity * 0.3;
    contextualized.contextualValence = 
      (valenceResult.valence * (1 - moodWeight)) + 
      (emotionalContext.currentValence * moodWeight);
    
    // Adjust intensity based on baseline deviation
    const deviationBoost = Math.abs(emotionalContext.valenceDeviation) * 0.2;
    contextualized.contextualIntensity = Math.min(1, valenceResult.intensity + deviationBoost);
    
    // Add trust modifier (higher trust = more weight to emotional signals)
    contextualized.trustModifier = emotionalContext.trustLevel;
    
    // Add communication style context
    contextualized.communicationStyle = emotionalContext.communicationStyle;
    
    return contextualized;
  }
  
  /**
   * Calculate emotional baseline from user state
   * @private
   */
  _calculateBaseline(userState) {
    // In a real implementation, this would analyze historical data
    // For now, use current state as initial baseline
    return {
      valence: userState.emotionalState?.moodValence || 0,
      intensity: userState.emotionalState?.moodIntensity || 0.3,
      calculatedAt: Date.now()
    };
  }
  
  /**
   * Update baseline with new observation
   * @param {string} userId - User ID
   * @param {object} observation - New emotional observation
   */
  updateBaseline(userId, observation) {
    const baseline = this.baselines.get(userId) || { valence: 0, intensity: 0, observations: [] };
    
    if (!baseline.observations) baseline.observations = [];
    baseline.observations.push(observation);
    
    // Keep last 20 observations
    if (baseline.observations.length > 20) {
      baseline.observations.shift();
    }
    
    // Recalculate baseline as moving average
    const recent = baseline.observations.slice(-10);
    baseline.valence = recent.reduce((s, o) => s + o.valence, 0) / recent.length;
    baseline.intensity = recent.reduce((s, o) => s + o.intensity, 0) / recent.length;
    baseline.updatedAt = Date.now();
    
    this.baselines.set(userId, baseline);
  }
}

export default { EmpathIntegration, EmpathAdapter };
