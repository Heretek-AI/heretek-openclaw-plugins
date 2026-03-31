#!/usr/bin/env node
/**
 * Active Inference Module
 * 
 * Implements Predictive Processing / Free Energy Principle (FEP) by Karl Friston.
 * Agents minimize "free energy" - the difference between predictions
 * and observations. This leads to active inference: acting to confirm predictions.
 * 
 * Key concepts:
 * - Generative Model: Internal model generating predictions
 * - Prediction Error: Difference between predicted and actual
 * - Precision Weighting: How much to trust predictions
 * - Active Inference: Acting to minimize prediction error
 * - Hierarchical Processing: Multiple levels of prediction
 */

const fs = require('fs');
const path = require('path');

class ActiveInference {
  constructor(agent, config = {}) {
    this.agent = agent;
    this.config = {
      learningRate: config.learningRate || 0.1,
      precision: config.precision || 1.0,
      maxIterations: config.maxIterations || 100,
      errorThreshold: config.errorThreshold || 0.01,
      ...config
    };
    
    // Generative model for agent's world understanding
    this.generativeModel = {
      beliefs: {},
      predictions: {},
      policies: [],
      precisionWeights: {}
    };
    
    // History of inference cycles
    this.inferenceHistory = [];
    
    // Expected free energy history
    this.efeHistory = [];
  }
  
  /**
   * Initialize generative model
   */
  initializeModel(initialBeliefs = {}) {
    this.generativeModel = {
      beliefs: initialBeliefs,
      predictions: {},
      policies: [],
      precisionWeights: {},
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Generate predictions from the model
   */
  predict() {
    return {
      state: this.generativeModel.predict(),
      confidence: this.calculateConfidence()
    };
  }
  
  /**
   * Calculate prediction error
   */
  calculateError(predictions, observations) {
    let totalError = 0;
    const errors = {};
    
    for (const key of Object.keys(predictions)) {
      if (observations[key] === undefined) continue;
      const predicted = predictions[key];
      const observed = observations[key];
      const error = Math.abs(predicted - observed);
      errors[key] = error;
      totalError += error;
    }
    
    return {
      totalError: totalError,
      errors: errors
    };
  }
  
  /**
   * Calculate confidence in predictions
   */
  calculateConfidence() {
    // Use precision weighting
    let confidence = 1;
    for (const key of Object.keys(this.precisionWeights)) {
      confidence *= this.precisionWeights[key];
    }
    return confidence;
  }
  
  /**
   * Update model based on prediction error
   */
  updateModel(predictionError) {
    // Simple gradient descent
    for (const key of Object.keys(this.generativeModel.beliefs)) {
      if (predictionError.errors[key] !== undefined) {
        this.generativeModel.beliefs[key] -= this.config.learningRate * predictionError.errors[key];
      }
    }
  }
  
  /**
   * Minimize free energy through perception
   */
  perceptualInference(observations) {
    let predictionError;
    let iterations = 0;
    
    do {
      // Generate predictions
      const predictions = this.predict();
      
      // Calculate error
      predictionError = this.calculateError(predictions.state || {}, observations);
      
      // Update model
      this.updateModel(predictionError);
      
      iterations++;
    } while (predictionError.totalError > this.config.errorThreshold && iterations < this.config.maxIterations);
    
    return {
      finalPrediction: this.generativeModel.predict(),
      error: predictionError.totalError,
      iterations
    };
  }
  
  /**
   * Minimize free energy through action
   */
  activeInference(goalState) {
    // What actions would make my predictions match goal?
    const currentPrediction = this.generativeModel.predictCurrentState();
    const gap = this.calculateError(currentPrediction, goalState);
    
    // Generate actions that would minimize prediction error
    const actions = this.generativeModel.policies
      .map(policy => ({
        action: policy,
        expectedReduction: this.simulate(policy, gap)
      }))
      .sort((a, b) => b.expectedReduction - a.expectedReduction);
    
    return actions.length > 0 ? actions[0].action : null;
  }
  
  /**
   * Simulate action outcome
   */
  simulate(policy, gap) {
    // Simple simulation - in practice, use actual model
    const predictedEffect = 1 - (gap.totalError * 0.1);
    return predictedEffect;
  }
  
  /**
   * Calculate expected free energy for planning
   */
  expectedFreeEnergy(policy) {
    // EFE = risk + ambiguity + novelty
    const risk = this.calculateRisk(policy);
    const ambiguity = this.calculateAmbiguity(policy);
    const novelty = this.calculateNovelty(policy);
    
    return risk + ambiguity - novelty;  // Minus novelty because we seek it
  }
  
  /**
   * Calculate risk of a policy
   */
  calculateRisk(policy) {
    // Risk = variance of expected outcomes
    return policy.variance || 0.1;
  }
  
  /**
   * Calculate ambiguity of a policy
   */
  calculateAmbiguity(policy) {
    // Ambiguity = uncertainty in model
    return 1 - this.generativeModel.confidence;
  }
  
  /**
   * Calculate novelty of a policy
   */
  calculateNovelty(policy) {
    // Novelty = information gain
    return policy.informationGain || 0.1;
  }
  
  /**
   * Get model statistics
   */
  getStats() {
    return {
      beliefs: Object.keys(this.generativeModel.beliefs).length,
      policies: this.generativeModel.policies.length,
      historySize: this.inferenceHistory.length,
      avgError: this.inferenceHistory.length > 0 
        ? this.inferenceHistory.reduce((sum, h) => sum + h.error, 0) / this.inferenceHistory.length 
        : 0
    };
  }
  
  /**
   * Save state
   */
  saveState(filepath) {
    const state = {
      generativeModel: this.generativeModel,
      inferenceHistory: this.inferenceHistory.slice(-100),
      savedAt: Date.now()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2));
  }
}

module.exports = ActiveInference;
