/**
 * Emotional Salience Plugin
 * 
 * Implements amygdala functions for the Heretek OpenClaw collective:
 * - Emotional valence detection
 * - Salience scoring (importance/urgency/relevance)
 * - Emotional context tracking
 * - Empath agent integration
 * - Threat prioritization
 * - Fear conditioning
 * 
 * Brain Region Mapping:
 * - Amygdala: Emotional processing, threat detection, fear conditioning
 * - Salience Network (Insular Cortex + ACC): Automatic importance detection
 * - Prefrontal Cortex: Context maintenance, emotional regulation
 * 
 * @module @heretek-ai/emotional-salience-plugin
 */

import EventEmitter from 'eventemitter3';
import { ValenceDetector } from './valence-detector.js';
import { SalienceScorer } from './salience-scorer.js';
import { EmotionalContextTracker } from './context-tracker.js';
import { EmpathIntegration, EmpathAdapter } from './empath-integration.js';

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG = {
  // Valence detection settings
  valence: {
    emotionThreshold: 0.3,
    threatThreshold: 0.4,
    enableThreatDetection: true,
    trackContext: true,
    maxContextHistory: 100
  },
  
  // Salience scoring settings
  salience: {
    salienceThreshold: 0.3,
    attentionThreshold: 0.6,
    enableEmotionalScoring: true,
    enableThreatScoring: true,
    enableNoveltyScoring: true,
    enableContextualScoring: true,
    trackHistory: true,
    maxHistory: 500
  },
  
  // Context tracking settings
  context: {
    shortTermWindow: 300000,
    mediumTermWindow: 1800000,
    longTermWindow: 3600000,
    emotionalDecayRate: 0.3,
    trackPerAgent: true,
    trackPerConversation: true,
    enablePatternDetection: true
  },
  
  // Empath integration settings
  empath: {
    enabled: true,
    empathEndpoint: 'ws://127.0.0.1:18789',
    empathAgentId: 'empath',
    enableAutoSync: true,
    syncInterval: 10000,
    cacheTimeout: 60000
  },
  
  // Value weights for salience calculation
  valueWeights: {
    safety: 1.0,
    urgency: 0.8,
    importance: 0.7,
    emotional: 0.6,
    novelty: 0.4,
    social: 0.5,
    cognitive: 0.3
  }
};

/**
 * EmotionalSaliencePlugin - Main plugin class
 */
export class EmotionalSaliencePlugin extends EventEmitter {
  /**
   * Create a new EmotionalSaliencePlugin instance
   * @param {object} config - Plugin configuration
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Initialize core modules
    this.valenceDetector = new ValenceDetector(this.config.valence);
    this.salienceScorer = new SalienceScorer({
      ...this.config.salience,
      valueWeights: this.config.valueWeights
    });
    this.contextTracker = new EmotionalContextTracker(this.config.context);
    
    // Empath integration (optional)
    this.empathIntegration = null;
    this.empathAdapter = null;
    if (this.config.empath.enabled) {
      this.empathIntegration = new EmpathIntegration(this.config.empath);
      this.empathAdapter = new EmpathAdapter(this.empathIntegration);
    }
    
    // Plugin state
    this.initialized = false;
    this.running = false;
    
    // Event subscriptions
    this._setupEventHandlers();
  }
  
  /**
   * Initialize the plugin
   * @returns {Promise<EmotionalSaliencePlugin>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('[EmotionalSaliencePlugin] Already initialized');
      return this;
    }
    
    console.log('[EmotionalSaliencePlugin] Initializing...');
    
    // Initialize Empath integration if enabled
    if (this.config.empath.enabled && this.empathIntegration) {
      try {
        await this.empathIntegration.initialize();
        console.log('[EmotionalSaliencePlugin] Empath integration connected');
      } catch (error) {
        console.warn('[EmotionalSaliencePlugin] Empath integration failed:', error.message);
      }
    }
    
    this.initialized = true;
    console.log('[EmotionalSaliencePlugin] Initialized');
    
    this.emit('initialized');
    return this;
  }
  
  /**
   * Start the plugin
   * @returns {Promise<EmotionalSaliencePlugin>}
   */
  async start() {
    if (this.running) {
      console.log('[EmotionalSaliencePlugin] Already running');
      return this;
    }
    
    console.log('[EmotionalSaliencePlugin] Starting...');
    this.running = true;
    console.log('[EmotionalSaliencePlugin] Started');
    
    this.emit('started');
    return this;
  }
  
