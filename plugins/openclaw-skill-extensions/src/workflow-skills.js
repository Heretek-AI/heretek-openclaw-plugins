/**
 * Workflow Skills Module
 * Implements project-specific workflow skills
 */

const async = require('async');

class WorkflowSkills {
  constructor(config = {}) {
    this.config = {
      maxConcurrentWorkflows: config.maxConcurrent || 10,
      defaultTimeout: config.defaultTimeout || 60000,
      enableRetry: config.enableRetry ?? true,
      maxRetries: config.maxRetries || 3,
      ...config
    };

    this.workflows = new Map();
    this.activeWorkflows = new Map();
    this.workflowHistory = new Map();
    this.queue = async.queue(this._processWorkflow.bind(this), this.config.maxConcurrentWorkflows);
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
    this._registerBuiltInWorkflows();
  }

  /**
   * Register a workflow
   * @param {string} name - Workflow name
   * @param {object} definition - Workflow definition
   */
  register(name, definition) {
    const { steps, description, tags, timeout } = definition;

    this.workflows.set(name, {
      name,
      description,
      tags: tags || [],
      steps,
      timeout: timeout || this.config.defaultTimeout,
      createdAt: Date.now()
    });
  }

  /**
   * Execute a workflow
   * @param {string} name - Workflow name
   * @param {object} params - Workflow parameters
   * @returns {Promise<object>} Workflow result
   */
  async execute(name, params = {}) {
    const workflow = this.workflows.get(name);
    if (!workflow) {
      throw new Error(`Workflow not found: ${name}`);
    }

    return new Promise((resolve, reject) => {
      const execution = {
        id: this._generateExecutionId(),
        name,
        params,
        status: 'queued',
        queuedAt: Date.now(),
        startedAt: null,
        completedAt: null,
        results: [],
        errors: []
      };

      this.activeWorkflows.set(execution.id, execution);

      this.queue.push({ execution, workflow, params }, (err, result) => {
        if (err) {
          execution.status = 'failed';
          execution.errors.push({ error: err.message });
          reject(err);
        } else {
          execution.status = 'completed';
          resolve(result);
        }
        execution.completedAt = Date.now();
        this._recordHistory(execution);
        this.activeWorkflows.delete(execution.id);
      });
    });
  }

  /**
   * Process a workflow execution
   */
  async _processWorkflow(task, callback) {
    const { execution, workflow, params } = task;
    execution.status = 'running';
    execution.startedAt = Date.now();

    const results = [];
    const errors = [];
    let context = { ...params };

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        try {
          const stepResult = await this._executeStep(step, context, {
            attempt: 1,
            maxRetries: this.config.maxRetries
          });
          
          results.push({
            step: step.name || i,
            result: stepResult,
            duration: stepResult.duration
          });

          // Merge step output into context
          if (step.outputMapping) {
            context = { ...context, ...stepResult.output };
          }

          // Check for early exit condition
          if (step.exitCondition && step.exitCondition(context)) {
            break;
          }
        } catch (stepError) {
          errors.push({
            step: step.name || i,
            error: stepError.message
          });

          if (this.config.enableRetry && step.retry !== false) {
            // Retry logic
            const retryResult = await this._retryStep(step, context, stepError);
            if (retryResult.success) {
              results.push({
                step: step.name || i,
                result: retryResult.result,
                retried: true
              });
              continue;
            }
          }

          if (step.onError === 'stop') {
            throw stepError;
          }
        }
      }

      const result = {
        executionId: execution.id,
        workflow: name,
        status: 'completed',
        results,
        errors,
        duration: Date.now() - execution.startedAt
      };

      callback(null, result);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Execute a single workflow step
   */
  async _executeStep(step, context, options) {
    const startTime = Date.now();
    const { type, handler, params = {} } = step;

    // Merge step params with context
    const stepParams = this._mergeParams(params, context);

    let result;
    switch (type) {
      case 'skill':
        result = await this._executeSkillStep(stepParams, context);
        break;
      case 'api':
        result = await this._executeApiStep(stepParams, context);
        break;
      case 'transform':
        result = await this._executeTransformStep(step, context);
        break;
      case 'condition':
        result = await this._executeConditionStep(step, context);
        break;
      case 'parallel':
        result = await this._executeParallelStep(step, context);
        break;
      default:
        if (handler && typeof handler === 'function') {
          result = await handler(stepParams, context);
        } else {
          result = { executed: true, type: type || 'custom' };
        }
    }

    return {
      ...result,
      duration: Date.now() - startTime,
      output: step.outputMapping ? step.outputMapping(result, context) : result
    };
  }

