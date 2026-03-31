/**
 * Conflict Resolution Suggestions API for Heretek OpenClaw
 * 
 * Generates resolution suggestions for detected conflicts:
 * - Strategy-based recommendations
 * - Compromise generation
 * - Win-win solution finding
 * - Escalation protocols
 * 
 * @module resolution-suggester
 */

import { SeverityLevel } from './severity-scorer.js';
import { ConflictType } from './conflict-detector.js';

/**
 * Resolution strategy types
 */
export const ResolutionStrategy = {
  /** Find middle ground between conflicting positions */
  COMPROMISE: 'compromise',
  /** Find solution that satisfies all parties */
  COLLABORATION: 'collaboration',
  /** One party yields to another */
  ACCOMMODATION: 'accommodation',
  /** Compete for dominance */
  COMPETITION: 'competition',
  /** Delay or avoid the conflict */
  AVOIDANCE: 'avoidance',
  /** Split the difference */
  SPLIT_DIFFERENCE: 'split_difference',
  /** Third-party arbitration */
  ARBITRATION: 'arbitration',
  /** Consensus-based decision */
  CONSENSUS: 'consensus',
  /** Reframe the problem */
  REFRAMING: 'reframing',
  /** Resource expansion */
  RESOURCE_EXPANSION: 'resource_expansion'
};

/**
 * Resolution suggestion structure
 */
