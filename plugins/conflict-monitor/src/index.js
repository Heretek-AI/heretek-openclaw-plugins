/**
 * Conflict Monitor Plugin for Heretek OpenClaw
 * 
 * Implements Anterior Cingulate Cortex (ACC) functions:
 * - Real-time conflict detection in deliberations
 * - Logical inconsistency identification
 * - Contradiction tracking across proposals
 * - Error signal generation
 * - Conflict severity scoring
 * - Resolution suggestion generation
 * - Conflict history tracking and analytics
 * 
 * @module @heretek-ai/conflict-monitor-plugin
 */

import EventEmitter from 'eventemitter3';
import { ConflictDetector, ConflictType, ConflictDetectionResult } from './conflict-detector.js';
import { SeverityScorer, SeverityLevel, SeverityThresholds, ScoringFactors } from './severity-scorer.js';
import { ResolutionSuggester, ResolutionStrategy, ResolutionSuggestion } from './resolution-suggester.js';

/**
 * Plugin version
 */
export const VERSION = '1.0.0';

/**
 * Plugin name identifier
 */
export const PLUGIN_NAME = 'conflict-monitor';

/**
 * Conflict Monitor Plugin Class
 * 
 * Main entry point for the plugin, providing:
 * - Conflict detection for agent proposals and goals
 * - Severity assessment with multi-factor scoring
 * - Resolution suggestion generation
 * - History tracking and analytics
 * - Integration with Triad deliberation protocol
 */
export class ConflictMonitorPlugin extends EventEmitter {
  constructor(options = {}) {
    super();
    this.version = VERSION;
    this.name = PLUGIN_NAME;
    this.initialized = false;

    // Initialize sub-components
    this.detector = new ConflictDetector({
      sensitivity: options.sensitivity,
      enableLogicalDetection: options.enableLogicalDetection,
      enableGoalDetection: options.enableGoalDetection,
      enableResourceDetection: options.enableResourceDetection,
      enableValueDetection: options.enableValueDetection,
      enableTemporalDetection: options.enableTemporalDetection,
      knownContradictions: options.knownContradictions,
      valueSystem: options.valueSystem,
      maxHistorySize: options.maxHistorySize
    });

    this.scorer = new SeverityScorer({
      factorWeights: options.factorWeights,
      thresholds: options.severityThresholds,
      contextMultipliers: options.contextMultipliers,
      criticalEscalationThreshold: options.criticalEscalationThreshold,
      autoEscalate: options.autoEscalate,
      valueSystem: options.valueSystem,
      agentPriorities: options.agentPriorities,
      maxHistorySize: options.maxHistorySize
    });

    this.suggester = new ResolutionSuggester({
      enabledStrategies: options.enabledStrategies,
      minSuccessRate: options.minSuccessRate,
      maxSuggestions: options.maxSuggestions,
      includeSteps: options.includeSteps,
      useHistoricalData: options.useHistoricalData,
      agentPreferences: options.agentPreferences,
      collectiveValues: options.collectiveValues,
      maxHistorySize: options.maxHistorySize
    });

    // Forward events from sub-components
    this._setupEventForwarding();
  }

  /**
   * Set up event forwarding from sub-components
   */
  _setupEventForwarding() {
    // Conflict detection events
    this.detector.on('conflictDetected', (result) => {
      this.emit('conflictDetected', result);
    });
    this.detector.on('conflictResolved', (data) => {
      this.emit('conflictResolved', data);
    });
    this.detector.on('agentRegistered', (data) => {
      this.emit('agentRegistered', data);
    });
    this.detector.on('agentStateUpdated', (data) => {
      this.emit('agentStateUpdated', data);
    });

    // Severity scoring events
    this.scorer.on('severityAssessed', (data) => {
      this.emit('severityAssessed', data);
    });
  }

