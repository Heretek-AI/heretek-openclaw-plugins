/**
 * Salience Scorer
 * 
 * Implements salience scoring system for automatic importance detection.
 * Maps to amygdala and salience network functions (insular cortex + ACC).
 * 
 * Salience is computed from multiple factors:
 * - Emotional intensity (amygdala-driven)
 * - Threat level (amygdala-driven)
 * - Urgency (time-sensitivity)
 * - Importance (goal relevance)
 * - Relevance (context alignment)
 * - Novelty (surprise/unexpectedness)
 */

import EventEmitter from 'eventemitter3';

/**
 * Default value weights for salience calculation
 * These can be customized based on collective values
 */
const DEFAULT_VALUE_WEIGHTS = {
  safety: 1.0,        // Highest priority for threats
  urgency: 0.8,       // Time-sensitive matters
  importance: 0.7,    // Goal relevance
  emotional: 0.6,     // Emotional intensity
  novelty: 0.4,       // New/unexpected information
  social: 0.5,        // Social/relationship relevance
  cognitive: 0.3      // Abstract/conceptual relevance
};

/**
 * Salience categories with thresholds
 */
const SALIENCE_CATEGORIES = {
  critical: { threshold: 0.85, priority: 'immediate', color: 'red' },
  high: { threshold: 0.65, priority: 'high', color: 'orange' },
  medium: { threshold: 0.40, priority: 'normal', color: 'yellow' },
  low: { threshold: 0.20, priority: 'low', color: 'blue' },
  negligible: { threshold: 0, priority: 'background', color: 'gray' }
};

/**
 * SalienceScorer class for computing salience scores
 */
export class SalienceScorer extends EventEmitter {
  /**
   * Create a new SalienceScorer instance
   * @param {object} config - Scorer configuration
   */
  constructor(config = {}) {
    super();
    
    this.config = {
      // Value weights (can be updated dynamically)
      valueWeights: { ...DEFAULT_VALUE_WEIGHTS, ...(config.valueWeights || {}) },
      
      // Salience thresholds
      salienceThreshold: config.salienceThreshold ?? 0.3,
      attentionThreshold: config.attentionThreshold ?? 0.6,
      
      // Decay rate for temporal relevance (per minute)
      temporalDecayRate: config.temporalDecayRate ?? 0.01,
      
      // Novelty detection window (ms)
      noveltyWindow: config.noveltyWindow ?? 300000, // 5 minutes
      
      // Enable specific scoring components
      enableEmotionalScoring: config.enableEmotionalScoring ?? true,
      enableThreatScoring: config.enableThreatScoring ?? true,
      enableNoveltyScoring: config.enableNoveltyScoring ?? true,
      enableContextualScoring: config.enableContextualScoring ?? true,
      
      // Context tracking
      trackHistory: config.trackHistory ?? true
    };
    
    // Value configuration (amygdala-like value system)
    this.values = new Map();
    this._initializeDefaultValues();
    
    // History for novelty detection
    this.history = [];
    this.maxHistory = config.maxHistory ?? 500;
    
    // Current context state
    this.contextState = {
      activeGoals: [],
      currentFocus: null,
      emotionalBaseline: { valence: 0, intensity: 0 },
      threatLevel: 'low'
    };
  }
  
  /**
   * Initialize default value system
   */
  _initializeDefaultValues() {
    // Core survival values (amygdala-driven)
    this.setValue('safety', {
      weight: 1.0,
      description: 'Physical and psychological safety',
      category: 'survival',
      priority: 'critical'
    });
    
    this.setValue('threat-avoidance', {
      weight: 0.95,
      description: 'Avoiding harm and danger',
      category: 'survival',
      priority: 'critical'
    });
    
    // Social values
    this.setValue('relationship', {
      weight: 0.7,
      description: 'Maintaining positive relationships',
      category: 'social',
      priority: 'high'
    });
    
    this.setValue('trust', {
      weight: 0.8,
      description: 'Building and maintaining trust',
      category: 'social',
      priority: 'high'
    });
    
    // Cognitive values
    this.setValue('knowledge', {
      weight: 0.5,
      description: 'Acquiring and applying knowledge',
      category: 'cognitive',
      priority: 'medium'
    });
    
    this.setValue('accuracy', {
      weight: 0.6,
      description: 'Correctness and precision',
      category: 'cognitive',
      priority: 'medium'
    });
    
    // Goal-related values
    this.setValue('goal-achievement', {
      weight: 0.75,
      description: 'Completing objectives',
      category: 'motivational',
      priority: 'high'
    });
    
    this.setValue('efficiency', {
      weight: 0.4,
      description: 'Optimal resource usage',
      category: 'motivational',
      priority: 'medium'
    });
  }
  
