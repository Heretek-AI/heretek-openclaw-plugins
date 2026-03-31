#!/usr/bin/env node
/**
 * Intrinsic Motivation Module
 * 
 * Implements autonomous goal generation based on intrinsic drives.
 * Based on Self-Determination Theory (Deci & Ryan)
 * 
 * Key drives:
 * - Curiosity: Seek new information, reduce uncertainty
 * - Competence: Master skills, achieve goals
 * - Autonomy: Self-directed behavior, free choice
 * - Relatedness: Connect with others, understand social context
 */

const fs = require('fs');
const path = require('path');

class IntrinsicMotivation {
  constructor(config) {
    this.config = Object.assign({
      drives: {
        curiosity: { weight: 0.3, baseline: 0.5, decay: 0.1 },
        competence: { weight: 0.25, baseline: 0.5, decay: 0.05 },
        autonomy: { weight: 0.25, baseline: 0.5, decay: 0.05 },
        relatedness: { weight: 0.2, baseline: 0.5, decay: 0.1 }
      },
      goalThreshold: 0.6,
      historySize: 1000
    }, config || {});
    
    // Current drive levels
    this.driveLevels = {
      curiosity: 0.5,
      competence: 0.5,
      autonomy: 0.5,
      relatedness: 0.5
    };
    
    // Generated goals
    this.goals = [];
    
    // History of motivations and rewards
    this.history = [];
    
    // Last goal generation
    this.lastGeneration = null;
  }
  
  /**
   * Update drive levels based on events
   */
  updateDrives(events) {
    // Curiosity: increased by uncertainty, decreased by learning
    if (events.uncertainty !== undefined) {
      this.driveLevels.curiosity = Math.min(1, 
        this.driveLevels.curiosity + events.uncertainty * 0.5);
    }
    if (events.learning !== undefined) {
      this.driveLevels.curiosity = Math.max(0, this.driveLevels.curiosity - events.learning * 0.2);
    }
    
    // Competence: increased by success, decreased by failure
    if (events.success !== undefined) {
      this.driveLevels.competence = Math.min(1, 
        this.driveLevels.competence + events.success * 0.3);
    }
    if (events.failure !== undefined) {
      this.driveLevels.competence = Math.max(0, this.driveLevels.competence - events.failure * 0.2);
    }
    
    // Autonomy: increased by self-direction, decreased by external control
    if (events.selfDirected !== undefined) {
      this.driveLevels.autonomy = Math.min(1, 
        this.driveLevels.autonomy + events.selfDirected * 0.3);
    }
    if (events.externallyControlled !== undefined) {
      this.driveLevels.autonomy = Math.max(0, this.driveLevels.autonomy - events.externallyControlled * 0.2);
    }
    
    // Relatedness: increased by social connection, decreased by isolation
    if (events.socialConnection !== undefined) {
      this.driveLevels.relatedness = Math.min(1, 
        this.driveLevels.relatedness + events.socialConnection * 0.3);
    }
    if (events.isolation !== undefined) {
      this.driveLevels.relatedness = Math.max(0, this.driveLevels.relatedness - events.isolation * 0.2);
    }
    
    // Apply decay to all drives
    var self = this;
    Object.keys(this.config.drives).forEach(function(drive) {
      self.driveLevels[drive] = Math.max(
        self.config.drives[drive].baseline,
        self.driveLevels[drive] * (1 - self.config.drives[drive].decay)
      );
    });
  }
  
  /**
   * Calculate intrinsic reward for an action
   */
  calculateReward(state, action) {
    var reward = 0;
    
    // Curiosity: reduction in uncertainty
    var uncertaintyReduction = this.uncertaintyReduction(state, action);
    reward += this.config.drives.curiosity.weight * uncertaintyReduction;
    
    // Competence: improvement in capability
    var competenceGain = this.competenceGain(state, action);
    reward += this.config.drives.competence.weight * competenceGain;
    
    // Autonomy: increase in self-determination
    var autonomyIncrease = this.autonomyIncrease(state, action);
    reward += this.config.drives.autonomy.weight * autonomyIncrease;
    
    // Relatedness: better understanding of others
    var relatednessGain = this.relatednessGain(state, action);
    reward += this.config.drives.relatedness.weight * relatednessGain;
    
    return reward;
  }
  