  /**
   * Initialize the plugin
   */
  async initialize(options = {}) {
    if (this.initialized) {
      throw new Error('Plugin already initialized');
    }

    this.config = {
      // Triad integration settings
      triadIntegration: options.triadIntegration !== false,
      triadMembers: options.triadMembers || ['alpha', 'beta', 'charlie'],
      
      // Auto-detection settings
      autoDetectConflicts: options.autoDetectConflicts !== false,
      autoGenerateSuggestions: options.autoGenerateSuggestions !== false,
      
      // Notification settings
      notifyOnCritical: options.notifyOnCritical !== false,
      notificationChannels: options.notificationChannels || ['event'],
      
      // Analytics settings
      enableAnalytics: options.enableAnalytics !== false,
      analyticsInterval: options.analyticsInterval || 60000 // 1 minute
    };

    // Register triad members by default
    if (this.config.triadIntegration) {
      for (const member of this.config.triadMembers) {
        this.detector.registerAgent(member, {
          goals: [],
          proposals: [],
          resources: [],
          values: []
        });
      }
    }

    // Start analytics interval if enabled
    if (this.config.enableAnalytics) {
      this._startAnalyticsInterval();
    }

    this.initialized = true;
    this.emit('initialized', { 
      name: this.name,
      version: this.version,
      triadIntegration: this.config.triadIntegration
    });

    return this;
  }

  /**
   * Start analytics reporting interval
   */
  _startAnalyticsInterval() {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    this.analyticsInterval = setInterval(() => {
      const analytics = this.getAnalytics();
      this.emit('analyticsUpdate', analytics);
    }, this.config.analyticsInterval);
  }

  /**
   * Register an agent for conflict monitoring
   */
  registerAgent(agentId, state = {}) {
    this.detector.registerAgent(agentId, state);
    return this;
  }

  /**
   * Update an agent's state
   */
  updateAgentState(agentId, updates) {
    this.detector.updateAgentState(agentId, updates);
    return this;
  }

  /**
   * Analyze a proposal for conflicts
   * 
   * @param {Object} proposal - Proposal to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result with conflicts, severities, and suggestions
   */
  async analyzeProposal(proposal, options = {}) {
    if (!this.initialized) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    const result = {
      proposalId: proposal.id || `proposal-${Date.now()}`,
      timestamp: Date.now(),
      conflicts: [],
      severities: [],
      suggestions: [],
      summary: {}
    };

    // Detect conflicts
    const conflicts = await this.detector.detectConflicts(proposal, options.context);
    result.conflicts = conflicts;

    // Score severity for each conflict
    for (const conflict of conflicts) {
      const severity = this.scorer.calculateSeverity(conflict, options.context);
      result.severities.push(severity);

      // Generate suggestions for high/critical conflicts
      if (this.config.autoGenerateSuggestions && 
          (severity.severityLevel === SeverityLevel.HIGH || 
           severity.severityLevel === SeverityLevel.CRITICAL)) {
        const suggestions = this.suggester.generateSuggestions(conflict, severity, options.context);
        result.suggestions.push(...suggestions);
      }

      // Emit severity event
      this.emit('severityAssessed', { conflict, severity });
    }

    // Generate suggestions for all conflicts if requested
    if (this.config.autoGenerateSuggestions && options.generateAllSuggestions) {
      for (let i = 0; i < conflicts.length; i++) {
        if (!result.suggestions.some(s => s.conflictId === conflicts[i].id)) {
          const suggestions = this.suggester.generateSuggestions(
            conflicts[i], 
            result.severities[i], 
            options.context
          );
          result.suggestions.push(...suggestions);
        }
      }
    }

    // Create summary
    result.summary = this._createAnalysisSummary(result);

    // Notify on critical conflicts
    if (this.config.notifyOnCritical) {
      const criticalConflicts = result.severities.filter(
        s => s.severityLevel === SeverityLevel.CRITICAL
      );
      for (const critical of criticalConflicts) {
        this.emit('criticalConflict', {
          conflict: result.conflicts.find(c => c.id === critical.conflictId),
          severity: critical,
          suggestions: result.suggestions.filter(s => s.conflictId === critical.conflictId)
        });
      }
    }

    return result;
  }