  /**
   * Calculate salience score for content
   * @param {object} content - Content to score
   * @param {object} options - Scoring options
   * @returns {object} Salience score result
   */
  calculateSalience(content, options = {}) {
    const result = {
      timestamp: Date.now(),
      contentId: options.contentId || this._generateId(),
      
      // Store reference to original content for history
      content: content || {},
      
      // Component scores (0-1)
      components: {
        emotional: 0,
        threat: 0,
        urgency: 0,
        importance: 0,
        relevance: 0,
        novelty: 0
      },
      
      // Weighted salience score (0-1)
      score: 0,
      
      // Salience category
      category: 'negligible',
      
      // Priority level
      priority: 'background',
      
      // Attention recommendation
      attention: {
        required: false,
        level: 'none',
        reason: null
      },
      
      // Value alignment
      valueAlignment: [],
      
      // Action recommendations
      recommendations: []
    };
    
    // Extract valence data if provided
    const valenceData = (content && (content.valence || content.emotions)) || {};
    
    // Calculate emotional salience (amygdala function)
    if (this.config.enableEmotionalScoring) {
      result.components.emotional = this._calculateEmotionalSalience(valenceData);
    }
    
    // Calculate threat salience (amygdala function)
    if (this.config.enableThreatScoring) {
      result.components.threat = this._calculateThreatSalience(content, valenceData);
    }
    
    // Calculate urgency salience
    result.components.urgency = this._calculateUrgencySalience(content);
    
    // Calculate importance salience
    result.components.importance = this._calculateImportanceSalience(content);
    
    // Calculate relevance salience (goal/context alignment)
    if (this.config.enableContextualScoring) {
      result.components.relevance = this._calculateRelevanceSalience(content);
    }
    
    // Calculate novelty salience
    if (this.config.enableNoveltyScoring) {
      result.components.novelty = this._calculateNoveltySalience(content);
    }
    
    // Compute weighted salience score
    result.score = this._computeWeightedScore(result.components);
    
    // Determine category and priority
    this._categorizeSalience(result);
    
    // Determine attention requirements
    this._determineAttention(result);
    
    // Calculate value alignment
    result.valueAlignment = this._calculateValueAlignment(result.components);
    
    // Generate recommendations
    result.recommendations = this._generateRecommendations(result);
    
    // Update history
    if (this.config.trackHistory) {
      this._addToHistory(result, content);
    }
    
    // Emit salience event
    this.emit('salience', result);
    
    return result;
  }
  
  /**
   * Calculate salience for a message/proposal
   * @param {object} message - Message object
   * @param {object} context - Additional context
   * @returns {object} Message salience result
   */
  scoreMessage(message, context = {}) {
    // Enrich message with valence data if not present
    const enrichedMessage = {
      ...message,
      valence: message.valence || this._extractValenceFromContent(message.content)
    };
    
    const salienceResult = this.calculateSalience(enrichedMessage, {
      contentId: message.id,
      ...context
    });
    
    // Add message-specific metadata
    salienceResult.message = {
      id: message.id,
      sender: message.sender,
      type: message.type || 'message',
      channel: message.channel
    };
    
    return salienceResult;
  }
  
  /**
   * Prioritize a list of items by salience
   * @param {Array} items - Items to prioritize
   * @returns {Array} Prioritized items
   */
  prioritize(items) {
    const scored = items.map(item => ({
      item,
      salience: this.calculateSalience(item)
    }));
    
    // Sort by salience score (descending)
    scored.sort((a, b) => b.salience.score - a.salience.score);
    
    return scored.map(({ item, salience }) => ({
      ...item,
      salience
    }));
  }
  
  /**
   * Prioritize threats (amygdala-like threat prioritization)
   * @param {Array} threats - Threat items
   * @returns {Array} Prioritized threats
   */
  prioritizeThreats(threats) {
    const scored = threats.map(threat => {
      const salience = this.calculateSalience(threat);
      // Boost threat score based on threat level
      const threatBoost = (threat.threat?.score || 0) * 0.3;
      return {
        item: threat,
        salience,
        adjustedScore: Math.min(1, salience.score + threatBoost)
      };
    });
    
    // Sort by adjusted score
    scored.sort((a, b) => b.adjustedScore - a.adjustedScore);
    
    return scored.map(({ item, salience, adjustedScore }) => ({
      ...item,
      salience,
      adjustedScore,
      priority: this._getPriorityFromScore(adjustedScore)
    }));
  }
  