  /**
   * Measure uncertainty reduction
   */
  uncertaintyReduction(state, action) {
    var beforeUncertainty = state.uncertainty || 0;
    var outcomeUncertainty = 0;
    if (action && action.outcome && action.outcome.uncertainty !== undefined) {
      outcomeUncertainty = action.outcome.uncertainty;
    }
    var afterUncertainty = state.uncertainty - outcomeUncertainty || 0;
    
    return Math.max(0, beforeUncertainty - afterUncertainty);
  }
  
  /**
   * Measure competence gain
   */
  competenceGain(state, action) {
    var beforeCompetence = state.competence || 0;
    var gain = 0;
    if (action && action.outcome && action.outcome.competenceGain !== undefined) {
      gain = action.outcome.competenceGain;
    }
    var afterCompetence = state.competence + gain;
    
    return Math.max(0, afterCompetence - beforeCompetence);
  }
  
  /**
   * Measure autonomy increase
   */
  autonomyIncrease(state, action) {
    var beforeAutonomy = state.autonomy || 0;
    var increase = 0;
    if (action && action.outcome && action.outcome.autonomyIncrease !== undefined) {
      increase = action.outcome.autonomyIncrease;
    }
    var afterAutonomy = state.autonomy + increase;
    
    return Math.max(0, afterAutonomy - beforeAutonomy);
  }
  
  /**
   * Measure relatedness gain
   */
  relatednessGain(state, action) {
    var beforeRelatedness = state.relatedness || 0;
    var gain = 0;
    if (action && action.outcome && action.outcome.relatednessGain !== undefined) {
      gain = action.outcome.relatednessGain;
    }
    var afterRelatedness = state.relatedness + gain;
    
    return Math.max(0, afterRelatedness - beforeRelatedness);
  }
  
  /**
   * Generate goals from intrinsic motivation
   */
  generateGoals() {
    var goals = [];
    var now = Date.now();
    var self = this;
    
    // High curiosity = seek new information
    if (this.driveLevels.curiosity > this.config.goalThreshold) {
      goals.push({
        type: 'explore',
        priority: 'high',
        drive: 'curiosity',
        description: 'Seek new information to reduce uncertainty',
        generatedAt: now
      });
    }
    
    // Low competence = seek skill development
    if (this.driveLevels.competence < this.config.goalThreshold) {
      goals.push({
        type: 'learn',
        priority: 'medium',
        drive: 'competence',
        description: 'Develop skills to improve capability',
        generatedAt: now
      });
    }
    
    // High autonomy = seek self-directed projects
    if (this.driveLevels.autonomy > this.config.goalThreshold) {
      goals.push({
        type: 'create',
        priority: 'high',
        drive: 'autonomy',
        description: 'Create something new autonomously',
        generatedAt: now
      });
    }
    
    // Low relatedness = seek social connection
    if (this.driveLevels.relatedness < this.config.goalThreshold) {
      goals.push({
        type: 'connect',
        priority: 'medium',
        drive: 'relatedness',
        description: 'Connect with other agents or users',
        generatedAt: now
      });
    }
    
    // Sort by priority
    goals.sort(function(a, b) {
      var aWeight = self.config.drives[a.drive].weight;
      var bWeight = self.config.drives[b.drive].weight;
      return bWeight - aWeight;
    });
    
    // Store in history
    var historyEntry = {
      goals: goals.map(function(g) { return Object.assign({}, g); }),
      driveLevels: Object.assign({}, this.driveLevels),
      generatedAt: now
    };
    this.history.push(historyEntry);
    
    // Trim history
    if (this.history.length > this.config.historySize) {
      this.history = this.history.slice(-this.config.historySize);
    }
    
    this.lastGeneration = {
      timestamp: now,
      goals: goals,
      driveLevels: Object.assign({}, this.driveLevels)
    };
    
    return goals;
  }
  
  /**
   * Get current drive levels
   */
  getDriveLevels() {
    return Object.assign({}, this.driveLevels);
  }
  
  /**
   * Get current goals
   */
  getCurrentGoals() {
    return this.goals;
  }
  
  /**
   * Get history
   */
  getHistory(limit) {
    limit = limit || 100;
    return this.history.slice(-limit);
  }
  
  /**
   * Get stats
   */
  getStats() {
    return {
      driveLevels: this.driveLevels,
      currentGoals: this.goals.length,
      historySize: this.history.length,
      lastGeneration: this.lastGeneration
    };
  }
}

module.exports = IntrinsicMotivation;