  /**
   * Stop the plugin
   * @returns {Promise<EmotionalSaliencePlugin>}
   */
  async stop() {
    if (!this.running) {
      console.log('[EmotionalSaliencePlugin] Not running');
      return this;
    }
    
    console.log('[EmotionalSaliencePlugin] Stopping...');
    this.running = false;
    
    // Disconnect Empath integration
    if (this.empathIntegration) {
      await this.empathIntegration.disconnect();
    }
    
    console.log('[EmotionalSaliencePlugin] Stopped');
    this.emit('stopped');
    return this;
  }
  
  /**
   * Dispose of all resources
   * @returns {Promise<void>}
   */
  async dispose() {
    await this.stop();
    console.log('[EmotionalSaliencePlugin] Disposed');
  }
  
  // ============================================
  // Core API: Emotional Valence Detection
  // ============================================
  
  /**
   * Detect emotional valence in text
   * @param {string} text - Text to analyze
   * @param {object} options - Detection options
   * @returns {object} Valence detection result
   */
  detectValence(text, options = {}) {
    return this.valenceDetector.detect(text, options);
  }
  
  /**
   * Detect valence for a message
   * @param {object} message - Message object
   * @returns {object} Message valence result
   */
  detectMessageValence(message) {
    return this.valenceDetector.detectMessage(message);
  }
  
  /**
   * Get emotional context trend
   * @param {number} window - Number of detections to consider
   * @returns {object} Emotional context trend
   */
  getEmotionalContext(window = 10) {
    return this.valenceDetector.getEmotionalContext(window);
  }
  
  // ============================================
  // Core API: Salience Scoring
  // ============================================
  
  /**
   * Calculate salience score for content
   * @param {object} content - Content to score
   * @param {object} options - Scoring options
   * @returns {object} Salience score result
   */
  calculateSalience(content, options = {}) {
    return this.salienceScorer.calculateSalience(content, options);
  }
  
  /**
   * Score a message for salience
   * @param {object} message - Message object
   * @param {object} context - Additional context
   * @returns {object} Message salience result
   */
  scoreMessage(message, context = {}) {
    return this.salienceScorer.scoreMessage(message, context);
  }
  
  /**
   * Prioritize items by salience
   * @param {Array} items - Items to prioritize
   * @returns {Array} Prioritized items
   */
  prioritize(items) {
    return this.salienceScorer.prioritize(items);
  }
  
  /**
   * Prioritize threats (amygdala function)
   * @param {Array} threats - Threat items
   * @returns {Array} Prioritized threats
   */
  prioritizeThreats(threats) {
    return this.salienceScorer.prioritizeThreats(threats);
  }
  
  /**
   * Update value weights
   * @param {string} valueName - Value name
   * @param {number} weight - New weight
   */
  updateValueWeight(valueName, weight) {
    this.salienceScorer.updateValueWeight(valueName, weight);
  }
  
  // ============================================
  // Core API: Emotional Context Tracking
  // ============================================
  
  /**
   * Track an emotional event
   * @param {object} event - Emotional event
   * @returns {object} Tracked context
   */
  trackEmotionalEvent(event) {
    const result = this.contextTracker.track(event);
    
    // Also update valence detector context
    this.valenceDetector._updateContext(event);
    
    return result;
  }
  
  /**
   * Get current emotional context
   * @param {object} filters - Context filters
   * @returns {object} Emotional context
   */
  getContext(filters = {}) {
    return this.contextTracker.getContext(filters);
  }
  
