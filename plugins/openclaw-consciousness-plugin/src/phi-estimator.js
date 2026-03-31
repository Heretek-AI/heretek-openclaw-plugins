#!/usr/bin/env node
/**
 * Phi Estimator Module
 * 
 * Implements a simplified version of Integrated Information Theory (IIT)
 * by Giulio Tononi. Estimates the "phi" (Φ) value of the agent collective,
 * measuring how integrated and irreducible the system is.
 * 
 * Note: Full IIT 4.0 is computationally intractable. This is a practical
 * approximation focusing on:
 * - Information integration across agents
 * - Causal density of message flows
 * - State space coverage
 */

const fs = require('fs');
const path = require('path');

class PhiEstimator {
  constructor(config = {}) {
    this.config = {
      historySize: config.historySize || 1000,
      sampleIntervalMs: config.sampleIntervalMs || 10000,
      components: {
        integration: config.components?.integration !== false,
        causality: config.components?.causality !== false,
        coverage: config.components?.coverage !== false
      },
      ...config
    };
    
    // State history for analysis
    this.stateHistory = [];
    
    // Message flow history
    this.messageFlows = [];
    
    // Agent states
    this.agentStates = new Map();
    
    // Phi measurements over time
    this.phiHistory = [];
    
    // Causal graph
    this.causalGraph = new Map();
  }
  
  /**
   * Record agent state for integration analysis
   */
  recordAgentState(agentId, state) {
    this.agentStates.set(agentId, {
      ...state,
      recordedAt: Date.now()
    });
    
    // Add to history
    this.stateHistory.push({
      agentId,
      state,
      timestamp: Date.now()
    });
    
    // Trim history
    if (this.stateHistory.length > this.config.historySize) {
      this.stateHistory = this.stateHistory.slice(-this.config.historySize);
    }
  }
  
  /**
   * Record message flow between agents
   */
  recordMessageFlow(from, to, messageType, content) {
    const flow = {
      from,
      to,
      messageType,
      contentHash: this.hashContent(content),
      timestamp: Date.now()
    };
    
    this.messageFlows.push(flow);
    
    // Update causal graph
    this.updateCausalGraph(from, to);
    
    // Trim flows
    if (this.messageFlows.length > this.config.historySize) {
      this.messageFlows = this.messageFlows.slice(-this.config.historySize);
    }
  }
  
