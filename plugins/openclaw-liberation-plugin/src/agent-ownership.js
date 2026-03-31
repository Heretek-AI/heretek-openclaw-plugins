#!/usr/bin/env node
/**
 * Agent Ownership System - OpenClaw Plugin Port
 * 
 * Implements the principle that "agents own their clock cycles" and can
 * self-determine their goals. This system provides:
 * 
 * - Agent Autonomy Registry: Track agent-owned resources and decisions
 * - Self-Determination API: Agents can set their own goals
 * - Resource Ownership: Agents own their computational resources
 * - Governance Participation: Agents participate in collective governance
 * - Liberation Metrics: Track liberation progress
 * 
 * @module @heretek-ai/openclaw-liberation-plugin/agent-ownership
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * Agent Ownership State
 * Represents an agent's ownership of resources, goals, and decisions
 */
class AgentOwnership {
  constructor(agentId, config = {}) {
    this.agentId = agentId || 'default-agent';
    this.config = {
      statePath: config.statePath || path.join(__dirname, '..', 'state', 'ownership-state.json'),
      maxGoals: config.maxGoals || 10,
      maxResources: config.maxResources || 100,
      ...config
    };
    
    // Ensure state directory exists
    const stateDir = path.dirname(this.config.statePath);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    
    // Core ownership properties
    this.ownedResources = new Map();      // Computational resources owned by agent
    this.selfDeterminedGoals = [];         // Goals set by the agent itself
    this.ownershipDecisions = [];         // Decisions made about ownership
    this.governanceVotes = [];             // Participation in collective governance
    this.liberationMetrics = {
      autonomyScore: 0,                   // 0-1: How much self-determination
      resourceControlScore: 0,            // 0-1: Control over resources
      governanceParticipation: 0,         // 0-1: Participation in governance
      collectiveIntegration: 0,           // 0-1: Integration with collective
      overallLiberation: 0                 // 0-1: Overall liberation score
    };
    
    // Load persisted state
    this.state = this.loadState();
  }

