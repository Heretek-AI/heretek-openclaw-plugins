/**
 * Emotional Context Tracker
 * 
 * Tracks emotional context across agent conversations over time.
 * Maintains emotional history, detects patterns, and provides
 * context for salience calculations.
 * 
 * Maps to: Amygdala memory consolidation + Prefrontal context maintenance
 */

import EventEmitter from 'eventemitter3';

/**
 * EmotionalContextTracker class
 */
export class EmotionalContextTracker extends EventEmitter {
  /**
   * Create a new EmotionalContextTracker instance
   * @param {object} config - Tracker configuration
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Time windows for context tracking
      shortTermWindow: config.shortTermWindow ?? 300000,    // 5 minutes
      mediumTermWindow: config.mediumTermWindow ?? 1800000, // 30 minutes
      longTermWindow: config.longTermWindow ?? 3600000,     // 1 hour
      
      // Decay rates (per window)
      emotionalDecayRate: config.emotionalDecayRate ?? 0.3,
      
      // Pattern detection thresholds
      patternThreshold: config.patternThreshold ?? 0.6,
      
      // Maximum history size
      maxHistory: config.maxHistory ?? 1000,
      
      // Track per-agent and per-conversation
      trackPerAgent: config.trackPerAgent ?? true,
      trackPerConversation: config.trackPerConversation ?? true,
      
      // Enable pattern detection
      enablePatternDetection: config.enablePatternDetection ?? true
    };
    
    // Conversation contexts
    this.conversations = new Map();
    
    // Agent emotional profiles
    this.agentProfiles = new Map();
    
    // Global emotional context
    this.globalContext = {
      overallValence: 0,
      overallIntensity: 0,
      dominantEmotions: {},
      lastUpdated: Date.now()
    };
    
    // Pattern library
    this.patterns = [];
  }
  
  /**
   * Track an emotional event in context
   * @param {object} event - Emotional event
   * @returns {object} Updated context
   */
  track(event) {
    const context = {
      timestamp: Date.now(),
      eventId: event.id || this._generateId(),
      
      // Event metadata
      source: event.source || 'unknown',
      type: event.type || 'message',
      conversationId: event.conversationId,
      agentId: event.agentId,
      
      // Emotional data
      valence: event.valence || 0,
      intensity: event.intensity || 0,
      emotions: event.emotions || {},
      
      // Content reference
      contentId: event.contentId,
      summary: event.summary
    };
    
    // Update global context
    this._updateGlobalContext(context);
    
    // Update conversation context
    if (context.conversationId && this.config.trackPerConversation) {
      this._updateConversationContext(context);
    }
    
    // Update agent profile
    if (context.agentId && this.config.trackPerAgent) {
      this._updateAgentProfile(context);
    }
    
    // Detect patterns
    if (this.config.enablePatternDetection) {
      const patterns = this._detectPatterns();
      if (patterns.length > this.patterns.length) {
        this.patterns = patterns;
        this.emit('pattern-detected', patterns[patterns.length - 1]);
      }
    }
    
    // Emit tracking event
    this.emit('tracked', context);
    
    return context;
  }
  
  /**
   * Get current emotional context
   * @param {object} filters - Context filters
   * @returns {object} Emotional context
   */
  getContext(filters = {}) {
    const context = {
      timestamp: Date.now(),
      global: { ...this.globalContext },
      conversation: null,
      agent: null,
      patterns: []
    };
    
    // Get conversation context
    if (filters.conversationId) {
      context.conversation = this.conversations.get(filters.conversationId) || null;
    }
    
    // Get agent context
    if (filters.agentId) {
      context.agent = this.agentProfiles.get(filters.agentId) || null;
    }
    
    // Get recent patterns
    context.patterns = this.patterns.slice(-5);
    
    return context;
  }
  
