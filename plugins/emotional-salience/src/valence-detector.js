/**
 * Emotional Valence Detector
 * 
 * Detects emotional valence (positive/negative/neutral) and specific emotions
 * from text content using pattern matching and sentiment analysis.
 * 
 * Maps to amygdala function: Emotional processing and threat detection
 */

import EventEmitter from 'eventemitter3';

/**
 * Basic emotion lexicon based on Ekman's basic emotions
 * and Plutchik's wheel of emotions
 */
const EMOTION_LEXICON = {
  // Positive emotions
  joy: ['joy', 'joyful', 'happiness', 'happy', 'glad', 'delighted', 'pleased', 'thrilled', 'excited', 'wonderful', 'great', 'excellent', 'amazing', 'fantastic', 'awesome', 'love', 'loving', 'grateful', 'gratitude', 'proud', 'confidence', 'confident', 'hope', 'hopeful', 'optimistic'],
  trust: ['trust', 'trusting', 'accept', 'acceptance', 'agree', 'agreement', 'support', 'supportive', 'believe', 'belief', 'faith', 'confident', 'reliable', 'dependable', 'safe', 'security', 'comfort', 'comfortable'],
  anticipation: ['anticipation', 'excited', 'eager', 'looking forward', 'expect', 'expectation', 'hope', 'plan', 'planning', 'prepare', 'preparation', 'ready', 'interest', 'interested', 'curious', 'curiosity'],
  
  // Negative emotions
  anger: ['anger', 'angry', 'mad', 'furious', 'irate', 'annoyed', 'irritated', 'frustrated', 'frustrating', 'outraged', 'hostile', 'aggressive', 'hate', 'hatred', 'resentful', 'bitter', 'livid', 'enraged', 'infuriated'],
  fear: ['fear', 'afraid', 'scared', 'terrified', 'anxious', 'anxiety', 'nervous', 'worried', 'worry', 'panic', 'panicked', 'dread', 'horror', 'alarmed', 'threatened', 'unsafe', 'danger', 'dangerous', 'threat', 'threatening'],
  sadness: ['sad', 'sadness', 'depressed', 'depressing', 'unhappy', 'sorrow', 'sorrowful', 'grief', 'grieving', 'loss', 'lonely', 'loneliness', 'heartbroken', 'devastated', 'hopeless', 'despair', 'misery', 'miserable', 'cry', 'crying', 'tears'],
  disgust: ['disgust', 'disgusted', 'disgusting', 'revulsion', 'repulsed', 'nauseated', 'sick', 'sickened', 'appalled', 'horrified', 'contempt', 'despise', 'loathe', 'loathing', 'detest', 'detestable'],
  surprise: ['surprise', 'surprised', 'shocked', 'astonished', 'amazed', 'stunned', 'startled', 'unexpected', 'wow', 'whoa', 'incredible', 'unbelievable'],
  
  // Neutral/complex emotions
  confusion: ['confused', 'confusion', 'uncertain', 'uncertainty', 'unsure', 'puzzled', 'perplexed', 'bewildered', 'confusing', 'unclear', 'ambiguous', 'doubt', 'doubtful', 'question', 'questioning'],
  fatigue: ['tired', 'tiredness', 'exhausted', 'exhaustion', 'weary', 'weariness', 'drained', 'burnout', 'sleepy', 'fatigue', 'lethargic', 'overwhelmed']
};

/**
 * Intensity modifiers
 */
const INTENSITY_MODIFIERS = {
  amplifiers: ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'utterly', 'really', 'so', 'exceptionally', 'remarkably', 'intensely', 'profoundly', 'deeply', 'highly', 'tremendously', 'enormously'],
  dampeners: ['slightly', 'somewhat', 'a bit', 'a little', 'kind of', 'sort of', 'mildly', 'barely', 'hardly', 'minimally', 'moderately', 'fairly', 'rather']
};

/**
 * Negation patterns
 */
const NEGATION_PATTERNS = [
  /\bnot\b/i,
  /\bno\b/i,
  /\bnever\b/i,
  /\bneither\b/i,
  /\bnobody\b/i,
  /\bnothing\b/i,
  /\bnowhere\b/i,
  /\bcannot\b/i,
  /\bcan't\b/i,
  /\bwon't\b/i,
  /\bshouldn't\b/i,
  /\bwouldn't\b/i,
  /\bcouldn't\b/i,
  /\bdidn't\b/i,
  /\bdoesn't\b/i,
  /\bdon't\b/i,
  /\bisn't\b/i,
  /\baren't\b/i,
  /\bwasn't\b/i,
  /\bweren't\b/i,
  /\bwithout\b/i,
  /\black\b/i,
  /\blacking\b/i,
  /\babsence\b/i,
  /\babsent\b/i
];