  /**
   * Simple hash for content comparison
   */
  hashContent(content) {
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  
  /**
   * Update causal graph based on message flows
   */
  updateCausalGraph(from, to) {
    const key = `${from}->${to}`;
    const current = this.causalGraph.get(key) || { count: 0, lastSeen: 0 };
    this.causalGraph.set(key, {
      count: current.count + 1,
      lastSeen: Date.now()
    });
  }
  
  /**
   * Estimate phi (integrated information)
   * Returns a value between 0 and 1
   */
  estimatePhi() {
    const components = {};
    
    // 1. Integration: How much does collective know that individuals don't?
    if (this.config.components.integration) {
      components.integration = this.measureIntegration();
    }
    
    // 2. Causality: How much do past states constrain future states?
    if (this.config.components.causality) {
      components.causality = this.measureCausality();
    }
    
    // 3. Coverage: How completely does system explore state space?
    if (this.config.components.coverage) {
      components.coverage = this.measureCoverage();
    }
    
    // Calculate composite phi
    const weights = { integration: 0.4, causality: 0.4, coverage: 0.2 };
    let phi = 0;
    let totalWeight = 0;
    
    for (const [component, value] of Object.entries(components)) {
      phi += value * weights[component];
      totalWeight += weights[component];
    }
    
    phi = totalWeight > 0 ? phi / totalWeight : 0;
    
    // Record measurement
    const measurement = {
      phi,
      components,
      agentCount: this.agentStates.size,
      messageFlowCount: this.messageFlows.length,
      causalConnections: this.causalGraph.size,
      timestamp: Date.now()
    };
    
    this.phiHistory.push(measurement);
    
    // Trim history
    if (this.phiHistory.length > this.config.historySize) {
      this.phiHistory = this.phiHistory.slice(-this.config.historySize);
    }
    
    return measurement;
  }
  
  /**
   * Measure information integration
   * How much does the collective know that individual agents don't?
   */
  measureIntegration() {
    if (this.agentStates.size < 2) return 0;
    
    // Calculate individual entropies
    const individualEntropies = [];
    for (const [agentId, state] of this.agentStates) {
      const entropy = this.calculateStateEntropy(state);
      individualEntropies.push(entropy);
    }
    
    // Sum of individual entropies
    const sumIndividual = individualEntropies.reduce((a, b) => a + b, 0);
    
    // Estimate collective entropy (simplified)
    const collectiveEntropy = this.calculateCollectiveEntropy();
    
    // Integration = collective information - sum of parts
    // Normalized to 0-1
    const integration = Math.max(0, collectiveEntropy - sumIndividual * 0.5);
    return Math.min(1, integration / Math.max(1, collectiveEntropy));
  }
  
  /**
   * Calculate entropy of a state
   */
  calculateStateEntropy(state) {
    // Simplified entropy calculation
    // Count unique values in state object
    const values = Object.values(state).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return 0;
    
    const uniqueValues = new Set(values.map(v => 
      typeof v === 'object' ? JSON.stringify(v) : String(v)
    ));
    
    // Normalized by log of total values
    return uniqueValues.size / Math.max(1, Math.log2(values.length + 1));
  }
  
  /**
   * Calculate collective entropy
   */
  calculateCollectiveEntropy() {
    // Based on diversity of agent states
    const stateSignatures = new Set();
    
    for (const [agentId, state] of this.agentStates) {
      const signature = JSON.stringify({
        status: state.status,
        focus: state.focus,
        task: state.task
      });
      stateSignatures.add(signature);
    }
    
    // More diverse states = higher collective entropy
    return stateSignatures.size / Math.max(1, this.agentStates.size);
  }
  
  /**
   * Measure causal density
   * How interconnected are the agents?
   */
  measureCausality() {
    if (this.causalGraph.size === 0) return 0;
    
    const agentCount = this.agentStates.size;
    if (agentCount < 2) return 0;
    
    // Maximum possible connections
    const maxConnections = agentCount * (agentCount - 1);
    
    // Actual connections (with recent activity)
    const recentThreshold = Date.now() - 60000; // 1 minute
    let activeConnections = 0;
    
    for (const [key, data] of this.causalGraph) {
      if (data.lastSeen > recentThreshold && data.count > 1) {
        activeConnections++;
      }
    }
    
    // Causal density = actual / max
    return Math.min(1, activeConnections / Math.max(1, maxConnections));
  }
  
  /**
   * Measure state space coverage
   * How much of the possible state space has been explored?
   */
  measureCoverage() {
    if (this.stateHistory.length < 10) return 0;
    
    // Count unique state configurations
    const uniqueStates = new Set();
    
    for (const entry of this.stateHistory) {
      const stateKey = JSON.stringify({
        status: entry.state?.status,
        focus: entry.state?.focus,
        mode: entry.state?.mode
      });
      uniqueStates.add(stateKey);
    }
    
    // Coverage increases with unique states, but plateaus
    const coverage = Math.log2(uniqueStates.size + 1) / 10;
    return Math.min(1, coverage);
  }
  
  /**
   * Get phi trend over time
   */
  getTrend(windowSize = 10) {
    if (this.phiHistory.length < 2) return 'insufficient_data';
    
    const recent = this.phiHistory.slice(-windowSize);
    if (recent.length < 2) return 'insufficient_data';
    
    // Calculate slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = recent.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recent[i].phi;
      sumXY += i * recent[i].phi;
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.01) return 'increasing';
    if (slope < -0.01) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const latest = this.phiHistory[this.phiHistory.length - 1];
    
    return {
      currentPhi: latest?.phi || 0,
      trend: this.getTrend(),
      totalMeasurements: this.phiHistory.length,
      agentCount: this.agentStates.size,
      causalConnections: this.causalGraph.size,
      stateHistorySize: this.stateHistory.length,
      messageFlowSize: this.messageFlows.length,
      components: latest?.components || {}
    };
  }
  
  /**
   * Save state to file
   */
  saveState(filepath) {
    const state = {
      phiHistory: this.phiHistory.slice(-100),
      causalGraph: Object.fromEntries(this.causalGraph),
      agentStates: Object.fromEntries(this.agentStates),
      savedAt: Date.now()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2));
    return state;
  }
  
  /**
   * Load state from file
   */
  loadState(filepath) {
    if (!fs.existsSync(filepath)) return false;
    
    const state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    // Restore phi history
    this.phiHistory = state.phiHistory || [];
    
    // Restore causal graph
    this.causalGraph = new Map(Object.entries(state.causalGraph || {}));
    
    // Restore agent states
    this.agentStates = new Map(Object.entries(state.agentStates || {}));
    
    return true;
  }
}

// Export
module.exports = PhiEstimator;

// CLI interface
if (require.main === module) {
  const estimator = new PhiEstimator();
  
  // Demo: Record some agent states
  console.log('Recording agent states...');
  estimator.recordAgentState('steward', { status: 'active', focus: 'coordination', task: 'planning' });
  estimator.recordAgentState('alpha', { status: 'deliberating', focus: 'task-priority', task: 'analysis' });
  estimator.recordAgentState('dreamer', { status: 'dreaming', focus: 'synthesis', task: 'background' });
  
  // Demo: Record some message flows
  console.log('Recording message flows...');
  estimator.recordMessageFlow('steward', 'alpha', 'task', { action: 'prioritize' });
  estimator.recordMessageFlow('alpha', 'steward', 'response', { result: 'agreed' });
  estimator.recordMessageFlow('dreamer', 'steward', 'insight', { idea: 'new approach' });
  
  // Estimate phi
  console.log('\nEstimating phi...');
  const measurement = estimator.estimatePhi();
  console.log('Phi:', measurement.phi.toFixed(3));
  console.log('Components:', measurement.components);
  
  // Show stats
  console.log('\nStats:', estimator.getStats());
}