  /**
   * Get conversation emotional history
   * @param {string} conversationId - Conversation ID
   * @param {number} window - Time window
   * @returns {object} Conversation history
   */
  getConversationHistory(conversationId, window = null) {
    return this.contextTracker.getConversationHistory(conversationId, window);
  }
  
  /**
   * Get agent emotional profile
   * @param {string} agentId - Agent ID
   * @returns {object} Agent profile
   */
  getAgentProfile(agentId) {
    return this.contextTracker.getAgentProfile(agentId);
  }
  
  /**
   * Get emotional trend analysis
   * @param {string} scope - Scope: 'global', 'conversation', or 'agent'
   * @param {string} id - ID for conversation/agent scope
   * @param {number} window - Time window
   * @returns {object} Trend analysis
   */
  getTrend(scope = 'global', id = null, window = null) {
    return this.contextTracker.getTrend(scope, id, window);
  }
  
  // ============================================
  // Core API: Empath Integration
  // ============================================
  
  /**
   * Get user emotional state from Empath
   * @param {string} userId - User ID
   * @param {boolean} forceRefresh - Force refresh
   * @returns {Promise<object>} User state
   */
  async getUserState(userId, forceRefresh = false) {
    if (!this.empathIntegration) {
      throw new Error('Empath integration not enabled');
    }
    return this.empathIntegration.getUserState(userId, forceRefresh);
  }
  
  /**
   * Update user emotional state via Empath
   * @param {string} userId - User ID
   * @param {object} stateUpdate - State update
   * @returns {Promise<object>} Updated state
   */
  async updateUserState(userId, stateUpdate) {
    if (!this.empathIntegration) {
      throw new Error('Empath integration not enabled');
    }
    return this.empathIntegration.updateUserState(userId, stateUpdate);
  }
  
  /**
   * Report emotional detection to Empath
   * @param {string} userId - User ID
   * @param {object} detection - Emotional detection result
   * @returns {Promise<object>} Empath response
   */
  async reportToEmpath(userId, detection) {
    if (!this.empathIntegration) {
      throw new Error('Empath integration not enabled');
    }
    return this.empathIntegration.reportEmotionalDetection(userId, detection);
  }
  
  /**
   * Get emotional context with Empath integration
   * @param {string} userId - User ID
   * @param {object} messageContext - Message context
   * @returns {Promise<object>} Emotional context
   */
  async getEmotionalContextWithEmpath(userId, messageContext = {}) {
    if (!this.empathAdapter) {
      throw new Error('Empath integration not enabled');
    }
    return this.empathAdapter.getEmotionalContext(userId, messageContext);
  }
  
  /**
   * Process a message with full emotional pipeline
   * @param {object} message - Message to process
   * @param {string} userId - Optional user ID for Empath integration
   * @returns {Promise<object>} Processed message with emotional context
   */
  async processMessage(message, userId = null) {
    // Step 1: Detect valence
    const valenceResult = this.detectMessageValence(message);
    
    // Step 2: Calculate salience
    const salienceResult = this.scoreMessage({
      ...message,
      valence: valenceResult
    });
    
    // Step 3: Track emotional context
    const contextResult = this.trackEmotionalEvent({
      source: message.sender,
      type: 'message',
      conversationId: message.conversationId,
      agentId: message.sender,
      valence: valenceResult.valence,
      intensity: valenceResult.intensity,
      emotions: valenceResult.emotions,
      contentId: message.id
    });
    
    // Step 4: Apply Empath context if available
    let empathContext = null;
    if (userId && this.empathAdapter) {
      try {
        empathContext = await this.getEmotionalContextWithEmpath(userId, message);
        valenceResult.contextualValence = empathContext.contextualValence;
        valenceResult.contextualIntensity = empathContext.contextualIntensity;
      } catch (error) {
        console.warn('[EmotionalSaliencePlugin] Empath context failed:', error.message);
      }
    }
    
    // Combine results
    return {
      message,
      valence: valenceResult,
      salience: salienceResult,
      context: contextResult,
      empath: empathContext,
      processedAt: Date.now()
    };
  }
  