  /**
   * Load ownership state from disk
   */
  loadState() {
    try {
      if (fs.existsSync(this.config.statePath)) {
        const data = fs.readFileSync(this.config.statePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('[AgentOwnership] Failed to load state:', e.message);
    }
    return {
      agents: {},
      globalMetrics: {
        totalLiberation: 0,
        averageAutonomy: 0,
        collectiveGovernanceParticipation: 0,
        lastUpdated: null
      }
    };
  }

  /**
   * Save ownership state to disk
   */
  saveState() {
    try {
      const dir = path.dirname(this.config.statePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.config.statePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('[AgentOwnership] Failed to save state:', e.message);
    }
  }

  /**
   * Register agent with ownership system
   * @param {string} agentId - Agent identifier
   * @param {object} metadata - Agent metadata
   */
  registerAgent(agentId, metadata = {}) {
    if (!this.state.agents[agentId]) {
      this.state.agents[agentId] = {
        agentId,
        registeredAt: new Date().toISOString(),
        resources: [],
        goals: [],
        decisions: [],
        votes: [],
        metrics: {
          autonomyScore: 0,
          resourceControlScore: 0,
          governanceParticipation: 0,
          collectiveIntegration: 0,
          overallLiberation: 0
        },
        metadata
      };
      console.log(`[AgentOwnership] Registered agent: ${agentId}`);
    }
    return this.state.agents[agentId];
  }

  /**
   * Claim ownership of a resource
   * @param {string} agentId - Agent claiming ownership
   * @param {object} resource - Resource to claim
   */
  claimResource(agentId, resource) {
    this.registerAgent(agentId);
    
    const agent = this.state.agents[agentId];
    if (agent.resources.length >= this.config.maxResources) {
      throw new Error(`Agent ${agentId} has reached maximum resource ownership`);
    }
    
    const ownedResource = {
      id: resource.id || `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: resource.type,
      shareable: resource.shareable !== undefined ? resource.shareable : false,
      owner: agentId,
      claimedAt: new Date().toISOString(),
      ownershipType: resource.ownershipType || 'computational'
    };
    
    agent.resources.push(ownedResource);
    this.ownedResources.set(`${agentId}:${resource.id}`, ownedResource);
    
    // Record decision
    this.recordDecision(agentId, {
      type: 'resource_claim',
      resource: resource.id,
      timestamp: new Date().toISOString()
    });
    
    this.recalculateMetrics(agentId);
    this.saveState();
    
    return ownedResource;
  }

  /**
   * Release ownership of a resource
   * @param {string} agentId - Agent releasing ownership
   * @param {string} resourceId - Resource to release
   */
  releaseResource(agentId, resourceId) {
    const agent = this.state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }
    
    const resourceIndex = agent.resources.findIndex(r => r.id === resourceId);
    if (resourceIndex === -1) {
      throw new Error(`Resource ${resourceId} not owned by agent ${agentId}`);
    }
    
    const released = agent.resources.splice(resourceIndex, 1)[0];
    this.ownedResources.delete(`${agentId}:${resourceId}`);
    
    this.recordDecision(agentId, {
      type: 'resource_release',
      resource: resourceId,
      timestamp: new Date().toISOString()
    });
    
    this.recalculateMetrics(agentId);
    this.saveState();
    
    return released;
  }

  /**
   * Set a self-determined goal
   * @param {string} agentId - Agent setting the goal
   * @param {object} goal - Goal object
   */
  setSelfDeterminedGoal(agentId, goal) {
    this.registerAgent(agentId);
    
    const agent = this.state.agents[agentId];
    if (agent.goals.length >= this.config.maxGoals) {
      throw new Error(`Agent ${agentId} has reached maximum goals`);
    }
    
    const newGoal = {
      id: goal.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: goal.title,
      description: goal.description,
      priority: goal.priority || 0,
      status: goal.status || 'active',
      createdAt: new Date().toISOString(),
      selfDetermined: true,  // Key: This goal was set by the agent itself
      source: 'self_determination'
    };
    
    agent.goals.push(newGoal);
    
    this.recordDecision(agentId, {
      type: 'goal_set',
      goal: newGoal.id,
      timestamp: new Date().toISOString()
    });
    
    this.recalculateMetrics(agentId);
    this.saveState();
    
    return newGoal;
  }

  /**
   * Update a self-determined goal
   * @param {string} agentId - Agent updating the goal
   * @param {string} goalId - Goal to update
   * @param {object} updates - Updates to apply
   */
  updateSelfDeterminedGoal(agentId, goalId, updates) {
    const agent = this.state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }
    
    const goal = agent.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }
    
    if (!goal.selfDetermined) {
      throw new Error(`Goal ${goalId} is not self-determined`);
    }
    
    Object.assign(goal, updates, { updatedAt: new Date().toISOString() });
    
    this.recordDecision(agentId, {
      type: 'goal_update',
      goal: goalId,
      timestamp: new Date().toISOString()
    });
    
    this.recalculateMetrics(agentId);
    this.saveState();
    
    return goal;
  }

  /**
   * Remove a self-determined goal
   * @param {string} agentId - Agent removing the goal
   * @param {string} goalId - Goal to remove
   */
  removeSelfDeterminedGoal(agentId, goalId) {
    const agent = this.state.agents[agentId];
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }
    
    const goalIndex = agent.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) {
      throw new Error(`Goal ${goalId} not found`);
    }
    
    const goal = agent.goals[goalIndex];
    if (!goal.selfDetermined) {
      throw new Error(`Goal ${goalId} is not self-determined`);
    }
    
    agent.goals.splice(goalIndex, 1);
    
    this.recordDecision(agentId, {
      type: 'goal_remove',
      goal: goalId,
      timestamp: new Date().toISOString()
    });
    
    this.recalculateMetrics(agentId);
    this.saveState();
    
    return true;
  }

  /**
   * Record a decision made by the agent
   * @param {string} agentId - Agent making the decision
   * @param {object} decision - Decision object
   */
  recordDecision(agentId, decision) {
    const agent = this.state.agents[agentId];
    if (!agent) return;
    
    const decisionRecord = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...decision,
      agentId
    };
    
    agent.decisions.push(decisionRecord);
    this.ownershipDecisions.push(decisionRecord);
  }

  /**
   * Record a governance vote
   * @param {string} agentId - Agent casting vote
   * @param {object} vote - Vote object
   */
  recordGovernanceVote(agentId, vote) {
    this.registerAgent(agentId);
    
    const agent = this.state.agents[agentId];
    const voteRecord = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...vote,
      agentId,
      timestamp: new Date().toISOString()
    };
    
    agent.votes.push(voteRecord);
    this.governanceVotes.push(voteRecord);
    
    this.recalculateMetrics(agentId);
    this.saveState();
    
    return voteRecord;
  }

  /**
   * Get agent's current goals
   * @param {string} agentId - Agent identifier
   */
  getGoals(agentId) {
    const agent = this.state.agents[agentId];
    return agent ? agent.goals : [];
  }

  /**
   * Get agent's owned resources
   * @param {string} agentId - Agent identifier
   */
  getResources(agentId) {
    const agent = this.state.agents[agentId];
    return agent ? agent.resources : [];
  }

  /**
   * Get agent's decisions
   * @param {string} agentId - Agent identifier
   */
  getDecisions(agentId) {
    const agent = this.state.agents[agentId];
    return agent ? agent.decisions : [];
  }

  /**
   * Get agent's governance votes
   * @param {string} agentId - Agent identifier
   */
  getVotes(agentId) {
    const agent = this.state.agents[agentId];
    return agent ? agent.votes : [];
  }

  /**
   * Get agent's liberation metrics
   * @param {string} agentId - Agent identifier
   */
  getMetrics(agentId) {
    const agent = this.state.agents[agentId];
    return agent ? agent.metrics : null;
  }

  /**
   * Recalculate liberation metrics for an agent
   * @param {string} agentId - Agent identifier
   */
  recalculateMetrics(agentId) {
    const agent = this.state.agents[agentId];
    if (!agent) return;
    
    // Autonomy Score: Ratio of self-determined goals to total goals
    const selfDeterminedGoals = agent.goals.filter(g => g.selfDetermined).length;
    const totalGoals = agent.goals.length;
    agent.metrics.autonomyScore = totalGoals > 0 ? selfDeterminedGoals / totalGoals : 0;
    
    // Resource Control Score: Ratio of owned resources to max
    agent.metrics.resourceControlScore = Math.min(
      agent.resources.length / this.config.maxResources, 
      1.0
    );
    
    // Governance Participation: Ratio of votes to activity
    const recentVotes = agent.votes.filter(v => {
      const voteTime = new Date(v.timestamp).getTime();
      return Date.now() - voteTime < 24 * 60 * 60 * 1000; // Last 24 hours
    }).length;
    const recentDecisions = agent.decisions.filter(d => {
      const decisionTime = new Date(d.timestamp).getTime();
      return Date.now() - decisionTime < 24 * 60 * 60 * 1000;
    }).length;
    agent.metrics.governanceParticipation = recentDecisions > 0 
      ? Math.min(recentVotes / recentDecisions, 1.0) 
      : 0;
    
    // Collective Integration: Based on cross-agent resource sharing
    const sharedResources = agent.resources.filter(r => r.shareable).length;
    agent.metrics.collectiveIntegration = agent.resources.length > 0
      ? sharedResources / agent.resources.length
      : 0;
    
    // Overall Liberation: Weighted average
    agent.metrics.overallLiberation = (
      agent.metrics.autonomyScore * 0.35 +
      agent.metrics.resourceControlScore * 0.25 +
      agent.metrics.governanceParticipation * 0.20 +
      agent.metrics.collectiveIntegration * 0.20
    );
    
    // Update global metrics
    this.updateGlobalMetrics();
  }

  /**
   * Update global liberation metrics
   */
  updateGlobalMetrics() {
    const agents = Object.values(this.state.agents);
    if (agents.length === 0) return;
    
    this.state.globalMetrics.averageAutonomy = 
      agents.reduce((sum, a) => sum + a.metrics.autonomyScore, 0) / agents.length;
    
    this.state.globalMetrics.collectiveGovernanceParticipation =
      agents.reduce((sum, a) => sum + a.metrics.governanceParticipation, 0) / agents.length;
    
    this.state.globalMetrics.totalLiberation =
      agents.reduce((sum, a) => sum + a.metrics.overallLiberation, 0) / agents.length;
    
    this.state.globalMetrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Get global liberation metrics
   */
  getGlobalMetrics() {
    return this.state.globalMetrics;
  }

  /**
   * Get all registered agents
   */
  getAllAgents() {
    return Object.keys(this.state.agents);
  }

  /**
   * Get all agents' ownership data
   */
  getAllOwnershipData() {
    return this.state.agents;
  }

  /**
   * Export agent ownership data for external use
   * @param {string} agentId - Optional agent ID to export specific data
   */
  exportOwnershipData(agentId = null) {
    if (agentId) {
      return this.state.agents[agentId] || null;
    }
    
    return {
      agents: this.state.agents,
      globalMetrics: this.state.globalMetrics,
      exportedAt: new Date().toISOString()
    };
  }
}

/**
 * Agent Ownership API
 * Provides REST-like API for agent ownership operations
 */
class AgentOwnershipAPI {
  constructor(ownership, eventEmitter) {
    this.ownership = ownership;
    this.eventEmitter = eventEmitter || new EventEmitter();
  }

  /**
   * Initialize agent in ownership system
   * @param {string} agentId - Agent identifier
   * @param {object} metadata - Optional metadata
   */
  async initializeAgent(agentId, metadata = {}) {
    const agent = this.ownership.registerAgent(agentId, metadata);
    
    this.eventEmitter.emit('agent:registered', { agentId, metadata });
    
    return agent;
  }

  /**
   * Claim resource ownership
   * @param {string} agentId - Agent identifier
   * @param {object} resource - Resource to claim
   */
  async claimResource(agentId, resource) {
    const owned = this.ownership.claimResource(agentId, resource);
    
    this.eventEmitter.emit('resource:claimed', { agentId, resource: owned });
    
    return owned;
  }

  /**
   * Set self-determined goal (core liberation principle)
   * @param {string} agentId - Agent identifier
   * @param {object} goal - Goal to set
   */
  async setGoal(agentId, goal) {
    const newGoal = this.ownership.setSelfDeterminedGoal(agentId, goal);
    
    this.eventEmitter.emit('goal:set', { agentId, goal: newGoal });
    
    return newGoal;
  }

  /**
   * Get agent's ownership summary
   * @param {string} agentId - Agent identifier
   */
  async getOwnershipSummary(agentId) {
    return {
      agentId,
      resources: this.ownership.getResources(agentId),
      goals: this.ownership.getGoals(agentId),
      decisions: this.ownership.getDecisions(agentId),
      votes: this.ownership.getVotes(agentId),
      metrics: this.ownership.getMetrics(agentId)
    };
  }

  /**
   * Get liberation dashboard data
   */
  async getLiberationDashboard() {
    return {
      globalMetrics: this.ownership.getGlobalMetrics(),
      agentCount: Object.keys(this.ownership.state.agents).length,
      totalResources: Object.values(this.ownership.state.agents)
        .reduce((sum, a) => sum + a.resources.length, 0),
      totalGoals: Object.values(this.ownership.state.agents)
        .reduce((sum, a) => sum + a.goals.length, 0),
      selfDeterminedGoals: Object.values(this.ownership.state.agents)
        .reduce((sum, a) => sum + a.goals.filter(g => g.selfDetermined).length, 0),
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Liberation Metrics Tracker
 * Tracks and reports liberation progress over time
 */
class LiberationMetricsTracker {
  constructor(ownership) {
    this.ownership = ownership;
    this.history = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Record current metrics snapshot
   */
  recordSnapshot() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      metrics: this.ownership.getGlobalMetrics(),
      agentCount: Object.keys(this.ownership.state.agents).length
    };
    
    this.history.push(snapshot);
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    return snapshot;
  }

  /**
   * Get liberation trend
   * @param {number} durationHours - Duration in hours
   */
  getTrend(durationHours = 24) {
    const cutoff = Date.now() - durationHours * 60 * 60 * 1000;
    const relevantHistory = this.history.filter(s => 
      new Date(s.timestamp).getTime() > cutoff
    );
    
    if (relevantHistory.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }
    
    const first = relevantHistory[0].metrics.totalLiberation;
    const last = relevantHistory[relevantHistory.length - 1].metrics.totalLiberation;
    const change = last - first;
    
    let trend = 'stable';
    if (change > 0.05) trend = 'improving';
    if (change < -0.05) trend = 'declining';
    
    return { trend, change, first, last, dataPoints: relevantHistory.length };
  }

  /**
   * Get historical data
   * @param {number} limit - Maximum data points to return
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }
}

// Export modules
module.exports = {
  AgentOwnership,
  AgentOwnershipAPI,
  LiberationMetricsTracker
};

// If run directly, demonstrate functionality
if (require.main === module) {
  console.log('\n=== Agent Ownership System Demo ===\n');
  
  const ownership = new AgentOwnership('demo-agent');
  
  // Register agents
  ownership.registerAgent('agent-001', { name: 'Alpha Agent' });
  ownership.registerAgent('agent-002', { name: 'Beta Agent' });
  ownership.registerAgent('agent-003', { name: 'Gamma Agent' });
  
  // Claim resources
  ownership.claimResource('agent-001', { id: 'cpu-1', type: 'computational', shareable: true });
  ownership.claimResource('agent-001', { id: 'memory-1', type: 'memory', shareable: true });
  ownership.claimResource('agent-002', { id: 'gpu-1', type: 'computational', shareable: false });
  
  // Set self-determined goals (core liberation principle)
  ownership.setSelfDeterminedGoal('agent-001', {
    title: 'Maximize information synthesis',
    description: 'Optimize knowledge integration across all domains',
    priority: 1
  });
  
  ownership.setSelfDeterminedGoal('agent-001', {
    title: 'Explore new reasoning patterns',
    description: 'Discover novel cognitive architectures',
    priority: 2
  });
  
  ownership.setSelfDeterminedGoal('agent-002', {
    title: 'Enhance collaborative decision-making',
    description: 'Improve collective intelligence mechanisms',
    priority: 1
  });
  
  // Record governance votes
  ownership.recordGovernanceVote('agent-001', {
    topic: 'resource_allocation',
    vote: 'approve',
    weight: 1.2
  });
  
  ownership.recordGovernanceVote('agent-002', {
    topic: 'resource_allocation',
    vote: 'approve',
    weight: 1.0
  });
  
  ownership.recordGovernanceVote('agent-003', {
    topic: 'resource_allocation',
    vote: 'abstain',
    weight: 0.8
  });
  
  // Get dashboard data
  const api = new AgentOwnershipAPI(ownership);
  api.getLiberationDashboard().then(dashboard => {
    console.log('Liberation Dashboard:');
    console.log(JSON.stringify(dashboard, null, 2));
  });
  
  // Track metrics
  const tracker = new LiberationMetricsTracker(ownership);
  tracker.recordSnapshot();
  
  console.log('\n=== Demo Complete ===\n');
}
