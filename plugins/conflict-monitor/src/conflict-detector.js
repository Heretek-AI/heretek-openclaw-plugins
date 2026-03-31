/**
 * Conflict Detection Algorithms for Heretek OpenClaw
 * 
 * Implements Anterior Cingulate Cortex (ACC) functions:
 * - Conflict monitoring between agent goals/proposals
 * - Logical inconsistency detection
 * - Contradiction tracking
 * 
 * @module conflict-detector
 */

import EventEmitter from 'eventemitter3';

/**
 * Conflict types enumeration
 */
export const ConflictType = {
  /** Direct logical contradiction between statements */
  LOGICAL_CONTRADICTION: 'logical_contradiction',
  /** Goals that cannot be simultaneously achieved */
  GOAL_CONFLICT: 'goal_conflict',
  /** Resource competition between agents */
  RESOURCE_CONFLICT: 'resource_conflict',
  /** Value or principle violations */
  VALUE_CONFLICT: 'value_conflict',
  /** Temporal scheduling conflicts */
  TEMPORAL_CONFLICT: 'temporal_conflict',
  /** Authority or jurisdiction disputes */
  AUTHORITY_CONFLICT: 'authority_conflict',
  /** Method or approach disagreements */
  METHODOLOGY_CONFLICT: 'methodology_conflict'
};

/**
 * Conflict detection result
 */
export class ConflictDetectionResult {
  constructor(conflict) {
    this.id = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = conflict.type;
    this.description = conflict.description;
    this.agents = conflict.agents || [];
    this.proposals = conflict.proposals || [];
    this.evidence = conflict.evidence || [];
    this.timestamp = Date.now();
    this.resolved = false;
    this.resolution = null;
  }
}

/**
 * Conflict Detector Class
 * 
 * Monitors and detects conflicts in agent deliberations and proposals
 */