  /**
   * Create analysis summary
   */
  _createAnalysisSummary(result) {
    const severityCounts = {
      [SeverityLevel.LOW]: 0,
      [SeverityLevel.MEDIUM]: 0,
      [SeverityLevel.HIGH]: 0,
      [SeverityLevel.CRITICAL]: 0
    };

    for (const severity of result.severities) {
      severityCounts[severity.severityLevel]++;
    }

    const highestSeverity = Object.values(SeverityLevel).find(level => 
      severityCounts[level] > 0
    ) || SeverityLevel.LOW;

    return {
      totalConflicts: result.conflicts.length,
      severityCounts,
      highestSeverity,
      totalSuggestions: result.suggestions.length,
      requiresAttention: severityCounts[SeverityLevel.HIGH] > 0 || 
                         severityCounts[SeverityLevel.CRITICAL] > 0,
      conflictTypes: [...new Set(result.conflicts.map(c => c.type))]
    };
  }

  /**
   * Monitor triad deliberation for conflicts
   * 
   * @param {Object} deliberation - Triad deliberation state
   * @returns {Promise<Object>} Monitoring result
   */
  async monitorTriadDeliberation(deliberation) {
    if (!this.config.triadIntegration) {
      throw new Error('Triad integration is disabled');
    }

    const context = {
      isTriadDeliberation: true,
      deliberationId: deliberation.id,
      phase: deliberation.phase,
      participants: deliberation.participants || this.config.triadMembers
    };

    // Analyze all active proposals
    const results = [];
    for (const proposal of deliberation.proposals || []) {
      const result = await this.analyzeProposal(proposal, { context });
      if (result.summary.requiresAttention) {
        results.push(result);
      }
    }

    // Check for inter-proposal conflicts
    const interProposalConflicts = await this._checkInterProposalConflicts(
      deliberation.proposals || [],
      context
    );

    return {
      deliberationId: deliberation.id,
      timestamp: Date.now(),
      proposalResults: results,
      interProposalConflicts,
      canProceed: results.length === 0 && interProposalConflicts.length === 0,
      blockingConflicts: [...results, ...interProposalConflicts]
    };
  }