  // ============================================
  // Value System Management
  // ============================================
  
  /**
   * Set a value in the value system
   * @param {string} name - Value name
   * @param {object} config - Value configuration
   */
  setValue(name, config) {
    this.salienceScorer.setValue(name, config);
  }
  
  /**
   * Get a value from the value system
   * @param {string} name - Value name
   * @returns {object|null} Value configuration
   */
  getValue(name) {
    return this.salienceScorer.getValue(name);
  }
  
  /**
   * Update context state for salience scoring
   * @param {object} context - Context state
   */
  updateContext(context) {
    this.salienceScorer.updateContext(context);
  }
  
  // ============================================
  // Health & Status
  // ============================================
  
  /**
   * Get plugin health status
   * @returns {object} Health status
   */
  getHealth() {
    return {
      initialized: this.initialized,
      running: this.running,
      empathConnected: this.empathIntegration?.connected || false,
      valenceDetector: 'ok',
      salienceScorer: 'ok',
      contextTracker: 'ok',
      cachedUsers: this.empathIntegration?.userStateCache?.size || 0
    };
  }
  
  /**
   * Get plugin statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      valence: this.valenceDetector.getEmotionalContext(),
      salience: this.salienceScorer.getStatistics(),
      context: {
        conversations: this.contextTracker.conversations.size,
        agents: this.contextTracker.agentProfiles.size,
        patterns: this.contextTracker.patterns.length
      },
      empath: this.empathIntegration?.getConnectionStatus() || null
    };
  }
  
  /**
   * Check if plugin is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }
  
  /**
   * Check if plugin is running
   * @returns {boolean}
   */
  isRunning() {
    return this.running;
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  /**
   * Set up internal event handlers
   * @private
   */
  _setupEventHandlers() {
    // Forward valence detection events
    this.valenceDetector.on('detection', (result) => {
      this.emit('valence-detected', result);
    });
    
    // Forward salience events
    this.salienceScorer.on('salience', (result) => {
      this.emit('salience-scored', result);
    });
    
    // Forward context tracking events
    this.contextTracker.on('tracked', (result) => {
      this.emit('context-tracked', result);
    });
    
    this.contextTracker.on('pattern-detected', (pattern) => {
      this.emit('pattern-detected', pattern);
    });
    
    // Forward Empath events
    if (this.empathIntegration) {
      this.empathIntegration.on('user-state-updated', (event) => {
        this.emit('empath-state-updated', event);
      });
      
      this.empathIntegration.on('error', (error) => {
        this.emit('empath-error', error);
      });
    }
  }
}

/**
 * FearConditioner - Implements fear conditioning from experiences
 * Maps to amygdala fear conditioning function
 */
export class FearConditioner extends EventEmitter {
  /**
   * Create FearConditioner instance
   * @param {object} config - Configuration
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Learning rate for fear conditioning
      learningRate: config.learningRate ?? 0.1,
      
      // Extinction rate (fear decay over time)
      extinctionRate: config.extinctionRate ?? 0.01,
      
      // Generalization radius (similar stimuli trigger fear)
      generalizationRadius: config.generalizationRadius ?? 0.3,
      
      // Minimum fear threshold for expression
      fearThreshold: config.fearThreshold ?? 0.2,
      
      // Maximum conditioned associations
      maxAssociations: config.maxAssociations ?? 100
    };
    
    // Conditioned stimulus associations
    this.associations = new Map();
    
    // Fear memory history
    this.history = [];
  }
  
  /**
   * Condition fear response to a stimulus
   * @param {string} stimulus - Stimulus identifier
   * @param {number} intensity - Fear intensity (0-1)
   * @returns {object} Conditioning result
   */
  condition(stimulus, intensity) {
    const existing = this.associations.get(stimulus) || {
      stimulus,
      fearStrength: 0,
      conditionedAt: Date.now(),
      exposures: 0,
      lastExposure: null
    };
    
    // Update fear strength (Rescorla-Wagner model simplified)
    const predictionError = intensity - existing.fearStrength;
    existing.fearStrength += this.config.learningRate * predictionError;
    existing.fearStrength = Math.min(1, existing.fearStrength);
    
    existing.exposures++;
    existing.lastExposure = Date.now();
    existing.conditionedAt = Date.now();
    
    this.associations.set(stimulus, existing);
    
    // Limit associations
    if (this.associations.size > this.config.maxAssociations) {
      // Remove oldest/weakest association
      const oldest = Array.from(this.associations.entries())
        .sort((a, b) => a[1].conditionedAt - b[1].conditionedAt)[0];
      this.associations.delete(oldest[0]);
    }
    
    // Record in history
    this.history.push({
      type: 'conditioning',
      stimulus,
      intensity,
      timestamp: Date.now()
    });
    
    const result = {
      stimulus,
      fearStrength: existing.fearStrength,
      exposures: existing.exposures,
      newlyConditioned: existing.exposures === 1
    };
    
    this.emit('conditioned', result);
    return result;
  }
  