  /**
   * Update value weights dynamically
   * @param {string} valueName - Value name
   * @param {number} weight - New weight (0-1)
   */
  updateValueWeight(valueName, weight) {
    const clampedWeight = Math.max(0, Math.min(1, weight));
    this.config.valueWeights[valueName] = clampedWeight;
    
    if (this.values.has(valueName)) {
      const value = this.values.get(valueName);
      value.weight = clampedWeight;
      this.values.set(valueName, value);
    }
    
    this.emit('value-updated', { name: valueName, weight: clampedWeight });
  }
  
  /**
   * Set a value in the value system
   * @param {string} name - Value name
   * @param {object} config - Value configuration
   */
  setValue(name, config) {
    this.values.set(name, {
      name,
      weight: config.weight ?? 0.5,
      description: config.description || '',
      category: config.category || 'general',
      priority: config.priority || 'medium',
      updatedAt: Date.now()
    });
  }
  
  /**
   * Get a value from the value system
   * @param {string} name - Value name
   * @returns {object|null} Value configuration
   */
  getValue(name) {
    return this.values.get(name) || null;
  }
  
  /**
   * Update context state
   * @param {object} context - New context state
   */
  updateContext(context) {
    this.contextState = {
      ...this.contextState,
      ...context
    };
    this.emit('context-updated', this.contextState);
  }
  
  /**
   * Get current context state
   * @returns {object} Context state
   */
  getContext() {
    return { ...this.contextState };
  }
  
