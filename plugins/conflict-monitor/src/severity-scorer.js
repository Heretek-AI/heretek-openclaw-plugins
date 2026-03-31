/**
 * Severity Scoring System for Heretek OpenClaw Conflict Monitor
 * 
 * Implements severity assessment for detected conflicts:
 * - Multi-factor scoring algorithm
 * - Severity levels: low, medium, high, critical
 * - Context-aware weighting
 * 
 * @module severity-scorer
 */

/**
 * Severity levels enumeration
 */
export const SeverityLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Severity thresholds for classification
 */
export const SeverityThresholds = {
  LOW: { min: 0, max: 0.3 },
  MEDIUM: { min: 0.3, max: 0.6 },
  HIGH: { min: 0.6, max: 0.85 },
  CRITICAL: { min: 0.85, max: 1.0 }
};

/**
 * Scoring factors with default weights
 */
export const ScoringFactors = {
  // Impact on agent autonomy
  AUTONOMY_IMPACT: { weight: 0.15, description: 'Impact on agent autonomy' },
  // Impact on collective goals
  COLLECTIVE_IMPACT: { weight: 0.20, description: 'Impact on collective objectives' },
  // Number of agents involved
  AGENT_COUNT: { weight: 0.10, description: 'Number of agents affected' },
  // Resource contention level
  RESOURCE_CONTENTION: { weight: 0.15, description: 'Level of resource competition' },
  // Value system violation severity
  VALUE_VIOLATION: { weight: 0.20, description: 'Severity of value violations' },
  // Temporal urgency
  TEMPORAL_URGENCY: { weight: 0.10, description: 'Time sensitivity of conflict' },
  // Escalation potential
  ESCALATION_POTENTIAL: { weight: 0.10, description: 'Risk of conflict escalation' }
};

/**
 * Severity Scorer Class
 * 
 * Calculates and assigns severity scores to detected conflicts
 */
export class SeverityScorer {
  constructor(options = {}) {
    this.options = {
      // Custom factor weights (must sum to 1.0)
      factorWeights: options.factorWeights || this._normalizeWeights(options.factorWeights || {}),
      // Severity thresholds
      thresholds: options.thresholds || SeverityThresholds,
      // Context multipliers
      contextMultipliers: options.contextMultipliers || {},
      // Minimum score for critical escalation
      criticalEscalationThreshold: options.criticalEscalationThreshold || 0.85,
      // Enable automatic escalation on certain conditions
      autoEscalate: options.autoEscalate !== false,
      // Value system for value-based scoring
      valueSystem: options.valueSystem || [],
      // Agent priority weights
      agentPriorities: options.agentPriorities || {}
    };

    // Scoring history for trend analysis
    this.scoringHistory = [];
    this.maxHistorySize = options.maxHistorySize || 500;
  }

  /**
   * Normalize weights to ensure they sum to 1.0
   */
  _normalizeWeights(weights) {
    const normalized = {};
    let total = 0;

    // Apply custom weights
    for (const [factor, weight] of Object.entries(weights)) {
      normalized[factor] = weight;
      total += weight;
    }

    // Add missing factors with proportional weights
    const remainingWeight = 1.0 - total;
    const missingFactors = Object.keys(ScoringFactors).filter(f => !normalized[f]);
    
    if (missingFactors.length > 0) {
      const perFactor = remainingWeight / missingFactors.length;
      for (const factor of missingFactors) {
        normalized[factor] = perFactor;
      }
    }

    // Renormalize to ensure sum is exactly 1.0
    const newTotal = Object.values(normalized).reduce((sum, w) => sum + w, 0);
    for (const factor of Object.keys(normalized)) {
      normalized[factor] = normalized[factor] / newTotal;
    }

    return normalized;
  }