  /**
   * Retry a failed step
   */
  async _retryStep(step, context, originalError) {
    const { maxRetries = this.config.maxRetries } = step;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        
        const result = await this._executeStep(step, context, { attempt, maxRetries });
        return { success: true, result, attempt };
      } catch (error) {
        if (attempt === maxRetries) {
          return { success: false, error };
        }
      }
    }
    
    return { success: false, error: originalError };
  }

  /**
   * Execute a skill step
   */
  async _executeSkillStep(params, context) {
    const { skillId } = params;
    // In production, this would call the actual skill
    return { skillId, executed: true, type: 'skill' };
  }

  /**
   * Execute an API step
   */
  async _executeApiStep(params, context) {
    const { endpoint, method = 'GET' } = params;
    // In production, this would make actual API call
    return { endpoint, method, executed: true, type: 'api' };
  }

  /**
   * Execute a transform step
   */
  async _executeTransformStep(step, context) {
    const { transform } = step;
    if (typeof transform === 'function') {
      return transform(context);
    }
    return { transformed: true, context };
  }

  /**
   * Execute a condition step
   */
  async _executeConditionStep(step, context) {
    const { condition, then, else: elseStep } = step;
    const result = condition(context);
    
    return {
      condition: result,
      branch: result ? 'then' : 'else',
      nextStep: result ? then : elseStep
    };
  }

  /**
   * Execute parallel steps
   */
  async _executeParallelStep(step, context) {
    const { steps: parallelSteps } = step;
    const results = await Promise.all(
      parallelSteps.map(s => this._executeStep(s, context, {}))
    );
    
    return {
      parallel: true,
      results,
      completedCount: results.length
    };
  }

  /**
   * Merge step parameters with context
   */
  _mergeParams(stepParams, context) {
    const merged = {};
    
    for (const [key, value] of Object.entries(stepParams)) {
      if (typeof value === 'string' && value.startsWith('$.')) {
        // Reference to context
        const contextKey = value.slice(2);
        merged[key] = context[contextKey];
      } else {
        merged[key] = value;
      }
    }
    
    return { ...merged, ...context };
  }

  /**
   * Record workflow execution history
   */
  _recordHistory(execution) {
    if (!this.workflowHistory.has(execution.name)) {
      this.workflowHistory.set(execution.name, []);
    }
    
    const history = this.workflowHistory.get(execution.name);
    history.push(execution);
    
    // Limit history size
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Register built-in workflows
   */
  _registerBuiltInWorkflows() {
    // Document processing workflow
    this.register('document-processing', {
      description: 'Process documents through ingestion, analysis, and indexing',
      tags: ['document', 'processing', 'rag'],
      steps: [
        { name: 'validate', type: 'condition', condition: (ctx) => ctx.document?.content },
        { name: 'extract', type: 'transform', transform: (ctx) => ({ text: ctx.document.content }) },
        { name: 'embed', type: 'skill', skillId: 'embedding' },
        { name: 'index', type: 'skill', skillId: 'vector-index' }
      ]
    });

    // Multi-agent deliberation workflow
    this.register('multi-agent-deliberation', {
      description: 'Coordinate deliberation between multiple agents',
      tags: ['agent', 'deliberation', 'coordination'],
      steps: [
        { name: 'broadcast', type: 'parallel', steps: [
          { type: 'skill', skillId: 'agent-query', params: { agent: 'alpha' } },
          { type: 'skill', skillId: 'agent-query', params: { agent: 'beta' } },
          { type: 'skill', skillId: 'agent-query', params: { agent: 'gamma' } }
        ]},
        { name: 'aggregate', type: 'transform', transform: (ctx) => ({ responses: ctx.responses }) },
        { name: 'synthesize', type: 'skill', skillId: 'synthesis' }
      ]
    });

    // Backup and verification workflow
    this.register('backup-verify', {
      description: 'Create backup and verify integrity',
      tags: ['backup', 'verification', 'maintenance'],
      steps: [
        { name: 'backup', type: 'skill', skillId: 'backup-create' },
        { name: 'verify', type: 'skill', skillId: 'backup-verify', onError: 'stop' },
        { name: 'notify', type: 'skill', skillId: 'notification-send' }
      ]
    });
  }

  /**
   * Generate unique execution ID
   */
  _generateExecutionId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get workflow statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const executions = Array.from(this.workflowHistory.values()).flat();
    const completedExecutions = executions.filter(e => e.status === 'completed');
    
    return {
      type: 'workflow-skills',
      registeredWorkflows: this.workflows.size,
      activeWorkflows: this.activeWorkflows.size,
      totalExecutions: executions.length,
      completedExecutions: completedExecutions.length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      avgDuration: completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
        : 0,
      queueLength: this.queue.length(),
      maxConcurrent: this.config.maxConcurrentWorkflows
    };
  }

  /**
   * Clear workflows
   * @returns {Promise<void>}
   */
  async clear() {
    this.workflows.clear();
    this.activeWorkflows.clear();
    this.workflowHistory.clear();
    this.queue.kill();
  }
}

module.exports = WorkflowSkills;