/**
 * Threat indicators for amygdala-like threat prioritization
 */
const THREAT_INDICATORS = [
  'danger', 'dangerous', 'threat', 'threatening', 'harm', 'harmful', 'risk', 'risky',
  'error', 'errors', 'failure', 'failed', 'failing', 'fail', 'critical', 'crisis',
  'emergency', 'urgent', 'immediate', 'attack', 'attack', 'breach', 'violation',
  'malicious', 'hostile', 'aggressive', 'abuse', 'exploit', 'vulnerability',
  'dead', 'death', 'kill', 'destroy', 'damage', 'damaged', 'destruction',
  'loss', 'lost', 'missing', 'corrupted', 'corruption', 'compromised'
];

/**
 * Urgency indicators
 */
const URGENCY_INDICATORS = [
  'asap', 'immediately', 'now', 'right now', 'instant', 'instantly',
  'quick', 'quickly', 'fast', 'faster', 'urgent', 'urgency',
  'deadline', 'due', 'time-sensitive', 'pressing', 'pressing matter',
  'priority', 'high priority', 'critical', 'emergency', 'stat'
];

/**
 * Importance indicators
 */
const IMPORTANCE_INDICATORS = [
  'important', 'importance', 'crucial', 'critical', 'essential', 'vital',
  'key', 'significant', 'significance', 'major', 'primary', 'main',
  'fundamental', 'paramount', 'imperative', 'necessary', 'required',
  'must', 'need', 'needs', 'need to', 'have to', 'should', 'ought to'
];

/**
 * ValenceDetector class for emotional valence detection
 */
export class ValenceDetector extends EventEmitter {
  /**
   * Create a new ValenceDetector instance
   * @param {object} config - Detector configuration
   */
  constructor(config = {}) {
    super();
    this.config = {
      // Sensitivity thresholds (0-1)
      emotionThreshold: config.emotionThreshold ?? 0.3,
      threatThreshold: config.threatThreshold ?? 0.4,
      
      // Weights for different components
      lexiconWeight: config.lexiconWeight ?? 0.6,
      contextWeight: config.contextWeight ?? 0.3,
      intensityWeight: config.intensityWeight ?? 0.1,
      
      // Custom lexicon additions
      customLexicon: config.customLexicon || {},
      
      // Enable threat detection
      enableThreatDetection: config.enableThreatDetection ?? true,
      
      // Track emotional context over time
      trackContext: config.trackContext ?? true
    };
    
    // Merge custom lexicon
    this.lexicon = { ...EMOTION_LEXICON };
    for (const [emotion, words] of Object.entries(this.config.customLexicon)) {
      if (this.lexicon[emotion]) {
        this.lexicon[emotion] = [...this.lexicon[emotion], ...words];
      } else {
        this.lexicon[emotion] = words;
      }
    }
    
    // Emotional context history
    this.contextHistory = [];
    this.maxContextHistory = config.maxContextHistory ?? 100;
  }
  
  /**
   * Detect emotional valence in text
   * @param {string} text - Text to analyze
   * @param {object} options - Analysis options
   * @returns {object} Valence detection results
   */
  detect(text, options = {}) {
    const result = {
      text,
      timestamp: Date.now(),
      
      // Overall valence (-1 to 1: negative to positive)
      valence: 0,
      valenceLabel: 'neutral',
      
      // Emotional intensity (0-1)
      intensity: 0,
      
      // Detected emotions with scores
      emotions: {},
      
      // Primary emotion
      primaryEmotion: null,
      
      // Threat detection (amygdala function)
      threat: {
        detected: false,
        score: 0,
        indicators: []
      },
      
      // Urgency detection
      urgency: {
        detected: false,
        score: 0,
        indicators: []
      },
      
      // Importance detection
      importance: {
        detected: false,
        score: 0,
        indicators: []
      },
      
      // Confidence in detection
      confidence: 0
    };
    
    // Tokenize and analyze
    const tokens = this._tokenize(text);
    const lowerText = text.toLowerCase();
    
    // Detect emotions from lexicon
    const emotionScores = this._detectEmotions(tokens, lowerText);
    
    // Apply intensity modifiers
    const intensityMultiplier = this._detectIntensity(tokens, lowerText);
    
    // Check for negation
    const negationCount = this._detectNegation(tokens, lowerText);
    
    // Detect threat indicators (amygdala-like threat detection)
    if (this.config.enableThreatDetection) {
      result.threat = this._detectThreat(tokens, lowerText);
    }
    
    // Detect urgency
    result.urgency = this._detectUrgency(tokens, lowerText);
    
    // Detect importance
    result.importance = this._detectImportance(tokens, lowerText);
    
    // Process emotion scores
    for (const [emotion, score] of Object.entries(emotionScores)) {
      // Apply intensity and negation
      let adjustedScore = score * intensityMultiplier;
      if (negationCount > 0 && this._isNegated(emotion, tokens, lowerText)) {
        adjustedScore = -adjustedScore * 0.5; // Negation reduces and inverts
      }
      
      if (adjustedScore > this.config.emotionThreshold) {
        result.emotions[emotion] = Math.min(1, adjustedScore);
      }
    }
    
    // Calculate overall valence
    result.valence = this._calculateValence(result.emotions);
    result.valenceLabel = this._getValenceLabel(result.valence);
    
    // Calculate overall intensity
    const emotionValues = Object.values(result.emotions);
    result.intensity = emotionValues.length > 0 
      ? Math.max(...emotionValues) * intensityMultiplier 
      : 0;
    
    // Determine primary emotion
    if (emotionValues.length > 0) {
      const maxScore = Math.max(...emotionValues);
      result.primaryEmotion = Object.keys(result.emotions).find(
        key => result.emotions[key] === maxScore
      );
    }
    
    // Calculate confidence
    result.confidence = this._calculateConfidence(result, tokens.length);
    
    // Update context history
    if (this.config.trackContext) {
      this._updateContext(result);
    }
    
    // Emit detection event
    this.emit('detection', result);
    
    return result;
  }
  