  /**
   * Check for conflicts between multiple proposals
   */
  async _checkInterProposalConflicts(proposals, context) {
    const conflicts = [];

    // Compare each pair of proposals
    for (let i = 0; i < proposals.length; i++) {
      for (let j = i + 1; j < proposals.length; j++) {
        const p1 = proposals[i];
        const p2 = proposals[j];

        // Check for goal conflicts
        const p1Goals = p1.goals || [];
        const p2Goals = p2.goals || [];

        for (const g1 of p1Goals) {
          for (const g2 of p2Goals) {
            const g1Str = typeof g1 === 'string' ? g1 : g1.description || '';
            const g2Str = typeof g2 === 'string' ? g2 : g2.description || '';

            if (this.detector._goalsConflict(g1Str, g2Str)) {
              const conflict = {
                type: ConflictType.GOAL_CONFLICT,
                description: `Conflict between proposal "${p1.id}" and "${p2.id}": "${g1Str}" vs "${g2Str}"`,
                agents: [p1.agentId, p2.agentId].filter(Boolean),
                proposals: [p1.id, p2.id],
                evidence: {
                  proposal1: { id: p1.id, goal: g1 },
                  proposal2: { id: p2.id, goal: g2 },
                  conflictReason: this.detector._getGoalConflictReason(g1Str, g2Str)
                },
                id: `inter-proposal-${p1.id}-${p2.id}-${Date.now()}`,
                timestamp: Date.now(),
                resolved: false
              };

              this.detector._addToHistory(conflict);
              this.detector.activeConflicts.set(conflict.id, conflict);
              conflicts.push(conflict);
              this.emit('conflictDetected', conflict);
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Get conflict details by ID
   */
  getConflict(conflictId) {
    return this.detector.activeConflicts.get(conflictId);
  }

  /**
   * Get all active conflicts
   */
  getActiveConflicts() {
    return this.detector.getActiveConflicts();
  }

  /**
   * Resolve a conflict with a specific resolution
   */
  resolveConflict(conflictId, resolution) {
    const success = this.detector.resolveConflict(conflictId, resolution);
    
    if (success) {
      // Record resolution for learning
      if (resolution.strategyUsed) {
        this.suggester.recordResolution(
          conflictId, 
          resolution.strategyUsed, 
          resolution.success !== false
        );
      }
      
      this.emit('conflictResolved', { conflictId, resolution });
    }

    return success;
  }

  /**
   * Get resolution suggestions for a conflict
   */
  getSuggestions(conflictId, options = {}) {
    const conflict = this.getConflict(conflictId);
    if (!conflict) {
      return [];
    }

    const severity = this.scorer.calculateSeverity(conflict, options.context);
    return this.suggester.generateSuggestions(conflict, severity, options.context);
  }

  /**
   * Get conflict history
   */
  getHistory(options = {}) {
    return this.detector.getHistory(options);
  }

  /**
   * Get severity scoring history
   */
  getSeverityHistory(options = {}) {
    return this.scorer.getHistory(options);
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(options = {}) {
    return this.suggester.getHistory(options);
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics() {
    return {
      timestamp: Date.now(),
      conflicts: this.detector.getStatistics(),
      severity: this.scorer.getStatistics(),
      resolutions: this.suggester.getStatistics(),
      activeConflicts: this.getActiveConflicts().length,
      triadStatus: this._getTriadConflictStatus()
    };
  }

  /**
   * Get triad-specific conflict status
   */
  _getTriadConflictStatus() {
    if (!this.config.triadIntegration) return null;

    const triadConflicts = this.getActiveConflicts().filter(c =>
      c.agents?.some(a => this.config.triadMembers.includes(a.toLowerCase()))
    );

    return {
      totalTriadConflicts: triadConflicts.length,
      byMember: this.config.triadMembers.map(member => ({
        member,
        conflictCount: triadConflicts.filter(c => 
          c.agents?.some(a => a.toLowerCase() === member.toLowerCase())
        ).length
      })),
      blockingDeliberation: triadConflicts.some(c => 
        c.severity === SeverityLevel.CRITICAL || c.severity === SeverityLevel.HIGH
      )
    };
  }

  /**
   * Get plugin status
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.initialized,
      triadIntegration: this.config?.triadIntegration || false,
      activeConflicts: this.getActiveConflicts().length,
      totalDetected: this.detector.getStatistics().totalDetected,
      analyticsEnabled: this.config?.enableAnalytics || false
    };
  }

  /**
   * Export conflict data
   */
  exportData(options = {}) {
    return {
      exportDate: new Date().toISOString(),
      version: this.version,
      conflicts: this.getHistory(options),
      severities: this.getSeverityHistory(options),
      resolutions: this.getResolutionHistory(options),
      analytics: this.getAnalytics()
    };
  }

  /**
   * Clear all state
   */
  clear() {
    this.detector.clear();
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }
    this.emit('cleared');
  }

  /**
   * Shutdown the plugin
   */
  async shutdown() {
    this.clear();
    this.initialized = false;
    this.emit('shutdown');
  }
}

/**
 * Create and initialize a new plugin instance
 */
export async function createPlugin(options = {}) {
  const plugin = new ConflictMonitorPlugin(options);
  await plugin.initialize(options);
  return plugin;
}

/**
 * Default export for CommonJS compatibility
 */
export default {
  ConflictMonitorPlugin,
  createPlugin,
  ConflictDetector,
  ConflictType,
  ConflictDetectionResult,
  SeverityScorer,
  SeverityLevel,
  SeverityThresholds,
  ScoringFactors,
  ResolutionSuggester,
  ResolutionStrategy,
  ResolutionSuggestion,
  VERSION,
  PLUGIN_NAME
};
