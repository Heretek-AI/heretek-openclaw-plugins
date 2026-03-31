#!/usr/bin/env node
/**
 * Attention Schema Module
 * 
 * Implements Attention Schema Theory (AST) by Michael Graziano.
 * Models attention as a process and uses this model
 * to control attention and generate awareness reports.
 * 
 * Key concepts:
 * - Attention: Real resource allocation process
 * - Attention Schema: Model of attention (like body schema)
 * - Awareness: Output of the attention schema
 * - Self-Attribution: Attributing awareness to self
 */

const fs = require('fs');
const path = require('path');

class AttentionSchema {
  constructor(agent, config = {}) {
    this.agent = agent;
    this.config = {
      historySize: config.historySize || 100,
      modelIntervalMs: config.modelIntervalMs || 1000,
      shiftThreshold: config.shiftThreshold || 0.3,
      ...config
    };
    
    // Current attention state
    this.attentionModel = {
      focus: null,
      intensity: 0,
      targets: [],
      startTime: null
    };
    
    // History of attention states
    this.history = [];
    
    // Awareness reports
    this.awarenessReport = {
      selfAware: false,
      content: null,
      confidence: 0,
      timestamp: null
    };
    
    // Agent reference
    this.agent = agent;
  }
  
  /**
   * Model own attention
   */
  modelAttention(currentFocus, intensity) {
    const now = Date.now();
    const targets = this.identifyTargets(currentFocus);
    
    this.attentionModel = {
      focus: currentFocus,
      intensity: Math.min(1, Math.max(0, intensity)),
      targets,
      startTime: now
    };
    
    // Add to history
    this.history.push({ ...this.attentionModel });
    
    // Trim history
    if (this.history.length > this.config.historySize) {
      this.history = this.history.slice(-this.config.historySize);
    }
    
    // Generate awareness report
    this.awarenessReport = {
      selfAware: intensity > 0.5,
      content: currentFocus,
      confidence: intensity,
      timestamp: Date.now()
    };
    
    return this.awarenessReport;
  }
  
  /**
   * Identify attention targets
   */
  identifyTargets(currentFocus) {
    // Extract entities and topics from focus description
    const targets = [];
    if (typeof currentFocus === 'string') {
      targets.push({ type: 'topic', value: currentFocus });
    }
    return targets;
  }
  
  /**
   * Model others' attention (theory of mind)
   */
  modelOtherAttention(otherAgent, signals) {
    // Infer focus from behavioral signals
    const inferredFocus = this.inferFocus(signals);
    const inferredIntensity = signals.reduce((max, s) => Math.max(max, s.intensity), 0);
    
    return {
      agent: otherAgent,
      inferredFocus: this.inferFocus(signals),
      inferredIntensity,
      predictedBehavior: this.predictBehaviorFromFocus(signals),
      timestamp: Date.now()
    };
  }
  
  /**
   * Infer focus from signals
   */
  inferFocus(signals) {
    // Simple heuristic: most recent/strongest signal
    if (signals.length === 0) return 'unknown';
    
    // Find most common topic
    const topics = {};
    for (const signal of signals) {
      if (signal.topic) {
        if (signal.intensity > (topics[signal.topic] || 0)) {
          topics[signal.topic] = signal.intensity;
        }
      }
    }
    
    // Return most common topic
    const sortedTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1]);
    
    return (sortedTopics[0] && sortedTopics[0][0]) || 'unknown';
  }
  
  /**
   * Predict behavior from focus
   */
  predictBehaviorFromFocus(signals) {
    const focus = this.inferFocus(signals);
    
    if (!focus) return 'continue working';
    
    // Simple predictions based on focus
    if (focus === 'query') return 'ask questions';
    if (focus === 'task') return 'continue task';
    if (focus === 'explore') return 'investigate';
    
    return 'continue working';
  }
  
  /**
   * Control attention using the schema
   */
  controlAttention(goalFocus) {
    const currentFocus = this.attentionModel.focus;
    const shiftRequired = currentFocus !== goalFocus;
    
    if (shiftRequired) {
      const cost = this.calculateShiftCost(currentFocus, goalFocus);
      
      // Execute shift if beneficial
      if (cost < this.config.shiftThreshold) {
        if (this.agent && typeof this.agent.setFocus === 'function') {
          this.agent.setFocus(goalFocus);
        }
        return { shifted: true, cost };
      }
    }
    
    return { shifted: false };
  }
  
  /**
   * Calculate cost of shifting attention
   */
  calculateShiftCost(currentFocus, goalFocus) {
    // Simple cost model based on semantic distance
    // In practice, this could be based on:
    // - Topic similarity
    // - Time since last shift
    // - Energy required for shift
    
    return 0.5; // Default medium cost
  }
  
  /**
   * Get current attention state
   */
  getAttentionState() {
    return { ...this.attentionModel };
  }
  
  /**
   * Get awareness report
   */
  getAwarenessReport() {
    return this.awarenessReport;
  }
  
  /**
   * Get history
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }
  
  /**
   * Get stats
   */
  getStats() {
    return {
      currentFocus: this.attentionModel.focus,
      currentIntensity: this.attentionModel.intensity,
      historySize: this.history.length,
      isSelfAware: this.awarenessReport.selfAware,
      shiftThreshold: this.config.shiftThreshold
    };
  }
}

module.exports = AttentionSchema;