export class ResolutionSuggestion {
  constructor(options) {
    this.id = `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.conflictId = options.conflictId;
    this.strategy = options.strategy;
    this.description = options.description;
    this.steps = options.steps || [];
    this.expectedOutcome = options.expectedOutcome;
    this.requiresParties = options.requiresParties || [];
    this.requiresApproval = options.requiresApproval || false;
    this.approvalLevel = options.approvalLevel; // 'agent', 'steward', 'triad', 'governance'
    this.estimatedSuccessRate = options.estimatedSuccessRate || 0.5;
    this.sideEffects = options.sideEffects || [];
    this.prerequisites = options.prerequisites || [];
    this.timestamp = Date.now();
  }
}

/**
 * Resolution Suggester Class
 * 
 * Generates resolution suggestions based on conflict type and severity
 */
export class ResolutionSuggester {
  constructor(options = {}) {
    this.options = {
      // Enable specific strategy types
      enabledStrategies: options.enabledStrategies || Object.values(ResolutionStrategy),
      // Success rate thresholds
      minSuccessRate: options.minSuccessRate || 0.3,
      // Maximum suggestions to generate
      maxSuggestions: options.maxSuggestions || 5,
      // Include step-by-step guidance
      includeSteps: options.includeSteps !== false,
      // Consider historical success rates
      useHistoricalData: options.useHistoricalData !== false,
      // Agent-specific preferences
      agentPreferences: options.agentPreferences || {},
      // Collective values for value-aligned suggestions
      collectiveValues: options.collectiveValues || []
    };

    // Historical resolution data
    this.resolutionHistory = [];
    this.strategySuccessRates = new Map();
    this.maxHistorySize = options.maxHistorySize || 300;
  }

  /**
   * Generate resolution suggestions for a conflict
   * 
   * @param {Object} conflict - Conflict detection result
   * @param {Object} severity - Severity assessment result
   * @param {Object} context - Additional context
   * @returns {ResolutionSuggestion[]} Array of resolution suggestions
   */
  generateSuggestions(conflict, severity, context = {}) {
    const suggestions = [];

    // Get strategies based on conflict type
    const typeStrategies = this._getStrategiesForType(conflict.type);
    
    // Get strategies based on severity level
    const severityStrategies = this._getStrategiesForSeverity(severity.severityLevel);

    // Combine and deduplicate strategies
    const applicableStrategies = [...new Set([...typeStrategies, ...severityStrategies])];

    // Generate suggestions for each applicable strategy
    for (const strategy of applicableStrategies) {
      if (!this.options.enabledStrategies.includes(strategy)) continue;

      const suggestion = this._generateSuggestion(conflict, severity, strategy, context);
      if (suggestion && suggestion.estimatedSuccessRate >= this.options.minSuccessRate) {
        suggestions.push(suggestion);
      }
    }

    // Sort by estimated success rate
    suggestions.sort((a, b) => b.estimatedSuccessRate - a.estimatedSuccessRate);

    // Return top suggestions
    return suggestions.slice(0, this.options.maxSuggestions);
  }

  /**
   * Get strategies appropriate for conflict type
   */
  _getStrategiesForType(conflictType) {
    const strategyMap = {
      [ConflictType.LOGICAL_CONTRADICTION]: [
        ResolutionStrategy.REFRAMING,
        ResolutionStrategy.ARBITRATION,
        ResolutionStrategy.CONSENSUS
      ],
      [ConflictType.GOAL_CONFLICT]: [
        ResolutionStrategy.COLLABORATION,
        ResolutionStrategy.COMPROMISE,
        ResolutionStrategy.REFRAMING
      ],
      [ConflictType.RESOURCE_CONFLICT]: [
        ResolutionStrategy.RESOURCE_EXPANSION,
        ResolutionStrategy.SPLIT_DIFFERENCE,
        ResolutionStrategy.COMPROMISE
      ],
      [ConflictType.VALUE_CONFLICT]: [
        ResolutionStrategy.REFRAMING,
        ResolutionStrategy.ACCOMMODATION,
        ResolutionStrategy.ARBITRATION
      ],
      [ConflictType.TEMPORAL_CONFLICT]: [
        ResolutionStrategy.COMPROMISE,
        ResolutionStrategy.SPLIT_DIFFERENCE,
        ResolutionStrategy.AVOIDANCE
      ],
      [ConflictType.AUTHORITY_CONFLICT]: [
        ResolutionStrategy.ARBITRATION,
        ResolutionStrategy.CONSENSUS,
        ResolutionStrategy.ACCOMMODATION
      ],
      [ConflictType.METHODOLOGY_CONFLICT]: [
        ResolutionStrategy.COLLABORATION,
        ResolutionStrategy.COMPROMISE,
        ResolutionStrategy.REFRAMING
      ]
    };

    return strategyMap[conflictType] || [
      ResolutionStrategy.COMPROMISE,
      ResolutionStrategy.ARBITRATION
    ];
  }

  /**
   * Get strategies appropriate for severity level
   */
  _getStrategiesForSeverity(severityLevel) {
    const strategyMap = {
      [SeverityLevel.LOW]: [
        ResolutionStrategy.AVOIDANCE,
        ResolutionStrategy.COMPROMISE,
        ResolutionStrategy.SPLIT_DIFFERENCE
      ],
      [SeverityLevel.MEDIUM]: [
        ResolutionStrategy.COMPROMISE,
        ResolutionStrategy.COLLABORATION,
        ResolutionStrategy.REFRAMING
      ],
      [SeverityLevel.HIGH]: [
        ResolutionStrategy.ARBITRATION,
        ResolutionStrategy.CONSENSUS,
        ResolutionStrategy.COLLABORATION
      ],
      [SeverityLevel.CRITICAL]: [
        ResolutionStrategy.ARBITRATION,
        ResolutionStrategy.CONSENSUS
      ]
    };

    return strategyMap[severityLevel] || [ResolutionStrategy.COMPROMISE];
  }

  /**
   * Generate a single suggestion for a strategy
   */
  _generateSuggestion(conflict, severity, strategy, context) {
    const generators = {
      [ResolutionStrategy.COMPROMISE]: () => this._generateCompromise(conflict, severity, context),
      [ResolutionStrategy.COLLABORATION]: () => this._generateCollaboration(conflict, severity, context),
      [ResolutionStrategy.ACCOMMODATION]: () => this._generateAccommodation(conflict, severity, context),
      [ResolutionStrategy.COMPETITION]: () => this._generateCompetition(conflict, severity, context),
      [ResolutionStrategy.AVOIDANCE]: () => this._generateAvoidance(conflict, severity, context),
      [ResolutionStrategy.SPLIT_DIFFERENCE]: () => this._generateSplitDifference(conflict, severity, context),
      [ResolutionStrategy.ARBITRATION]: () => this._generateArbitration(conflict, severity, context),
      [ResolutionStrategy.CONSENSUS]: () => this._generateConsensus(conflict, severity, context),
      [ResolutionStrategy.REFRAMING]: () => this._generateReframing(conflict, severity, context),
      [ResolutionStrategy.RESOURCE_EXPANSION]: () => this._generateResourceExpansion(conflict, severity, context)
    };

    const generator = generators[strategy];
    if (generator) {
      return generator();
    }

    return null;
  }

  /**
   * Generate compromise suggestion
   */
  _generateCompromise(conflict, severity, context) {
    const parties = conflict.agents || [];
    
    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.COMPROMISE,
      description: `Find middle ground between conflicting positions. Each party makes concessions to reach an acceptable solution.`,
      steps: this.options.includeSteps ? [
        'Identify core needs of each party (vs. stated positions)',
        'List potential concession areas for each party',
        'Propose balanced compromise that addresses core needs',
        'Allow each party to review and suggest modifications',
        'Finalize compromise agreement'
      ] : [],
      expectedOutcome: 'Both parties accept a solution that partially satisfies their interests',
      requiresParties: parties,
      requiresApproval: false,
      estimatedSuccessRate: 0.65,
      sideEffects: ['May leave some needs unmet', 'Could set precedent for future compromises'],
      prerequisites: ['Willingness to negotiate from all parties']
    });
  }

  /**
   * Generate collaboration suggestion
   */
  _generateCollaboration(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.COLLABORATION,
      description: 'Work together to find a win-win solution that fully satisfies all parties\' interests.',
      steps: this.options.includeSteps ? [
        'Joint problem definition session',
        'Identify shared goals and interests',
        'Brainstorm creative solutions without evaluation',
        'Evaluate solutions against all parties\' criteria',
        'Develop implementation plan with shared ownership'
      ] : [],
      expectedOutcome: 'Innovative solution that satisfies all parties\' core interests',
      requiresParties: parties,
      requiresApproval: false,
      estimatedSuccessRate: 0.55,
      sideEffects: ['Time-intensive process', 'Requires high trust and openness'],
      prerequisites: ['Trust between parties', 'Time availability', 'Good faith participation']
    });
  }

  /**
   * Generate accommodation suggestion
   */
  _generateAccommodation(conflict, severity, context) {
    const parties = conflict.agents || [];
    const lowerPriorityParty = parties[parties.length - 1]; // Last party accommodates

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.ACCOMMODATION,
      description: `One party yields to another's position, prioritizing relationship over individual goals.`,
      steps: this.options.includeSteps ? [
        `Identify which party should accommodate (based on priority, stake, or flexibility)`,
        `Document the accommodating party's contribution to collective good`,
        `${lowerPriorityParty} formally yields to other parties' position`,
        `Schedule review to ensure accommodating party's concerns are addressed later`
      ] : [],
      expectedOutcome: 'Conflict resolved quickly, relationship preserved',
      requiresParties: [lowerPriorityParty],
      requiresApproval: false,
      estimatedSuccessRate: 0.70,
      sideEffects: ['Accommodating party may feel resentful', 'May encourage future demands'],
      prerequisites: ['Clear understanding of party priorities']
    });
  }

  /**
   * Generate competition suggestion
   */
  _generateCompetition(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.COMPETITION,
      description: 'Parties compete to have their position adopted. Winner takes all based on merit or authority.',
      steps: this.options.includeSteps ? [
        'Each party presents their case with supporting evidence',
        'Neutral evaluation of competing positions',
        'Decision based on merit, authority, or vote',
        'Losing party commits to supporting chosen solution'
      ] : [],
      expectedOutcome: 'Clear winner emerges, conflict resolved decisively',
      requiresParties: parties,
      requiresApproval: true,
      approvalLevel: 'steward',
      estimatedSuccessRate: 0.50,
      sideEffects: ['Losing party may feel alienated', 'Could damage relationships'],
      prerequisites: ['Clear evaluation criteria', 'Acceptance of competitive process']
    });
  }

  /**
   * Generate avoidance suggestion
   */
  _generateAvoidance(conflict, severity, context) {
    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.AVOIDANCE,
      description: 'Delay or sidestep the conflict when resolution cost exceeds benefit.',
      steps: this.options.includeSteps ? [
        'Assess urgency and importance of conflict',
        'Determine if conflict will resolve naturally over time',
        'Document decision to defer resolution',
        'Set review date for re-evaluation'
      ] : [],
      expectedOutcome: 'Conflict deferred until more appropriate time',
      requiresParties: [],
      requiresApproval: false,
      estimatedSuccessRate: 0.40,
      sideEffects: ['Conflict may escalate if ignored', 'Underlying issues remain unaddressed'],
      prerequisites: ['Low urgency', 'Low impact on operations']
    });
  }

  /**
   * Generate split the difference suggestion
   */
  _generateSplitDifference(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.SPLIT_DIFFERENCE,
      description: 'Divide resources or time equally between conflicting parties.',
      steps: this.options.includeSteps ? [
        'Quantify the resource or time in conflict',
        'Calculate equal or proportional split',
        'Define clear boundaries for each party\'s allocation',
        'Establish monitoring for compliance'
      ] : [],
      expectedOutcome: 'Fair division eliminates source of conflict',
      requiresParties: parties,
      requiresApproval: false,
      estimatedSuccessRate: 0.60,
      sideEffects: ['May not address underlying needs', 'Could encourage position inflation'],
      prerequisites: ['Divisible resource or time']
    });
  }

  /**
   * Generate arbitration suggestion
   */
  _generateArbitration(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.ARBITRATION,
      description: 'Third party (Steward or designated arbiter) makes binding decision after hearing both sides.',
      steps: this.options.includeSteps ? [
        'Select neutral arbiter (Steward or designated agent)',
        'Each party submits written position and evidence',
        'Arbitration hearing with both parties present',
        'Arbiter deliberates and issues binding decision',
        'All parties commit to implementing decision'
      ] : [],
      expectedOutcome: 'Binding decision resolves conflict definitively',
      requiresParties: parties,
      requiresApproval: true,
      approvalLevel: 'steward',
      estimatedSuccessRate: 0.75,
      sideEffects: ['Parties lose control over outcome', 'May not satisfy either party fully'],
      prerequisites: ['Accepted arbiter', 'Commitment to abide by decision']
    });
  }

  /**
   * Generate consensus suggestion
   */
  _generateConsensus(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.CONSENSUS,
      description: 'All parties work together until a solution everyone can accept is found.',
      steps: this.options.includeSteps ? [
        'Facilitated discussion of all positions',
        'Identify areas of agreement and disagreement',
        'Develop proposal that addresses all concerns',
        'Test for consensus (no blocking objections)',
        'Refine until all parties can consent'
      ] : [],
      expectedOutcome: 'Solution that all parties can support',
      requiresParties: parties,
      requiresApproval: true,
      approvalLevel: 'triad',
      estimatedSuccessRate: 0.50,
      sideEffects: ['Time-consuming process', 'May result in watered-down solution'],
      prerequisites: ['Commitment to consensus process', 'Skilled facilitation']
    });
  }

  /**
   * Generate reframing suggestion
   */
  _generateReframing(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.REFRAMING,
      description: 'Reframe the conflict to reveal new perspectives or shared higher-level goals.',
      steps: this.options.includeSteps ? [
        'Step back from positions to examine underlying interests',
        'Identify shared higher-level goals',
        'Reframe conflict as shared problem to solve together',
        'Explore how conflict might be opportunity for improvement',
        'Develop solution based on new framing'
      ] : [],
      expectedOutcome: 'New perspective makes previous conflict irrelevant or transforms it',
      requiresParties: parties,
      requiresApproval: false,
      estimatedSuccessRate: 0.45,
      sideEffects: ['May seem like avoiding the real issue', 'Requires cognitive flexibility'],
      prerequisites: ['Open-mindedness', 'Ability to think abstractly']
    });
  }

  /**
   * Generate resource expansion suggestion
   */
  _generateResourceExpansion(conflict, severity, context) {
    const parties = conflict.agents || [];

    return new ResolutionSuggestion({
      conflictId: conflict.id,
      strategy: ResolutionStrategy.RESOURCE_EXPANSION,
      description: 'Expand available resources so all parties can have what they need.',
      steps: this.options.includeSteps ? [
        'Identify the scarce resource causing conflict',
        'Explore options for increasing resource availability',
        'Evaluate cost-benefit of expansion vs. other solutions',
        'Implement resource expansion if feasible',
        'Allocate expanded resources to parties'
      ] : [],
      expectedOutcome: 'Resource scarcity eliminated, all parties satisfied',
      requiresParties: parties,
      requiresApproval: true,
      approvalLevel: 'steward',
      estimatedSuccessRate: 0.65,
      sideEffects: ['May require additional resources/cost', 'Not always feasible'],
      prerequisites: ['Resource can be expanded', 'Resources available for expansion']
    });
  }

  /**
   * Record resolution outcome for learning
   */
  recordResolution(conflictId, strategyUsed, success) {
    const record = {
      conflictId,
      strategy: strategyUsed,
      success,
      timestamp: Date.now()
    };

    this.resolutionHistory.push(record);
    if (this.resolutionHistory.length > this.maxHistorySize) {
      this.resolutionHistory.shift();
    }

    // Update success rates
    if (!this.strategySuccessRates.has(strategyUsed)) {
      this.strategySuccessRates.set(strategyUsed, { successes: 0, attempts: 0 });
    }
    const stats = this.strategySuccessRates.get(strategyUsed);
    stats.attempts++;
    if (success) stats.successes++;

    return record;
  }

  /**
   * Get historical success rate for a strategy
   */
  getStrategySuccessRate(strategy) {
    const stats = this.strategySuccessRates.get(strategy);
    if (!stats || stats.attempts === 0) return null;
    return stats.successes / stats.attempts;
  }

  /**
   * Get resolution history
   */
  getHistory(options = {}) {
    let history = [...this.resolutionHistory];

    if (options.strategy) {
      history = history.filter(h => h.strategy === options.strategy);
    }
    if (options.success !== undefined) {
      history = history.filter(h => h.success === options.success);
    }
    if (options.conflictId) {
      history = history.filter(h => h.conflictId === options.conflictId);
    }

    return history;
  }

  /**
   * Get statistics about resolution effectiveness
   */
  getStatistics() {
    const stats = {
      totalResolutions: this.resolutionHistory.length,
      overallSuccessRate: 0,
      byStrategy: {}
    };

    let totalSuccesses = 0;
    for (const record of this.resolutionHistory) {
      if (record.success) totalSuccesses++;

      if (!stats.byStrategy[record.strategy]) {
        stats.byStrategy[record.strategy] = { attempts: 0, successes: 0 };
      }
      stats.byStrategy[record.strategy].attempts++;
      if (record.success) stats.byStrategy[record.strategy].successes++;
    }

    if (this.resolutionHistory.length > 0) {
      stats.overallSuccessRate = totalSuccesses / this.resolutionHistory.length;
    }

    // Calculate per-strategy success rates
    for (const [strategy, data] of Object.entries(stats.byStrategy)) {
      data.successRate = data.attempts > 0 ? data.successes / data.attempts : 0;
    }

    return stats;
  }
}

export default ResolutionSuggester;