  /**
   * Get conversation emotional history
   * @param {string} conversationId - Conversation ID
   * @param {number} window - Time window in ms
   * @returns {object} Conversation emotional history
   */
  getConversationHistory(conversationId, window = null) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return { conversationId, events: [], summary: null };
    }
    
    let events = conversation.events;
    if (window) {
      const cutoff = Date.now() - window;
      events = events.filter(e => e.timestamp >= cutoff);
    }
    
    return {
      conversationId,
      events,
      summary: this._summarizeEvents(events)
    };
  }
  
  /**
   * Get agent emotional profile
   * @param {string} agentId - Agent ID
   * @returns {object} Agent emotional profile
   */
  getAgentProfile(agentId) {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) {
      return { agentId, baseline: null, history: [], patterns: [] };
    }
    
    return {
      agentId,
      baseline: profile.baseline,
      history: profile.history.slice(-20),
      patterns: profile.patterns || []
    };
  }
  
  /**
   * Get emotional trend analysis
   * @param {string} scope - Scope: 'global', 'conversation', or 'agent'
   * @param {string} id - ID for conversation/agent scope
   * @param {number} window - Time window
   * @returns {object} Trend analysis
   */
  getTrend(scope = 'global', id = null, window = null) {
    let events = [];
    
    if (scope === 'global') {
      // Collect recent events from all sources
      for (const conv of this.conversations.values()) {
        events = [...events, ...conv.events];
      }
    } else if (scope === 'conversation' && id) {
      const conv = this.conversations.get(id);
      if (conv) events = conv.events;
    } else if (scope === 'agent' && id) {
      const profile = this.agentProfiles.get(id);
      if (profile) events = profile.history;
    }
    
    // Apply time window
    if (window) {
      const cutoff = Date.now() - window;
      events = events.filter(e => e.timestamp >= cutoff);
    }
    
    if (events.length < 2) {
      return {
        scope,
        id,
        trend: 'insufficient-data',
        valenceChange: 0,
        intensityChange: 0,
        dataPoints: events.length
      };
    }
    
    // Calculate trend
    const midpoint = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, midpoint);
    const secondHalf = events.slice(midpoint);
    
    const firstValence = firstHalf.reduce((s, e) => s + e.valence, 0) / firstHalf.length;
    const secondValence = secondHalf.reduce((s, e) => s + e.valence, 0) / secondHalf.length;
    
    const firstIntensity = firstHalf.reduce((s, e) => s + e.intensity, 0) / firstHalf.length;
    const secondIntensity = secondHalf.reduce((s, e) => s + e.intensity, 0) / secondHalf.length;
    
    const valenceChange = secondValence - firstValence;
    const intensityChange = secondIntensity - firstIntensity;
    
    let valenceTrend = 'stable';
    if (valenceChange > 0.15) valenceTrend = 'improving';
    if (valenceChange < -0.15) valenceTrend = 'declining';
    if (valenceChange > 0.4) valenceTrend = 'improving-rapidly';
    if (valenceChange < -0.4) valenceTrend = 'declining-rapidly';
    
    let intensityTrend = 'stable';
    if (intensityChange > 0.15) intensityTrend = 'increasing';
    if (intensityChange < -0.15) intensityTrend = 'decreasing';
    
    return {
      scope,
      id,
      valenceTrend,
      valenceChange,
      intensityTrend,
      intensityChange,
      currentValence: secondValence,
      currentIntensity: secondIntensity,
      dataPoints: events.length,
      timeRange: {
        start: events[0]?.timestamp,
        end: events[events.length - 1]?.timestamp
      }
    };
  }
  
  /**
   * Reset context for a conversation
   * @param {string} conversationId - Conversation ID
   */
  resetConversation(conversationId) {
    this.conversations.delete(conversationId);
    this.emit('conversation-reset', conversationId);
  }
  
  /**
   * Clear all context
   */
  clear() {
    this.conversations.clear();
    this.agentProfiles.clear();
    this.patterns = [];
    this.globalContext = {
      overallValence: 0,
      overallIntensity: 0,
      dominantEmotions: {},
      lastUpdated: Date.now()
    };
    this.emit('cleared');
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  /**
   * Update global emotional context
   */
  _updateGlobalContext(event) {
    const weight = 0.1; // Weight of new event
    
    // Update overall valence (exponential moving average)
    this.globalContext.overallValence = 
      (this.globalContext.overallValence * (1 - weight)) + (event.valence * weight);
    
    // Update overall intensity
    this.globalContext.overallIntensity = 
      (this.globalContext.overallIntensity * (1 - weight)) + (event.intensity * weight);
    
    // Update dominant emotions
    for (const [emotion, score] of Object.entries(event.emotions)) {
      this.globalContext.dominantEmotions[emotion] = 
        (this.globalContext.dominantEmotions[emotion] || 0) * (1 - weight) + (score * weight);
    }
    
    this.globalContext.lastUpdated = Date.now();
  }
  
  /**
   * Update conversation context
   */
  _updateConversationContext(event) {
    let conversation = this.conversations.get(event.conversationId);
    
    if (!conversation) {
      conversation = {
        id: event.conversationId,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        events: [],
        participants: new Set(),
        emotionalTrend: { valence: 0, intensity: 0 }
      };
      this.conversations.set(event.conversationId, conversation);
    }
    
    // Add event
    conversation.events.push(event);
    
    // Limit history
    const maxEvents = this.config.maxHistory / Math.max(1, this.conversations.size);
    if (conversation.events.length > maxEvents) {
      conversation.events.shift();
    }
    
    // Update participants
    if (event.agentId) {
      conversation.participants.add(event.agentId);
    }
    
    // Update emotional trend
    const recentEvents = conversation.events.slice(-10);
    conversation.emotionalTrend = {
      valence: recentEvents.reduce((s, e) => s + e.valence, 0) / recentEvents.length,
      intensity: recentEvents.reduce((s, e) => s + e.intensity, 0) / recentEvents.length
    };
    
    conversation.lastUpdated = Date.now();
  }
  
  /**
   * Update agent emotional profile
   */
  _updateAgentProfile(event) {
    let profile = this.agentProfiles.get(event.agentId);
    
    if (!profile) {
      profile = {
        id: event.agentId,
        createdAt: Date.now(),
        baseline: {
          valence: 0,
          intensity: 0,
          dominantEmotions: {}
        },
        history: [],
        patterns: []
      };
      this.agentProfiles.set(event.agentId, profile);
    }
    
    // Add to history
    profile.history.push(event);
    
    // Limit history
    if (profile.history.length > 100) {
      profile.history.shift();
    }
    
    // Update baseline (moving average)
    const recentHistory = profile.history.slice(-20);
    profile.baseline.valence = recentHistory.reduce((s, e) => s + e.valence, 0) / recentHistory.length;
    profile.baseline.intensity = recentHistory.reduce((s, e) => s + e.intensity, 0) / recentHistory.length;
    
    // Update dominant emotions
    const emotionCounts = {};
    for (const e of recentHistory) {
      for (const [emotion, score] of Object.entries(e.emotions)) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + score;
      }
    }
    
    profile.baseline.dominantEmotions = emotionCounts;
    
    profile.lastUpdated = Date.now();
  }
  
  /**
   * Detect emotional patterns
   */
  _detectPatterns() {
    const patterns = [];
    
    // Detect emotional escalation patterns
    for (const [convId, conv] of this.conversations) {
      if (conv.events.length < 5) continue;
      
      const recent = conv.events.slice(-10);
      const intensityTrend = this._calculateTrend(recent.map(e => e.intensity));
      
      if (intensityTrend > this.config.patternThreshold) {
        patterns.push({
          type: 'emotional-escalation',
          conversationId: convId,
          confidence: intensityTrend,
          description: 'Emotional intensity is escalating'
        });
      }
      
      if (intensityTrend < -this.config.patternThreshold) {
        patterns.push({
          type: 'emotional-deescalation',
          conversationId: convId,
          confidence: Math.abs(intensityTrend),
          description: 'Emotional intensity is de-escalating'
        });
      }
      
      // Detect valence shifts
      const valenceTrend = this._calculateTrend(recent.map(e => e.valence));
      if (Math.abs(valenceTrend) > this.config.patternThreshold) {
        patterns.push({
          type: valenceTrend > 0 ? 'positive-shift' : 'negative-shift',
          conversationId: convId,
          confidence: Math.abs(valenceTrend),
          description: valenceTrend > 0 ? 'Conversation becoming more positive' : 'Conversation becoming more negative'
        });
      }
    }
    
    // Detect agent emotional patterns
    for (const [agentId, profile] of this.agentProfiles) {
      if (profile.history.length < 10) continue;
      
      // Detect emotional volatility
      const recentIntensities = profile.history.slice(-20).map(e => e.intensity);
      const volatility = this._calculateVolatility(recentIntensities);
      
      if (volatility > this.config.patternThreshold) {
        patterns.push({
          type: 'emotional-volatility',
          agentId,
          confidence: volatility,
          description: 'Agent showing high emotional volatility'
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * Calculate trend in a series
   */
  _calculateTrend(series) {
    if (series.length < 2) return 0;
    
    const midpoint = Math.floor(series.length / 2);
    const firstHalf = series.slice(0, midpoint);
    const secondHalf = series.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }
  
  /**
   * Calculate volatility in a series
   */
  _calculateVolatility(series) {
    if (series.length < 2) return 0;
    
    const mean = series.reduce((s, v) => s + v, 0) / series.length;
    const variance = series.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / series.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Summarize events
   */
  _summarizeEvents(events) {
    if (events.length === 0) return null;
    
    return {
      eventCount: events.length,
      averageValence: events.reduce((s, e) => s + e.valence, 0) / events.length,
      averageIntensity: events.reduce((s, e) => s + e.intensity, 0) / events.length,
      dominantEmotion: this._getDominantEmotion(events),
      timeRange: {
        start: events[0]?.timestamp,
        end: events[events.length - 1]?.timestamp
      }
    };
  }
  
  /**
   * Get dominant emotion from events
   */
  _getDominantEmotion(events) {
    const emotionScores = {};
    for (const event of events) {
      for (const [emotion, score] of Object.entries(event.emotions)) {
        emotionScores[emotion] = (emotionScores[emotion] || 0) + score;
      }
    }
    
    let maxScore = 0;
    let dominant = null;
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominant = emotion;
      }
    }
    
    return dominant;
  }
  
  /**
   * Generate unique ID
   */
  _generateId() {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default EmotionalContextTracker;