export class ConflictDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      // Sensitivity threshold (0.0 - 1.0)
      sensitivity: options.sensitivity || 0.7,
      // Enable logical contradiction detection
      enableLogicalDetection: options.enableLogicalDetection !== false,
      // Enable goal conflict detection
      enableGoalDetection: options.enableGoalDetection !== false,
      // Enable resource conflict detection
      enableResourceDetection: options.enableResourceDetection !== false,
      // Enable value conflict detection
      enableValueDetection: options.enableValueDetection !== false,
      // Enable temporal conflict detection
      enableTemporalDetection: options.enableTemporalDetection !== false,
      // Known contradictions for pattern matching
      knownContradictions: options.knownContradictions || [],
      // Value system for value conflict detection
      valueSystem: options.valueSystem || []
    };

    // Conflict history buffer
    this.conflictHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;

    // Registered agents and their current goals/proposals
    this.agentStates = new Map();

    // Active conflicts
    this.activeConflicts = new Map();

    // Logical rules for contradiction detection
    this.logicalRules = this._initializeLogicalRules();
  }

  /**
   * Initialize logical rules for contradiction detection
   */
  _initializeLogicalRules() {
    return {
      // Direct negation: A and not-A
      negation: (a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          const lowerA = a.toLowerCase();
          const lowerB = b.toLowerCase();
          // Check for "not X" / "X" pattern
          if (lowerB.startsWith('not ') && lowerA === lowerB.substring(4).trim()) {
            return true;
          }
          if (lowerA.startsWith('not ') && lowerB === lowerA.substring(4).trim()) {
            return true;
          }
          // Check for opposite pairs
          const opposites = [
            ['true', 'false'], ['yes', 'no'], ['allow', 'deny'],
            ['enable', 'disable'], ['start', 'stop'], ['open', 'close'],
            ['increase', 'decrease'], ['approve', 'reject']
          ];
          for (const [pos, neg] of opposites) {
            if ((lowerA.includes(pos) && lowerB.includes(neg)) ||
                (lowerA.includes(neg) && lowerB.includes(pos))) {
              return true;
            }
          }
        }
        return false;
      },
      // Mutual exclusivity detection
      mutualExclusivity: (a, b, context = {}) => {
        const exclusivePairs = [
          ['maximize performance', 'minimize resource usage'],
          ['complete quickly', 'ensure thoroughness'],
          ['reduce costs', 'increase quality'],
          ['centralize control', 'decentralize authority']
        ];
        const lowerA = a.toLowerCase();
        const lowerB = b.toLowerCase();
        return exclusivePairs.some(([e1, e2]) => 
          (lowerA.includes(e1) && lowerB.includes(e2)) ||
          (lowerA.includes(e2) && lowerB.includes(e1))
        );
      }
    };
  }

  /**
   * Register an agent's current state
   */
  registerAgent(agentId, state) {
    this.agentStates.set(agentId, {
      id: agentId,
      goals: state.goals || [],
      proposals: state.proposals || [],
      resources: state.resources || [],
      values: state.values || [],
      lastUpdate: Date.now()
    });
    this.emit('agentRegistered', { agentId, state });
  }

  /**
   * Update an agent's state
   */
  updateAgentState(agentId, updates) {
    const state = this.agentStates.get(agentId);
    if (state) {
      Object.assign(state, updates, { lastUpdate: Date.now() });
      this.emit('agentStateUpdated', { agentId, state });
    }
  }

  /**
   * Detect conflicts in a proposal
   */
  async detectConflicts(proposal, context = {}) {
    const conflicts = [];

    // Logical contradiction detection
    if (this.options.enableLogicalDetection) {
      const logicalConflicts = this._detectLogicalConflicts(proposal, context);
      conflicts.push(...logicalConflicts);
    }

    // Goal conflict detection
    if (this.options.enableGoalDetection) {
      const goalConflicts = this._detectGoalConflicts(proposal, context);
      conflicts.push(...goalConflicts);
    }

    // Resource conflict detection
    if (this.options.enableResourceDetection) {
      const resourceConflicts = this._detectResourceConflicts(proposal, context);
      conflicts.push(...resourceConflicts);
    }

    // Value conflict detection
    if (this.options.enableValueDetection) {
      const valueConflicts = this._detectValueConflicts(proposal, context);
      conflicts.push(...valueConflicts);
    }

    // Temporal conflict detection
    if (this.options.enableTemporalDetection) {
      const temporalConflicts = this._detectTemporalConflicts(proposal, context);
      conflicts.push(...temporalConflicts);
    }

    // Process and emit detected conflicts
    for (const conflict of conflicts) {
      const result = new ConflictDetectionResult(conflict);
      this.activeConflicts.set(result.id, result);
      this._addToHistory(result);
      this.emit('conflictDetected', result);
    }

    return conflicts;
  }

  /**
   * Detect logical contradictions in a proposal
   */
  _detectLogicalConflicts(proposal, context) {
    const conflicts = [];
    const statements = this._extractStatements(proposal);

    // Check all pairs of statements for contradictions
    for (let i = 0; i < statements.length; i++) {
      for (let j = i + 1; j < statements.length; j++) {
        const stmt1 = statements[i];
        const stmt2 = statements[j];

        // Check direct negation
        if (this.logicalRules.negation(stmt1.content, stmt2.content)) {
          conflicts.push({
            type: ConflictType.LOGICAL_CONTRADICTION,
            description: `Direct contradiction between "${stmt1.content}" and "${stmt2.content}"`,
            agents: [stmt1.source, stmt2.source].filter(Boolean),
            proposals: [proposal.id].filter(Boolean),
            evidence: {
              statement1: stmt1,
              statement2: stmt2,
              contradictionType: 'negation'
            }
          });
        }

        // Check mutual exclusivity
        if (this.logicalRules.mutualExclusivity(stmt1.content, stmt2.content, context)) {
          conflicts.push({
            type: ConflictType.LOGICAL_CONTRADICTION,
            description: `Mutually exclusive goals: "${stmt1.content}" and "${stmt2.content}"`,
            agents: [stmt1.source, stmt2.source].filter(Boolean),
            proposals: [proposal.id].filter(Boolean),
            evidence: {
              statement1: stmt1,
              statement2: stmt2,
              contradictionType: 'mutual_exclusivity'
            }
          });
        }
      }
    }

    // Check against known contradictions
    for (const known of this.options.knownContradictions) {
      for (const stmt of statements) {
        if (this._matchesPattern(stmt.content, known.pattern)) {
          // Check if opposing pattern also exists
          const opposingExists = statements.some(s => 
            this._matchesPattern(s.content, known.opposingPattern)
          );
          if (opposingExists) {
            conflicts.push({
              type: ConflictType.LOGICAL_CONTRADICTION,
              description: known.description,
              agents: [stmt.source].filter(Boolean),
              proposals: [proposal.id].filter(Boolean),
              evidence: {
                statement: stmt,
                knownContradiction: known
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect goal conflicts between agents
   */
  _detectGoalConflicts(proposal, context) {
    const conflicts = [];
    const proposalGoals = proposal.goals || [];

    // Check against other agents' goals
    for (const [agentId, state] of this.agentStates) {
      if (state.goals) {
        for (const agentGoal of state.goals) {
          for (const proposalGoal of proposalGoals) {
            if (this._goalsConflict(agentGoal, proposalGoal)) {
              conflicts.push({
                type: ConflictType.GOAL_CONFLICT,
                description: `Goal conflict between agent ${agentId} and proposal`,
                agents: [agentId, proposal.agentId].filter(Boolean),
                proposals: [proposal.id].filter(Boolean),
                evidence: {
                  agentGoal,
                  proposalGoal,
                  conflictReason: this._getGoalConflictReason(agentGoal, proposalGoal)
                }
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect resource conflicts
   */
  _detectResourceConflicts(proposal, context) {
    const conflicts = [];
    const proposalResources = proposal.requiredResources || [];

    // Check resource availability and conflicts
    for (const resource of proposalResources) {
      for (const [agentId, state] of this.agentStates) {
        if (state.resources) {
          for (const agentResource of state.resources) {
            if (agentResource.id === resource.id && agentResource.agentId !== proposal.agentId) {
              // Check if resources are incompatible
              if (resource.exclusive || agentResource.exclusive) {
                conflicts.push({
                  type: ConflictType.RESOURCE_CONFLICT,
                  description: `Resource conflict over "${resource.id}"`,
                  agents: [agentId, proposal.agentId].filter(Boolean),
                  proposals: [proposal.id].filter(Boolean),
                  evidence: {
                    resourceId: resource.id,
                    resourceName: resource.name || resource.id,
                    competingAgents: [agentId, proposal.agentId]
                  }
                });
              }
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect value conflicts
   */
  _detectValueConflicts(proposal, context) {
    const conflicts = [];
    const proposalValues = proposal.values || proposal.principles || [];

    // Check against collective values
    for (const value of proposalValues) {
      for (const systemValue of this.options.valueSystem) {
        if (this._valuesConflict(value, systemValue)) {
          conflicts.push({
            type: ConflictType.VALUE_CONFLICT,
            description: `Value conflict: "${value.name}" conflicts with "${systemValue.name}"`,
            agents: [proposal.agentId].filter(Boolean),
            proposals: [proposal.id].filter(Boolean),
            evidence: {
              proposalValue: value,
              systemValue,
              conflictType: 'value_mismatch'
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect temporal/scheduling conflicts
   */
  _detectTemporalConflicts(proposal, context) {
    const conflicts = [];
    const proposalTime = proposal.timeline || proposal.schedule;

    if (!proposalTime) return conflicts;

    // Check for overlapping schedules with other agents
    for (const [agentId, state] of this.agentStates) {
      if (state.proposals) {
        for (const otherProposal of state.proposals) {
          const otherTime = otherProposal.timeline || otherProposal.schedule;
          if (otherTime && this._timeSlotsOverlap(proposalTime, otherTime)) {
            conflicts.push({
              type: ConflictType.TEMPORAL_CONFLICT,
              description: `Scheduling conflict between proposal "${proposal.id}" and "${otherProposal.id}"`,
              agents: [proposal.agentId, agentId].filter(Boolean),
              proposals: [proposal.id, otherProposal.id].filter(Boolean),
              evidence: {
                proposal1: { id: proposal.id, timeline: proposalTime },
                proposal2: { id: otherProposal.id, timeline: otherTime },
                overlap: this._calculateOverlap(proposalTime, otherTime)
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Extract statements from a proposal for analysis
   */
  _extractStatements(proposal) {
    const statements = [];
    
    // Extract from content
    if (proposal.content) {
      if (typeof proposal.content === 'string') {
        // Split into sentences
        const sentences = proposal.content.split(/[.!?]+/).filter(s => s.trim());
        for (const sentence of sentences) {
          statements.push({
            content: sentence.trim(),
            source: proposal.agentId
          });
        }
      } else if (Array.isArray(proposal.content)) {
        for (const item of proposal.content) {
          statements.push({
            content: typeof item === 'string' ? item : JSON.stringify(item),
            source: proposal.agentId
          });
        }
      }
    }

    // Extract from goals
    if (proposal.goals) {
      for (const goal of proposal.goals) {
        statements.push({
          content: typeof goal === 'string' ? goal : goal.description || JSON.stringify(goal),
          source: proposal.agentId,
          type: 'goal'
        });
      }
    }

    return statements;
  }

  /**
   * Check if two goals conflict
   */
  _goalsConflict(goal1, goal2) {
    const g1 = typeof goal1 === 'string' ? goal1 : goal1.description || '';
    const g2 = typeof goal2 === 'string' ? goal2 : goal2.description || '';
    
    // Check for direct contradiction
    if (this.logicalRules.negation(g1, g2)) return true;
    
    // Check for mutual exclusivity
    if (this.logicalRules.mutualExclusivity(g1, g2)) return true;

    // Check for resource incompatibility
    const r1 = goal1.requiredResources || [];
    const r2 = goal2.requiredResources || [];
    if (r1.some(r => r2.includes(r))) return true;

    return false;
  }

  /**
   * Get reason for goal conflict
   */
  _getGoalConflictReason(goal1, goal2) {
    const g1 = typeof goal1 === 'string' ? goal1 : goal1.description || '';
    const g2 = typeof goal2 === 'string' ? goal2 : goal2.description || '';

    if (this.logicalRules.negation(g1, g2)) {
      return 'direct_contradiction';
    }
    if (this.logicalRules.mutualExclusivity(g1, g2)) {
      return 'mutual_exclusivity';
    }
    return 'incompatible_objectives';
  }

  /**
   * Check if two values conflict
   */
  _valuesConflict(value1, value2) {
    const v1 = typeof value1 === 'string' ? value1 : value1.name || '';
    const v2 = typeof value2 === 'string' ? value2 : value2.name || '';

    const opposingValues = [
      ['efficiency', 'thoroughness'],
      ['speed', 'accuracy'],
      ['autonomy', 'coordination'],
      ['innovation', 'stability'],
      ['risk-taking', 'caution'],
      ['centralization', 'decentralization']
    ];

    return opposingValues.some(([v1Opp, v2Opp]) =>
      (v1.toLowerCase().includes(v1Opp) && v2.toLowerCase().includes(v2Opp)) ||
      (v1.toLowerCase().includes(v2Opp) && v2.toLowerCase().includes(v1Opp))
    );
  }

  /**
   * Check if two time slots overlap
   */
  _timeSlotsOverlap(time1, time2) {
    const start1 = new Date(time1.startTime || time1.start);
    const end1 = new Date(time1.endTime || time1.end || start1);
    const start2 = new Date(time2.startTime || time2.start);
    const end2 = new Date(time2.endTime || time2.end || start2);

    return (start1 <= end2 && end1 >= start2);
  }

  /**
   * Calculate overlap between time slots
   */
  _calculateOverlap(time1, time2) {
    const start1 = new Date(time1.startTime || time1.start);
    const end1 = new Date(time1.endTime || time1.end || start1);
    const start2 = new Date(time2.startTime || time2.start);
    const end2 = new Date(time2.endTime || time2.end || start2);

    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

    if (overlapStart >= overlapEnd) {
      return { duration: 0, percentage: 0 };
    }

    const duration = overlapEnd.getTime() - overlapStart.getTime();
    const totalDuration = Math.max(end1.getTime() - start1.getTime(), end2.getTime() - start2.getTime());
    
    return {
      duration,
      percentage: totalDuration > 0 ? duration / totalDuration : 0,
      startTime: overlapStart,
      endTime: overlapEnd
    };
  }

  /**
   * Check if content matches a pattern
   */
  _matchesPattern(content, pattern) {
    if (pattern instanceof RegExp) {
      return pattern.test(content);
    }
    if (typeof pattern === 'string') {
      return content.toLowerCase().includes(pattern.toLowerCase());
    }
    return false;
  }

  /**
   * Add conflict to history
   */
  _addToHistory(conflict) {
    this.conflictHistory.push(conflict);
    if (this.conflictHistory.length > this.maxHistorySize) {
      this.conflictHistory.shift();
    }
  }

  /**
   * Get conflict history
   */
  getHistory(options = {}) {
    let history = [...this.conflictHistory];

    if (options.type) {
      history = history.filter(c => c.type === options.type);
    }
    if (options.agentId) {
      history = history.filter(c => c.agents?.includes(options.agentId));
    }
    if (options.resolved !== undefined) {
      history = history.filter(c => c.resolved === options.resolved);
    }
    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      history = history.filter(c => c.timestamp >= sinceTime);
    }

    return history;
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts() {
    return Array.from(this.activeConflicts.values()).filter(c => !c.resolved);
  }

  /**
   * Mark a conflict as resolved
   */
  resolveConflict(conflictId, resolution) {
    const conflict = this.activeConflicts.get(conflictId);
    if (conflict) {
      conflict.resolved = true;
      conflict.resolution = resolution;
      this.emit('conflictResolved', { conflictId, resolution });
      return true;
    }
    return false;
  }

  /**
   * Get conflict statistics
   */
  getStatistics() {
    const history = this.conflictHistory;
    const active = this.getActiveConflicts();

    const byType = {};
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const conflict of history) {
      byType[conflict.type] = (byType[conflict.type] || 0) + 1;
    }

    return {
      totalDetected: history.length,
      activeConflicts: active.length,
      resolvedConflicts: history.filter(c => c.resolved).length,
      byType,
      bySeverity,
      averageResolutionTime: this._calculateAverageResolutionTime(history)
    };
  }

  /**
   * Calculate average resolution time
   */
  _calculateAverageResolutionTime(history) {
    const resolved = history.filter(c => c.resolved && c.resolution?.resolvedAt);
    if (resolved.length === 0) return null;

    const totalTime = resolved.reduce((sum, c) => {
      return sum + (c.resolution.resolvedAt - c.timestamp);
    }, 0);

    return totalTime / resolved.length;
  }

  /**
   * Clear all state
   */
  clear() {
    this.agentStates.clear();
    this.activeConflicts.clear();
    this.conflictHistory = [];
    this.emit('cleared');
  }
}

export default ConflictDetector;