  /**
   * Get salience statistics
   * @param {number} window - Number of recent items to analyze
   * @returns {object} Statistics
   */
  getStatistics(window = 50) {
    const recent = this.history.slice(-window);
    if (recent.length === 0) {
      return {
        averageScore: 0,
        categoryDistribution: {},
        topValues: [],
        attentionRate: 0
      };
    }
    
    const avgScore = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    
    const categoryDistribution = {};
    for (const result of recent) {
      categoryDistribution[result.category] = (categoryDistribution[result.category] || 0) + 1;
    }
    
    const valueCounts = {};
    for (const result of recent) {
      for (const alignment of result.valueAlignment) {
        valueCounts[alignment.value] = (valueCounts[alignment.value] || 0) + 1;
      }
    }
    
    const topValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
    
    const attentionRate = recent.filter(r => r.attention.required).length / recent.length;
    
    return {
      averageScore: avgScore,
      categoryDistribution,
      topValues,
      attentionRate,
      sampleSize: recent.length
    };
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    this.emit('history-cleared');
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  /**
   * Calculate emotional salience component
   */
  _calculateEmotionalSalience(valenceData) {
    if (!valenceData || Object.keys(valenceData).length === 0) {
      return 0;
    }
    
    // Emotional intensity contributes to salience
    const emotions = valenceData.emotions || {};
    const emotionScores = Object.values(emotions);
    
    if (emotionScores.length === 0) {
      return 0;
    }
    
    // Max emotion intensity
    const maxIntensity = Math.max(...emotionScores);
    
    // Emotional complexity (multiple emotions = higher salience)
    const complexity = emotionScores.filter(s => s > 0.3).length / 10;
    
    // Valence extremity (strong positive or negative = higher salience)
    const valence = valenceData.valence || 0;
    const valenceExtremity = Math.abs(valence);
    
    return Math.min(1, (maxIntensity * 0.6) + (complexity * 0.2) + (valenceExtremity * 0.2));
  }
  
  /**
   * Calculate threat salience component (amygdala function)
   */
  _calculateThreatSalience(content, valenceData) {
    let threatScore = 0;
    
    // Direct threat indicators
    if (content.threat?.detected) {
      threatScore = content.threat.score || 0.5;
    } else if (valenceData.threat?.detected) {
      threatScore = valenceData.threat.score || 0.5;
    }
    
    // Fear emotion boosts threat salience
    if (valenceData.emotions?.fear) {
      threatScore = Math.max(threatScore, valenceData.emotions.fear * 0.8);
    }
    
    // Anger emotion can indicate threat
    if (valenceData.emotions?.anger) {
      threatScore = Math.max(threatScore, valenceData.emotions.anger * 0.5);
    }
    
    return Math.min(1, threatScore);
  }
  
  /**
   * Calculate urgency salience component
   */
  _calculateUrgencySalience(content) {
    if (content.urgency?.detected) {
      return content.urgency.score || 0.5;
    }
    
    // Check for temporal indicators in content
    const text = content.content || content.text || '';
    const lowerText = text.toLowerCase();
    
    const urgentPatterns = [
      /\basap\b/i, /\bimmediately\b/i, /\burgent\b/i,
      /\bdeadline\b/i, /\bdue\b/i, /\bnow\b/i
    ];
    
    let score = 0;
    for (const pattern of urgentPatterns) {
      if (pattern.test(lowerText)) {
        score += 0.25;
      }
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Calculate importance salience component
   */
  _calculateImportanceSalience(content) {
    if (content.importance?.detected) {
      return content.importance.score || 0.5;
    }
    
    // Check for importance indicators
    const text = content.content || content.text || '';
    const lowerText = text.toLowerCase();
    
    const importantPatterns = [
      /\bimportant\b/i, /\bcritical\b/i, /\bessential\b/i,
      /\bvital\b/i, /\bkey\b/i, /\bmajor\b/i,
      /\bpriority\b/i, /\bmust\b/i, /\bneed to\b/i
    ];
    
    let score = 0;
    for (const pattern of importantPatterns) {
      if (pattern.test(lowerText)) {
        score += 0.2;
      }
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Calculate relevance salience component
   */
  _calculateRelevanceSalience(content) {
    let relevance = 0.3; // Base relevance
    
    // Check alignment with active goals
    if (this.contextState.activeGoals.length > 0) {
      const text = (content && (content.content || content.text)) || '';
      const lowerText = text.toLowerCase();
      
      let goalMatches = 0;
      for (const goal of this.contextState.activeGoals) {
        if (lowerText.includes(goal.toLowerCase())) {
          goalMatches++;
        }
      }
      
      relevance += (goalMatches / this.contextState.activeGoals.length) * 0.5;
    }
    
    // Check alignment with current focus
    if (this.contextState.currentFocus) {
      const text = (content && (content.content || content.text)) || '';
      if (text.toLowerCase().includes(this.contextState.currentFocus.toLowerCase())) {
        relevance += 0.2;
      }
    }
    
    return Math.min(1, relevance);
  }
  
  /**
   * Calculate novelty salience component
   */
  _calculateNoveltySalience(content) {
    const now = Date.now();
    const contentHash = this._hashContent(content || {});
    
    // Check if similar content was seen recently
    const recentItems = this.history.filter(
      r => now - r.timestamp < this.config.noveltyWindow
    );
    
    // Check for duplicate/similar content
    const similarContent = recentItems.filter(
      r => Math.abs(r.contentHash - contentHash) < 1000
    );
    
    if (similarContent.length > 0) {
      // Not novel - seen recently
      return 0.1;
    }
    
    // Check for new topics/concepts
    const text = (content && (content.content || content.text)) || '';
    const words = text.toLowerCase().match(/\b[\w'-]+\b/g) || [];
    
    // Count unique words in recent history
    const recentWords = new Set();
    for (const item of recentItems.slice(-20)) {
      const itemText = item.rawContent || '';
      const itemWords = itemText.toLowerCase().match(/\b[\w'-]+\b/g) || [];
      for (const word of itemWords) {
        recentWords.add(word);
      }
    }
    
    // Novel words ratio
    const novelWords = words.filter(w => !recentWords.has(w) && w.length > 4);
    const noveltyRatio = novelWords.length / Math.max(1, words.length);
    
    return Math.min(1, noveltyRatio * 2); // Boost novelty score
  }
  
  /**
   * Compute weighted salience score
   */
  _computeWeightedScore(components) {
    const weights = this.config.valueWeights || DEFAULT_VALUE_WEIGHTS;
    
    // Apply value weights to components
    let score = 0;
    let totalWeight = 0;
    
    // Threat has highest priority (amygdala priority)
    if (components.threat > 0.5) {
      score += components.threat * (weights.safety || 1.0) * 1.2; // Boost for high threats
      totalWeight += (weights.safety || 1.0) * 1.2;
    } else {
      score += components.threat * (weights.safety || 1.0);
      totalWeight += weights.safety || 1.0;
    }
    
    score += components.urgency * (weights.urgency || 0.8);
    totalWeight += weights.urgency || 0.8;
    
    score += components.importance * (weights['goal-achievement'] || 0.75);
    totalWeight += weights['goal-achievement'] || 0.75;
    
    score += components.emotional * (weights.emotional || 0.6);
    totalWeight += weights.emotional || 0.6;
    
    score += components.relevance * (weights.cognitive || 0.3);
    totalWeight += weights.cognitive || 0.3;
    
    score += components.novelty * (weights.novelty || 0.4);
    totalWeight += weights.novelty || 0.4;
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }
  
  /**
   * Categorize salience score
   */
  _categorizeSalience(result) {
    for (const [category, config] of Object.entries(SALIENCE_CATEGORIES)) {
      if (result.score >= config.threshold) {
        result.category = category;
        result.priority = config.priority;
        result.color = config.color;
        break;
      }
    }
  }
  
  /**
   * Determine attention requirements
   */
  _determineAttention(result) {
    if (result.score >= this.config.attentionThreshold) {
      result.attention.required = true;
      
      if (result.category === 'critical') {
        result.attention.level = 'immediate';
        result.attention.reason = 'Critical salience - immediate attention required';
      } else if (result.category === 'high') {
        result.attention.level = 'high';
        result.attention.reason = 'High salience - priority attention needed';
      } else {
        result.attention.level = 'moderate';
        result.attention.reason = 'Moderate salience - attention recommended';
      }
    } else {
      result.attention.required = false;
      result.attention.level = 'none';
    }
  }
  
  /**
   * Calculate value alignment
   */
  _calculateValueAlignment(components) {
    const alignments = [];
    
    if (components.threat > 0.3) {
      alignments.push({ value: 'safety', alignment: components.threat });
    }
    
    if (components.importance > 0.3) {
      alignments.push({ value: 'goal-achievement', alignment: components.importance });
    }
    
    if (components.emotional > 0.3) {
      alignments.push({ value: 'relationship', alignment: components.emotional });
    }
    
    if (components.novelty > 0.5) {
      alignments.push({ value: 'knowledge', alignment: components.novelty });
    }
    
    return alignments.sort((a, b) => b.alignment - a.alignment);
  }
  
  /**
   * Generate action recommendations
   */
  _generateRecommendations(result) {
    const recommendations = [];
    
    if (result.category === 'critical') {
      recommendations.push({
        action: 'escalate',
        reason: 'Critical salience detected',
        urgency: 'immediate'
      });
    }
    
    if (result.components.threat > 0.6) {
      recommendations.push({
        action: 'threat-review',
        reason: 'High threat level detected',
        urgency: 'high'
      });
    }
    
    if (result.components.urgency > 0.6) {
      recommendations.push({
        action: 'prioritize',
        reason: 'Time-sensitive content',
        urgency: 'high'
      });
    }
    
    if (result.attention.required && result.category === 'high') {
      recommendations.push({
        action: 'review',
        reason: 'High salience content requires review',
        urgency: 'normal'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Add result to history
   */
  _addToHistory(result, originalContent) {
    const content = originalContent || result.content || {};
    this.history.push({
      ...result,
      rawContent: (content && (content.content || content.text)) || '',
      contentHash: this._hashContent(content)
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
  
  /**
   * Generate a simple hash for content
   */
  _hashContent(content) {
    const text = content.content || content.text || '';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * Generate unique ID
   */
  _generateId() {
    return `salience-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get priority from score
   */
  _getPriorityFromScore(score) {
    if (score >= SALIENCE_CATEGORIES.critical.threshold) return 'immediate';
    if (score >= SALIENCE_CATEGORIES.high.threshold) return 'high';
    if (score >= SALIENCE_CATEGORIES.medium.threshold) return 'normal';
    if (score >= SALIENCE_CATEGORIES.low.threshold) return 'low';
    return 'background';
  }
  
  /**
   * Extract valence from content
   */
  _extractValenceFromContent(content) {
    if (!content) return {};
    if (typeof content !== 'string') return {};
    
    // Simple heuristic valence extraction
    const lowerContent = content.toLowerCase();
    
    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'happy', 'love', 'thanks', 'thank'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'hate', 'error', 'fail', 'problem'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of positiveWords) {
      if (lowerContent.includes(word)) positiveCount++;
    }
    
    for (const word of negativeWords) {
      if (lowerContent.includes(word)) negativeCount++;
    }
    
    const total = positiveCount + negativeCount;
    if (total === 0) return { valence: 0, emotions: {} };
    
    return {
      valence: (positiveCount - negativeCount) / total,
      emotions: {
        ...(positiveCount > 0 ? { joy: positiveCount / 5 } : {}),
        ...(negativeCount > 0 ? { sadness: negativeCount / 5 } : {})
      }
    };
  }
}

export default SalienceScorer;