  /**
   * Detect valence for a conversation message
   * @param {object} message - Message object with content and metadata
   * @returns {object} Enhanced valence result with context
   */
  detectMessage(message) {
    const content = message.content || message.text || '';
    const baseResult = this.detect(content);
    
    // Add message metadata
    baseResult.message = {
      id: message.id,
      sender: message.sender,
      recipient: message.recipient,
      timestamp: message.timestamp || Date.now()
    };
    
    // Consider sender's emotional baseline (if available from Empath)
    if (message.senderEmotionalState) {
      baseResult.contextualValence = this._applyEmotionalContext(
        baseResult, 
        message.senderEmotionalState
      );
    }
    
    return baseResult;
  }
  
  /**
   * Get emotional context trend
   * @param {number} window - Number of recent detections to consider
   * @returns {object} Emotional context trend
   */
  getEmotionalContext(window = 10) {
    const recent = this.contextHistory.slice(-window);
    if (recent.length === 0) {
      return {
        trend: 'stable',
        averageValence: 0,
        averageIntensity: 0,
        dominantEmotions: []
      };
    }
    
    const avgValence = recent.reduce((sum, r) => sum + r.valence, 0) / recent.length;
    const avgIntensity = recent.reduce((sum, r) => sum + r.intensity, 0) / recent.length;
    
    // Count emotion frequencies
    const emotionCounts = {};
    for (const result of recent) {
      for (const emotion of Object.keys(result.emotions)) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    }
    
    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion);
    
    // Determine trend
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstValence = firstHalf.length > 0 
      ? firstHalf.reduce((sum, r) => sum + r.valence, 0) / firstHalf.length 
      : 0;
    const secondValence = secondHalf.length > 0
      ? secondHalf.reduce((sum, r) => sum + r.valence, 0) / secondHalf.length
      : 0;
    
    const valenceChange = secondValence - firstValence;
    let trend = 'stable';
    if (valenceChange > 0.1) trend = 'improving';
    if (valenceChange < -0.1) trend = 'declining';
    if (valenceChange > 0.3) trend = 'improving-rapidly';
    if (valenceChange < -0.3) trend = 'declining-rapidly';
    
