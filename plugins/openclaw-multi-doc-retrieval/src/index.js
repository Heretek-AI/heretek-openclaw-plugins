/**
 * OpenClaw Multi-Document Retrieval Plugin
 * Orchestrates retrieval pipelines across multiple documents and sources
 */

const DocumentPipeline = require('./document-pipeline');
const ContextBuilder = require('./context-builder');
const CitationTracker = require('./citation-tracker');
const RetrievalOrchestrator = require('./retrieval-orchestrator');

class MultiDocRetrievalPlugin {
  constructor(config = {}) {
    this.config = {
      maxDocuments: config.maxDocuments || 20,
      maxContextLength: config.maxContextLength || 8000,
      enableCitations: config.enableCitations ?? true,
      pipelineTimeout: config.pipelineTimeout || 30000,
      ...config
    };

    this.pipeline = new DocumentPipeline(config.pipeline);
    this.contextBuilder = new ContextBuilder(config.context);
    this.citations = new CitationTracker(config.citations);
    this.orchestrator = new RetrievalOrchestrator({
      ...config.orchestrator,
      maxDocuments: this.config.maxDocuments
    });

    this.initialized = false;
    this.retrievalCount = 0;
  }

  async initialize() {
    await this.pipeline.initialize();
    await this.contextBuilder.initialize();
    await this.citations.initialize();
    await this.orchestrator.initialize();
    this.initialized = true;
    console.log('[MultiDocRetrieval] Plugin initialized');
  }

  /**
   * Retrieve documents using configured pipeline
   * @param {string} query - Search query
   * @param {object} options - Retrieval options
   * @returns {Promise<object>} Retrieved documents with context
   */
  async retrieve(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const {
      maxDocuments = this.config.maxDocuments,
      maxContextLength = this.config.maxContextLength,
      sources = ['vector', 'keyword', 'graph'],
      filters = {},
      enableCitations = this.config.enableCitations
    } = options;

    // Execute retrieval pipeline
    const retrievedDocs = await this.orchestrator.retrieve(query, {
      maxDocuments,
      sources,
      filters
    });

    // Build context from retrieved documents
    const context = await this.contextBuilder.build(retrievedDocs, {
      maxLength: maxContextLength
    });

    // Track citations if enabled
    let citations = null;
    if (enableCitations) {
      citations = await this.citations.track(retrievedDocs, query);
    }

    this.retrievalCount++;
    const duration = Date.now() - startTime;

    return {
      query,
      documents: retrievedDocs,
      context,
      citations,
      metadata: {
        retrievalTime: duration,
        documentCount: retrievedDocs.length,
        contextLength: context.length,
        sources: [...new Set(retrievedDocs.map(d => d.source))]
      }
    };
  }

  /**
   * Execute a custom retrieval pipeline
   * @param {string} query - Search query
   * @param {Array} stages - Pipeline stages
   * @returns {Promise<object>} Pipeline results
   */
  async executePipeline(query, stages) {
    return await this.pipeline.execute(query, stages);
  }

  /**
   * Add documents to the retrieval index
   * @param {Array<object>} documents - Documents to add
   * @returns {Promise<object>} Indexing results
   */
  async addDocuments(documents) {
    return await this.pipeline.index(documents);
  }

  /**
   * Get retrieval statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const [pipelineStats, contextStats, citationStats, orchestratorStats] = await Promise.all([
      this.pipeline.getStats(),
      this.contextBuilder.getStats(),
      this.citations.getStats(),
      this.orchestrator.getStats()
    ]);

    return {
      pipeline: pipelineStats,
      context: contextStats,
      citations: citationStats,
      orchestrator: orchestratorStats,
      totalRetrievals: this.retrievalCount
    };
  }

  /**
   * Clear all indices
   * @returns {Promise<void>}
   */
  async clear() {
    await Promise.all([
      this.pipeline.clear(),
      this.contextBuilder.clear(),
      this.citations.clear(),
      this.orchestrator.clear()
    ]);
  }
}

module.exports = MultiDocRetrievalPlugin;
