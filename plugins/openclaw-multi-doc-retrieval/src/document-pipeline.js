/**
 * Document Pipeline Module
 * Manages multi-stage document processing pipelines
 */

const async = require('async');

class DocumentPipeline {
  constructor(config = {}) {
    this.config = {
      parallelism: config.parallelism || 4,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      stages: config.stages || ['fetch', 'process', 'index', 'link'],
      ...config
    };

    this.queue = async.queue(this.processStage.bind(this), this.config.parallelism);
    this.documents = new Map();
    this.initialized = false;
    this.processedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Execute a retrieval pipeline
   * @param {string} query - Search query
   * @param {Array} stages - Pipeline stage definitions
   * @returns {Promise<object>} Pipeline results
   */
  async execute(query, stages) {
    const results = {
      query,
      stages: [],
      documents: [],
      errors: []
    };

    let currentData = { query };

    for (const stage of stages) {
      try {
        const stageResult = await this.runStage(stage, currentData);
        results.stages.push({
          name: stage.name,
          status: 'success',
          outputCount: stageResult?.length || 0
        });
        currentData = { ...currentData, ...stageResult };
      } catch (error) {
        results.errors.push({
          stage: stage.name,
          error: error.message
        });
        
        if (stage.onError === 'stop') {
          break;
        }
      }
    }

    results.documents = currentData.documents || [];
    return results;
  }

  /**
   * Run a single pipeline stage
   */
  async runStage(stage, data) {
    const { name, type, config = {} } = stage;

    switch (type) {
      case 'fetch':
        return this.fetchDocuments(data.query, config);
      case 'filter':
        return this.filterDocuments(data.documents, config);
      case 'rank':
        return this.rankDocuments(data.documents, config);
      case 'transform':
        return this.transformDocuments(data.documents, config);
      case 'aggregate':
        return this.aggregateDocuments(data.documents, config);
      default:
        throw new Error(`Unknown stage type: ${type}`);
    }
  }

  async processStage(task, callback) {
    try {
      const result = await this.runStage(task.stage, task.data);
      callback(null, result);
    } catch (error) {
      this.errorCount++;
      callback(error);
    }
  }

  async fetchDocuments(query, config) {
    // Placeholder for document fetching
    return { documents: [] };
  }

  filterDocuments(documents, config) {
    const { field, operator, value } = config;
    
    return documents.filter(doc => {
      const docValue = doc[field];
      switch (operator) {
        case 'eq': return docValue === value;
        case 'ne': return docValue !== value;
        case 'gt': return docValue > value;
        case 'lt': return docValue < value;
        case 'includes': return docValue?.includes(value);
        default: return true;
      }
    });
  }

  rankDocuments(documents, config) {
    const { field = 'score', order = 'desc' } = config;
    
    return [...documents].sort((a, b) => {
      const comparison = (a[field] || 0) - (b[field] || 0);
      return order === 'desc' ? -comparison : comparison;
    });
  }

  transformDocuments(documents, config) {
    const { fields, mapper } = config;
    
    return documents.map(doc => {
      const transformed = {};
      for (const field of fields || Object.keys(doc)) {
        if (mapper && typeof mapper === 'function') {
          transformed[field] = mapper(doc[field], doc);
        } else {
          transformed[field] = doc[field];
        }
      }
      return transformed;
    });
  }

  aggregateDocuments(documents, config) {
    const { groupBy, aggregations } = config;
    const groups = new Map();

    for (const doc of documents) {
      const key = doc[groupBy];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(doc);
    }

    const results = [];
    for (const [key, docs] of groups) {
      const aggregated = { [groupBy]: key, count: docs.length };
      
      for (const agg of aggregations || []) {
        const values = docs.map(d => d[agg.field]).filter(v => typeof v === 'number');
        switch (agg.operation) {
          case 'sum': aggregated[agg.name] = values.reduce((a, b) => a + b, 0); break;
          case 'avg': aggregated[agg.name] = values.reduce((a, b) => a + b, 0) / values.length; break;
          case 'min': aggregated[agg.name] = Math.min(...values); break;
          case 'max': aggregated[agg.name] = Math.max(...values); break;
        }
      }
      
      results.push(aggregated);
    }

    return results;
  }

  /**
   * Index documents
   * @param {Array<object>} documents - Documents to index
   * @returns {Promise<object>} Indexing results
   */
  async index(documents) {
    const results = {
      total: documents.length,
      successful: 0,
      failed: 0,
      indexed: []
    };

    for (const doc of documents) {
      try {
        this.documents.set(doc.id, {
          ...doc,
          indexedAt: Date.now()
        });
        results.successful++;
        results.indexed.push(doc.id);
        this.processedCount++;
      } catch (error) {
        results.failed++;
        results.errors = results.errors || [];
        results.errors.push({ id: doc.id, error: error.message });
        this.errorCount++;
      }
    }

    return results;
  }

  /**
   * Get pipeline statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    return {
      type: 'pipeline',
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      documentCount: this.documents.size,
      queueLength: this.queue.length(),
      parallelism: this.config.parallelism,
      stages: this.config.stages
    };
  }

  /**
   * Clear pipeline data
   * @returns {Promise<void>}
   */
  async clear() {
    this.documents.clear();
    this.processedCount = 0;
    this.errorCount = 0;
    this.queue.kill();
  }
}

module.exports = DocumentPipeline;