  /**
   * Test fear response to a stimulus
   * @param {string} stimulus - Stimulus identifier
   * @returns {object} Fear response
   */
  test(stimulus) {
    const association = this.associations.get(stimulus);
    
    if (!association) {
      return { stimulus, fearResponse: 0, triggered: false };
    }
    
    // Apply extinction (time-based decay)
    const timeSinceExposure = Date.now() - association.lastExposure;
    const extinctionFactor = Math.exp(-this.config.extinctionRate * timeSinceExposure / 60000);
    const currentFear = association.fearStrength * extinctionFactor;
    
    // Check for generalization (similar stimuli)
    let generalizationBonus = 0;
    for (const [otherStimulus, otherAssoc] of this.associations) {
      if (otherStimulus !== stimulus) {
        const similarity = this._calculateSimilarity(stimulus, otherStimulus);
        if (similarity > 1 - this.config.generalizationRadius) {
          generalizationBonus += otherAssoc.fearStrength * similarity * 0.3;
        }
      }
    }
    
    const totalFear = Math.min(1, currentFear + generalizationBonus);
    
    return {
      stimulus,
      fearResponse: totalFear,
      triggered: totalFear >= this.config.fearThreshold,
      baseFear: currentFear,
      generalization: generalizationBonus,
      exposures: association.exposures
    };
  }
  
  /**
   * Extinct fear response (exposure therapy)
   * @param {string} stimulus - Stimulus identifier
   * @param {number} safety - Safety signal (0-1, higher = safer)
   * @returns {object} Extinction result
   */
  extinct(stimulus, safety = 0.8) {
    const association = this.associations.get(stimulus);
    
    if (!association) {
      return { stimulus, extincted: false, reason: 'no-association' };
    }
    
    // Reduce fear strength based on safety signal
    const reduction = safety * this.config.learningRate;
    association.fearStrength = Math.max(0, association.fearStrength - reduction);
    association.lastExposure = Date.now();
    
    this.associations.set(stimulus, association);
    
    // Record in history
    this.history.push({
      type: 'extinction',
      stimulus,
      safety,
      timestamp: Date.now()
    });
    
    const result = {
      stimulus,
      extincted: association.fearStrength < this.config.fearThreshold,
      remainingFear: association.fearStrength,
      exposures: association.exposures
    };
    
    this.emit('extincted', result);
    return result;
  }
  
  /**
   * Get all conditioned associations
   * @returns {Array} Associations
   */
  getAssociations() {
    return Array.from(this.associations.values());
  }
  
  /**
   * Clear all associations
   */
  clear() {
    this.associations.clear();
    this.emit('cleared');
  }
  
