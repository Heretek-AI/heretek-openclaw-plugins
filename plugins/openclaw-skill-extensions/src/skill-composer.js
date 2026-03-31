/**
 * Skill Composer Module
 * Enables composition of multiple skills into complex operations
 */

const async = require('async');

class SkillComposer {
  constructor(config = {}) {
    this.config = {
      parallelism: config.parallelism || 4,
      maxDepth: config.maxDepth || 10,
      enableParallel: config.enableParallel ?? true,
      errorStrategy: config.errorStrategy || 'continue', // 'continue' | 'stop' | 'rollback'
      ...config
    };

    this.compositions = new Map();
    this.executionHistory = new Map();
    this.initialized = false;
    this.compositionCount = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Compose multiple skills into a new skill
   * @param {string} composedId - New skill identifier
   * @param {Array} skills - Skills to compose
   * @param {object} options - Composition options
   * @returns {Promise<object>} Composed skill definition
   */
  async compose(composedId, skills, options = {}) {
    const {
      sequence = 'parallel',
      outputMapper = null,
      inputMapper = null,
      condition = null
    } = options;

    const composition = {
      id: composedId,
      type: 'composed',
      skills: skills.map(s => typeof s === 'string' ? { skillId: s } : s),
      sequence,
      outputMapper,
      inputMapper,
      condition,
      options,
      createdAt: Date.now()
    };

    this.compositions.set(composedId, composition);
    this.compositionCount++;

    return {
      id: composedId,
      skillCount: skills.length,
      sequence,
      handler: this._createHandler(composition)
    };
  }

  /**
   * Execute a composed skill
   * @param {string} compositionId - Composition identifier
   * @param {object} params - Execution parameters
   * @returns {Promise<object>} Execution result
   */
  async execute(compositionId, params) {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const startTime = Date.now();
    const results = [];
    const errors = [];

    // Apply input mapper
    let inputParams = params;
    if (composition.inputMapper) {
      inputParams = composition.inputMapper(params);
    }

    // Check condition
    if (composition.condition && !composition.condition(inputParams)) {
      return {
        skipped: true,
        reason: 'Condition not met',
        inputParams
      };
    }

    // Execute based on sequence type
    if (composition.sequence === 'parallel' && this.config.enableParallel) {
      const parallelResults = await this._executeParallel(composition.skills, inputParams);
      results.push(...parallelResults.results);
      errors.push(...parallelResults.errors);
    } else if (composition.sequence === 'sequential') {
      const sequentialResults = await this._executeSequential(composition.skills, inputParams);
      results.push(...sequentialResults.results);
      errors.push(...sequentialResults.errors);
    } else if (composition.sequence === 'pipeline') {
      const pipelineResult = await this._executePipeline(composition.skills, inputParams);
      results.push(pipelineResult);
    }

    // Apply output mapper
    let finalResult = { results, errors };
    if (composition.outputMapper) {
      finalResult = composition.outputMapper({ results, errors, inputParams });
    }

    // Record execution history
    this.executionHistory.set(compositionId, {
      timestamp: startTime,
      duration: Date.now() - startTime,
      result: finalResult,
      errorCount: errors.length
    });

    return finalResult;
  }

  /**
   * Execute skills in parallel
   */
  async _executeParallel(skills, params) {
    const results = [];
    const errors = [];

    const queue = async.queue(async (skill, callback) => {
      try {
        const result = await this._executeSkill(skill, params);
        results.push({ skillId: skill.skillId, result });
      } catch (error) {
        errors.push({ skillId: skill.skillId, error: error.message });
        if (this.config.errorStrategy === 'stop') {
          callback(error);
          return;
        }
      }
      callback();
    }, this.config.parallelism);

    queue.push(skills);
    await queue.drain();

    return { results, errors };
  }

  /**
   * Execute skills sequentially
   */
  async _executeSequential(skills, params) {
    const results = [];
    const errors = [];
    let currentParams = params;

    for (const skill of skills) {
      try {
        const result = await this._executeSkill(skill, currentParams);
        results.push({ skillId: skill.skillId, result });
        
        // Pass result to next skill if outputMapping enabled
        if (skill.outputMapping && result) {
          currentParams = { ...currentParams, ...result };
        }
      } catch (error) {
        errors.push({ skillId: skill.skillId, error: error.message });
        
        if (this.config.errorStrategy === 'stop') {
          break;
        } else if (this.config.errorStrategy === 'rollback') {
          await this._rollback(results);
          break;
        }
      }
    }

    return { results, errors };
  }

  /**
   * Execute skills as a pipeline (output of one becomes input of next)
   */
  async _executePipeline(skills, initialInput) {
    let currentInput = initialInput;
    const stages = [];

    for (const skill of skills) {
      const result = await this._executeSkill(skill, currentInput);
      stages.push({ skillId: skill.skillId, input: currentInput, output: result });
      
      // Pass output to next stage
      currentInput = result || currentInput;
    }

    return { stages, finalOutput: currentInput };
  }

  /**
   * Execute a single skill
   */
  async _executeSkill(skill, params) {
    const { skillId, params: skillParams = {} } = skill;
    
    // Merge params
    const mergedParams = { ...params, ...skillParams };

    // In production, this would call the actual skill handler
    // For now, return mock result
    return {
      skillId,
      executed: true,
      params: mergedParams,
      timestamp: Date.now()
    };
  }

  /**
   * Rollback executed skills
   */
  async _rollback(results) {
    // In production, this would call rollback handlers for each skill
    for (const result of results.reverse()) {
      console.log(`[SkillComposer] Rolling back skill: ${result.skillId}`);
    }
  }

  /**
   * Create a handler function for the composed skill
   */
  _createHandler(composition) {
    return async (params, context) => {
      return await this.execute(composition.id, params);
    };
  }

  /**
   * Get composition statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const executions = Array.from(this.executionHistory.values());
    const avgDuration = executions.length > 0 
      ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length 
      : 0;

    return {
      type: 'skill-composer',
      compositionCount: this.compositions.size,
      totalExecutions: executions.length,
      avgDuration,
      errorRate: executions.length > 0 
        ? executions.filter(e => e.errorCount > 0).length / executions.length 
        : 0,
      parallelism: this.config.parallelism,
      maxDepth: this.config.maxDepth
    };
  }

  /**
   * Clear composer state
   * @returns {Promise<void>}
   */
  async clear() {
    this.compositions.clear();
    this.executionHistory.clear();
    this.compositionCount = 0;
  }
}

module.exports = SkillComposer;