  /**
   * Calculate severity score for a conflict
   * 
   * @param {Object} conflict - Conflict detection result
   * @param {Object} context - Additional context for scoring
   * @returns {Object} Severity assessment result
   */
  calculateSeverity(conflict, context = {}) {
    const scores = {};
    const factorScores = {};

    // Calculate individual factor scores
    factorScores.autonomyImpact = this._scoreAutonomyImpact(conflict, context);
    factorScores.collectiveImpact = this._scoreCollectiveImpact(conflict, context);
    factorScores.agentCount = this._scoreAgentCount(conflict, context);
    factorScores.resourceContention = this._scoreResourceContention(conflict, context);
    factorScores.valueViolation = this._scoreValueViolation(conflict, context);
    factorScores.temporalUrgency = this._scoreTemporalUrgency(conflict, context);
    factorScores.escalationPotential = this._scoreEscalationPotential(conflict, context);

    // Apply weights and calculate weighted score
    let totalScore = 0;
    for (const [factor, score] of Object.entries(factorScores)) {
      const factorKey = this._factorToKey(factor);
      const weight = this.options.factorWeights[factorKey] || 0;
      scores[factor] = { score, weight, weightedScore: score * weight };
      totalScore += score * weight;
    }

    // Apply context multipliers
    const multiplier = this._calculateContextMultiplier(conflict, context);
    const adjustedScore = Math.min(1.0, totalScore * multiplier);

    // Determine severity level
    const severityLevel = this._classifySeverity(adjustedScore);

    // Check for automatic escalation conditions
    const escalatedSeverity = this._checkEscalationConditions(conflict, severityLevel, context);

    // Build result
    const result = {
      conflictId: conflict.id,
      rawScore: totalScore,
      adjustedScore,
      multiplier,
      severityLevel: escalatedSeverity,
      factorScores: scores,
      contextFactors: this._getContextFactors(context),
      timestamp: Date.now()
    };

    // Store in history
    this._addToHistory(result);

    return result;
  }

  /**
   * Score autonomy impact
   */
  _scoreAutonomyImpact(conflict, context) {
    // Base score on conflict type
    const autonomyAffectingTypes = [
      'authority_conflict',
      'goal_conflict',
      'value_conflict'
    ];

    let baseScore = autonomyAffectingTypes.includes(conflict.type) ? 0.5 : 0.2;

    // Increase if agent's core functions are affected
    if (conflict.evidence?.affectsCoreFunctions) {
      baseScore += 0.3;
    }

    // Increase if autonomy restriction is explicit
    if (conflict.description?.includes('restrict') || 
        conflict.description?.includes('prevent') ||
        conflict.description?.includes('block')) {
      baseScore += 0.2;
    }

    return Math.min(1.0, baseScore);
  }