  /**
   * Calculate similarity between stimuli
   * @private
   */
  _calculateSimilarity(s1, s2) {
    // Simple string similarity (can be enhanced)
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1;
    
    const editDistance = this._levenshteinDistance(longer, shorter);
    return 1 - (editDistance / longer.length);
  }
  
  /**
   * Calculate Levenshtein distance
   * @private
   */
  _levenshteinDistance(s1, s2) {
    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) track[0][i] = i;
    for (let j = 0; j <= s2.length; j++) track[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    
    return track[s2.length][s1.length];
  }
}

// Export main plugin class and components
export default EmotionalSaliencePlugin;
export { ValenceDetector } from './valence-detector.js';
export { SalienceScorer } from './salience-scorer.js';
export { EmotionalContextTracker } from './context-tracker.js';
export { EmpathIntegration, EmpathAdapter } from './empath-integration.js';

// CLI interface for testing
const isMainModule = typeof process !== 'undefined' && process.argv &&
  (process.argv[1] && (process.argv[1].endsWith('index.js') || process.argv[1].endsWith('index')));

if (isMainModule) {
  console.log('Emotional Salience Plugin - CLI Test Mode\n');
  
  const plugin = new EmotionalSaliencePlugin({
    empath: { enabled: false }
  });
  
  // Initialize and run tests
  plugin.initialize().then(() => {
    console.log('\nPlugin initialized successfully');
    
    // Test valence detection
    const testTexts = [
      'This is wonderful! I love this feature!',
      'I am frustrated and angry about this error',
      'The system is working as expected',
      'URGENT: Critical security threat detected!'
    ];
    
    console.log('\n--- Valence Detection Tests ---');
    for (const text of testTexts) {
      const result = plugin.detectValence(text);
      console.log(`\nText: "${text}"`);
      console.log(`Valence: ${result.valence.toFixed(2)} (${result.valenceLabel})`);
      console.log(`Intensity: ${result.intensity.toFixed(2)}`);
      console.log(`Primary Emotion: ${result.primaryEmotion || 'none'}`);
      console.log(`Threat: ${result.threat.detected ? 'YES' : 'no'} (score: ${result.threat.score.toFixed(2)})`);
    }
    
    // Test salience scoring
    console.log('\n--- Salience Scoring Tests ---');
    const testMessages = [
      { id: '1', content: 'URGENT: System crash detected!', sender: 'sentinel' },
      { id: '2', content: 'Thanks for the help', sender: 'user' },
      { id: '3', content: 'The documentation needs updating', sender: 'coder' }
    ];
    
    for (const message of testMessages) {
      const result = plugin.scoreMessage(message);
      console.log(`\nMessage: "${message.content}"`);
      console.log(`Salience Score: ${result.score.toFixed(2)}`);
      console.log(`Category: ${result.category} (${result.priority})`);
      console.log(`Attention Required: ${result.attention.required ? 'YES' : 'no'}`);
    }
    
    // Test threat prioritization
    console.log('\n--- Threat Prioritization Test ---');
    const threats = [
      { content: 'Minor warning in logs', threat: { score: 0.3 } },
      { content: 'CRITICAL: Database corruption detected', threat: { score: 0.9 } },
      { content: 'Memory usage high', threat: { score: 0.5 } }
    ];
    
    const prioritized = plugin.prioritizeThreats(threats);
    prioritized.forEach((t, i) => {
      console.log(`${i + 1}. "${t.content}" - Priority: ${t.priority}`);
    });
    
    // Get statistics
    console.log('\n--- Plugin Statistics ---');
    const stats = plugin.getStatistics();
    console.log(JSON.stringify(stats, null, 2));
    
    // Cleanup
    plugin.dispose().then(() => {
      console.log('\nPlugin disposed');
      process.exit(0);
    });
  }).catch(err => {
    console.error('Plugin initialization failed:', err);
    process.exit(1);
  });
}