    return {
      trend,
      averageValence: avgValence,
      averageIntensity: avgIntensity,
      dominantEmotions,
      sampleSize: recent.length
    };
  }
  
  /**
   * Clear context history
   */
  clearContext() {
    this.contextHistory = [];
    this.emit('context-cleared');
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  /**
   * Tokenize text into words
   */
  _tokenize(text) {
    return text.toLowerCase().match(/\b[\w'-]+\b/g) || [];
  }
  
  /**
   * Detect emotions from lexicon matching
   */
  _detectEmotions(tokens, lowerText) {
    const scores = {};
    
    for (const [emotion, words] of Object.entries(this.lexicon)) {
      let score = 0;
      for (const word of words) {
        // Exact word match
        const exactMatches = tokens.filter(t => t === word).length;
        // Partial match (word contained in text)
        const containsMatch = lowerText.includes(word) ? 0.5 : 0;
        
        score += exactMatches + containsMatch;
      }
      if (score > 0) {
        scores[emotion] = score;
      }
    }
    
    // Normalize scores to 0-1 range
    const maxScore = Math.max(1, ...Object.values(scores));
    for (const emotion of Object.keys(scores)) {
      scores[emotion] = scores[emotion] / maxScore;
    }
    
    return scores;
  }
  
  /**
   * Detect intensity modifiers
   */
  _detectIntensity(tokens, lowerText) {
    let multiplier = 1.0;
    
    for (const amplifier of INTENSITY_MODIFIERS.amplifiers) {
      if (tokens.includes(amplifier) || lowerText.includes(amplifier)) {
        multiplier += 0.2;
      }
    }
    
    for (const dampener of INTENSITY_MODIFIERS.dampeners) {
      if (lowerText.includes(dampener)) {
        multiplier -= 0.2;
      }
    }
    
    return Math.max(0.1, Math.min(2.0, multiplier));
  }
  
  /**
   * Detect negation patterns
   */
  _detectNegation(tokens, lowerText) {
    let count = 0;
    for (const pattern of NEGATION_PATTERNS) {
      if (pattern.test(lowerText)) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Check if an emotion is negated
   */
  _isNegated(emotion, tokens, lowerText) {
    const emotionWords = this.lexicon[emotion] || [];
    for (const word of emotionWords) {
      const wordIndex = tokens.indexOf(word);
      if (wordIndex > 0) {
        const prevWord = tokens[wordIndex - 1];
        if (NEGATION_PATTERNS.some(p => p.test(prevWord))) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Detect threat indicators (amygdala function)
   */
  _detectThreat(tokens, lowerText) {
    const indicators = [];
    let score = 0;
    
    for (const indicator of THREAT_INDICATORS) {
      if (tokens.includes(indicator) || lowerText.includes(indicator)) {
        indicators.push(indicator);
        score += 0.15;
      }
    }
    
    return {
      detected: score >= this.config.threatThreshold,
      score: Math.min(1, score),
      indicators
    };
  }
  
  /**
   * Detect urgency indicators
   */
  _detectUrgency(tokens, lowerText) {
    const indicators = [];
    let score = 0;
    
    for (const indicator of URGENCY_INDICATORS) {
      if (tokens.includes(indicator) || lowerText.includes(indicator)) {
        indicators.push(indicator);
        score += 0.2;
      }
    }
    
    return {
      detected: score >= 0.3,
      score: Math.min(1, score),
      indicators
    };
  }
  
  /**
   * Detect importance indicators
   */
  _detectImportance(tokens, lowerText) {
    const indicators = [];
    let score = 0;
    
    for (const indicator of IMPORTANCE_INDICATORS) {
      if (tokens.includes(indicator) || lowerText.includes(indicator)) {
        indicators.push(indicator);
        score += 0.15;
      }
    }
    
    return {
      detected: score >= 0.3,
      score: Math.min(1, score),
      indicators
    };
  }
  
  /**
   * Calculate overall valence from emotions
   */
  _calculateValence(emotions) {
    const positiveEmotions = ['joy', 'trust', 'anticipation'];
    const negativeEmotions = ['anger', 'fear', 'sadness', 'disgust'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    for (const [emotion, score] of Object.entries(emotions)) {
      if (positiveEmotions.includes(emotion)) {
        positiveScore += score;
      } else if (negativeEmotions.includes(emotion)) {
        negativeScore += score;
      }
    }
    
    const total = positiveScore + negativeScore;
    if (total === 0) return 0;
    
    // Valence: -1 (negative) to 1 (positive)
    return (positiveScore - negativeScore) / total;
  }
  
  /**
   * Get valence label
   */
  _getValenceLabel(valence) {
    if (valence > 0.3) return 'positive';
    if (valence < -0.3) return 'negative';
    return 'neutral';
  }
  
  /**
   * Calculate confidence in detection
   */
  _calculateConfidence(result, tokenCount) {
    let confidence = 0.5; // Base confidence
    
    // More tokens = higher confidence
    confidence += Math.min(0.2, tokenCount / 100);
    
    // More emotions detected = higher confidence
    const emotionCount = Object.keys(result.emotions).length;
    confidence += Math.min(0.2, emotionCount * 0.05);
    
    // Strong threat/urgency/importance signals = higher confidence
    if (result.threat.detected || result.urgency.detected || result.importance.detected) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }
  
  /**
   * Update context history
   */
  _updateContext(result) {
    this.contextHistory.push(result);
    if (this.contextHistory.length > this.maxContextHistory) {
      this.contextHistory.shift();
    }
  }
  
  /**
   * Apply emotional context from Empath integration
   */
  _applyEmotionalContext(result, empathState) {
    const contextualValence = { ...result };
    
    // Adjust based on user's baseline emotional state
    if (empathState.currentMood) {
      const moodWeight = empathState.moodIntensity || 0.3;
      contextualValence.valence = (result.valence * (1 - moodWeight)) + 
                                   (empathState.moodValence * moodWeight);
      contextualValence.valenceLabel = this._getValenceLabel(contextualValence.valence);
    }
    
    return contextualValence;
  }
}

export default ValenceDetector;