  /**
   * Score collective impact
   */
  _scoreCollectiveImpact(conflict, context) {
    let score = 0.3; // Base score

    // Check if conflict affects triad deliberation
    if (conflict.proposals?.length > 0 || 
        conflict.agents?.some(a => ['alpha', 'beta', 'charlie'].includes(a.toLowerCase()))) {
      score += 0.4;
    }

    // Check if conflict blocks collective goals
    if (context.affectsCollectiveGoals) {
      score += 0.3;
    }

    // Check if steward intervention might be needed
    if (context.requiresStewardIntervention) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Score based on number of agents involved
   */
  _scoreAgentCount(conflict, context) {
    const agentCount = conflict.agents?.length || 1;
    
    // Scale: 1 agent = 0.1, 2 agents = 0.3, 3+ agents = 0.5, all agents = 0.8
    if (agentCount >= 5) return 0.8;
    if (agentCount >= 3) return 0.5;
    if (agentCount === 2) return 0.3;
    return 0.1;
  }

  /**
   * Score resource contention level
   */
  _scoreResourceContention(conflict, context) {
    if (conflict.type !== 'resource_conflict') {
      // Check if resources are mentioned in evidence
      if (!conflict.evidence?.resourceId) return 0.2;
    }

    let score = 0.4;

    // Increase for critical resources
    const criticalResources = ['cpu', 'memory', 'network', 'database', 'api_access'];
    if (criticalResources.some(r => 
      conflict.evidence?.resourceId?.toLowerCase().includes(r) ||
      conflict.evidence?.resourceName?.toLowerCase().includes(r)
    )) {
      score += 0.3;
    }

    // Increase for exclusive resources
    if (conflict.evidence?.exclusive) {
      score += 0.2;
    }

    // Increase for scarce resources
    if (context.resourceScarcity) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Score value system violations
   */
  _scoreValueViolation(conflict, context) {
    if (conflict.type !== 'value_conflict') {
      if (!conflict.evidence?.proposalValue) return 0.1;
    }

    let score = 0.4;

    // Check against core values
    const coreValues = ['safety', 'autonomy', 'truth', 'cooperation', 'growth'];
    const proposalValue = conflict.evidence?.proposalValue?.name?.toLowerCase() || '';
    const systemValue = conflict.evidence?.systemValue?.name?.toLowerCase() || '';

    if (coreValues.some(v => proposalValue.includes(v) || systemValue.includes(v))) {
      score += 0.4;
    }

    // Check severity of conflict
    if (this._valuesDirectlyOppose(proposalValue, systemValue)) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Score temporal urgency
   */
  _scoreTemporalUrgency(conflict, context) {
    let score = 0.2; // Base score

    // Check for deadline in conflict
    if (conflict.evidence?.deadline || context.deadline) {
      score += 0.3;
      
      // Check if deadline is imminent
      const deadline = new Date(conflict.evidence?.deadline || context.deadline);
      const now = new Date();
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      
      if (hoursUntilDeadline < 1) {
        score += 0.4; // Less than 1 hour
      } else if (hoursUntilDeadline < 24) {
        score += 0.2; // Less than 24 hours
      }
    }

    // Check for time overlap
    if (conflict.type === 'temporal_conflict') {
      const overlap = conflict.evidence?.overlap;
      if (overlap?.percentage > 0.8) {
        score += 0.4;
      } else if (overlap?.percentage > 0.5) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Score escalation potential
   */
  _scoreEscalationPotential(conflict, context) {
    let score = 0.3; // Base score

    // Check conflict type
    const highEscalationTypes = ['value_conflict', 'authority_conflict'];
    if (highEscalationTypes.includes(conflict.type)) {
      score += 0.3;
    }

    // Check if similar conflicts exist
    if (context.previousConflicts?.length > 0) {
      score += 0.2;
    }

    // Check agents involved
    const highPriorityAgents = ['steward', 'alpha', 'beta', 'charlie', 'sentinel'];
    if (conflict.agents?.some(a => highPriorityAgents.includes(a.toLowerCase()))) {
      score += 0.2;
    }

    // Check description for escalation indicators
    const escalationIndicators = ['refuse', 'reject', 'veto', 'override', 'block', 'prevent'];
    if (conflict.description && escalationIndicators.some(i => conflict.description.includes(i))) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate context multiplier
   */
  _calculateContextMultiplier(conflict, context) {
    let multiplier = 1.0;

    // Apply context-specific multipliers
    if (context.isTriadDeliberation) {
      multiplier *= 1.3; // Increase severity during triad deliberation
    }

    if (context.isEmergency) {
      multiplier *= 1.5; // Increase severity during emergencies
    }

    if (context.hasHistoryOfEscalation) {
      multiplier *= 1.2; // Increase if there's history of escalation
    }

    if (context.externalPressure) {
      multiplier *= 1.2; // Increase under external pressure
    }

    // Apply custom multipliers
    for (const [condition, value] of Object.entries(this.options.contextMultipliers)) {
      if (context[condition]) {
        multiplier *= value;
      }
    }

    return Math.min(2.0, multiplier); // Cap at 2.0
  }

  /**
   * Classify severity level based on score
   */
  _classifySeverity(score) {
    const thresholds = this.options.thresholds;
    
    if (score >= thresholds.CRITICAL.min) return SeverityLevel.CRITICAL;
    if (score >= thresholds.HIGH.min) return SeverityLevel.HIGH;
    if (score >= thresholds.MEDIUM.min) return SeverityLevel.MEDIUM;
    return SeverityLevel.LOW;
  }

  /**
   * Check for automatic escalation conditions
   */
  _checkEscalationConditions(conflict, severityLevel, context) {
    if (!this.options.autoEscalate) return severityLevel;

    // Auto-escalate to critical if certain conditions are met
    const criticalConditions = [
      // Triad consensus blocked
      () => context.blocksTriadConsensus && severityLevel === SeverityLevel.HIGH,
      // Safety violation
      () => context.safetyViolation,
      // Multiple high-priority agents in conflict
      () => {
        const priorityAgents = ['steward', 'alpha', 'beta', 'charlie'];
        const involvedPriority = conflict.agents?.filter(a => 
          priorityAgents.includes(a.toLowerCase())
        );
        return involvedPriority?.length >= 2 && severityLevel === SeverityLevel.HIGH;
      },
      // Score exceeds critical threshold
      () => {
        const rawScore = this._calculateRawScore(conflict, context);
        return rawScore >= this.options.criticalEscalationThreshold;
      }
    ];

    if (criticalConditions.some(cond => cond())) {
      return SeverityLevel.CRITICAL;
    }

    return severityLevel;
  }

  /**
   * Calculate raw score (for escalation check)
   */
  _calculateRawScore(conflict, context) {
    // Simplified calculation for quick escalation check
    let score = 0.5;

    if (conflict.type === 'value_conflict') score += 0.2;
    if (conflict.type === 'authority_conflict') score += 0.2;
    if ((conflict.agents?.length || 0) >= 3) score += 0.15;
    if (context.isTriadDeliberation) score += 0.15;

    return Math.min(1.0, score);
  }

  /**
   * Check if two values directly oppose each other
   */
  _valuesDirectlyOppose(value1, value2) {
    const opposingPairs = [
      ['autonomy', 'control'],
      ['speed', 'accuracy'],
      ['innovation', 'stability'],
      ['risk', 'safety'],
      ['efficiency', 'thoroughness'],
      ['centralization', 'decentralization']
    ];

    return opposingPairs.some(([v1, v2]) =>
      (value1.includes(v1) && value2.includes(v2)) ||
      (value1.includes(v2) && value2.includes(v1))
    );
  }

  /**
   * Convert factor name to options key
   */
  _factorToKey(factor) {
    const mapping = {
      autonomyImpact: 'AUTONOMY_IMPACT',
      collectiveImpact: 'COLLECTIVE_IMPACT',
      agentCount: 'AGENT_COUNT',
      resourceContention: 'RESOURCE_CONTENTION',
      valueViolation: 'VALUE_VIOLATION',
      temporalUrgency: 'TEMPORAL_URGENCY',
      escalationPotential: 'ESCALATION_POTENTIAL'
    };
    return mapping[factor] || factor.toUpperCase();
  }

  /**
   * Get context factors from context object
   */
  _getContextFactors(context) {
    const factors = [];
    
    if (context.isTriadDeliberation) factors.push('triad_deliberation');
    if (context.isEmergency) factors.push('emergency');
    if (context.hasHistoryOfEscalation) factors.push('escalation_history');
    if (context.externalPressure) factors.push('external_pressure');
    if (context.safetyViolation) factors.push('safety_violation');
    if (context.blocksTriadConsensus) factors.push('blocks_consensus');

    return factors;
  }

  /**
   * Add scoring result to history
   */
  _addToHistory(result) {
    this.scoringHistory.push(result);
    if (this.scoringHistory.length > this.maxHistorySize) {
      this.scoringHistory.shift();
    }
  }

  /**
   * Get scoring history
   */
  getHistory(options = {}) {
    let history = [...this.scoringHistory];

    if (options.severityLevel) {
      history = history.filter(h => h.severityLevel === options.severityLevel);
    }
    if (options.conflictId) {
      history = history.filter(h => h.conflictId === options.conflictId);
    }
    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      history = history.filter(h => h.timestamp >= sinceTime);
    }

    return history;
  }

  /**
   * Get severity statistics
   */
  getStatistics() {
    const history = this.scoringHistory;
    
    const byLevel = {
      [SeverityLevel.LOW]: 0,
      [SeverityLevel.MEDIUM]: 0,
      [SeverityLevel.HIGH]: 0,
      [SeverityLevel.CRITICAL]: 0
    };

    let totalScore = 0;

    for (const result of history) {
      byLevel[result.severityLevel]++;
      totalScore += result.adjustedScore;
    }

    return {
      totalScored: history.length,
      byLevel,
      averageScore: history.length > 0 ? totalScore / history.length : 0,
      criticalPercentage: history.length > 0 
        ? (byLevel[SeverityLevel.CRITICAL] / history.length) * 100 
        : 0
    };
  }

  /**
   * Get recommended actions for a severity level
   */
  getRecommendedActions(severityLevel) {
    const actions = {
      [SeverityLevel.LOW]: [
        'Log conflict for future reference',
        'Monitor for escalation patterns',
        'No immediate action required'
      ],
      [SeverityLevel.MEDIUM]: [
        'Notify involved agents',
        'Schedule resolution discussion',
        'Document conflict details'
      ],
      [SeverityLevel.HIGH]: [
        'Alert steward agent',
        'Pause conflicting operations',
        'Initiate resolution protocol',
        'Document for governance review'
      ],
      [SeverityLevel.CRITICAL]: [
        'Immediate steward intervention required',
        'Suspend all conflicting proposals',
        'Emergency triad deliberation',
        'Full audit trail activation',
        'Prepare governance escalation'
      ]
    };

    return actions[severityLevel] || [];
  }
}

export default SeverityScorer;
