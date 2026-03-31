/**
 * OpenClaw Hybrid Search Plugin
 * Combines vector, keyword, and graph-based retrieval for enhanced RAG capabilities
 */

const VectorSearch = require('./vector-search');
const KeywordSearch = require('./keyword-search');
const GraphSearch = require('./graph-search');
const HybridFusion = require('./hybrid-fusion');
const CrossReferenceLinker = require('./cross-reference-linker');

class HybridSearchPlugin {
  constructor(config = {}) {
    this.config = {
      vectorWeight: config.vectorWeight || 0.5,
      keywordWeight: config.keywordWeight || 0.3,
      graphWeight: config.graphWeight || 0.2,
      topK: config.topK || 10,
      minScore: config.minScore || 0.3,
      enableReranking: config.enableReranking ?? true,
      ...config
    };

    this.vectorSearch = new VectorSearch(config.vector);
    this.keywordSearch = new KeywordSearch(config.keyword);
    this.graphSearch = new GraphSearch(config.graph);
    this.fusion = new HybridFusion(this.config);
    this.linker = new CrossReferenceLinker(config.linker);

    this.initialized = false;
  }

  async initialize() {
    await this.vectorSearch.initialize();
    await this.keywordSearch.initialize();
    await this.graphSearch.initialize();
    await this.linker.initialize();
    this.initialized = true;
    console.log('[HybridSearch] Plugin initialized with hybrid retrieval');
  }

  /**
   * Perform hybrid search across all retrieval methods
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Ranked results with scores
   */
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      topK = this.config.topK,
      minScore = this.config.minScore,
      weights = {
        vector: this.config.vectorWeight,
        keyword: this.config.keywordWeight,
        graph: this.config.graphWeight
      },
      filters = {}
    } = options;

    // Execute parallel searches
    const [vectorResults, keywordResults, graphResults] = await Promise.all([
      this.vectorSearch.search(query, { topK: topK * 2, ...filters }),
      this.keywordSearch.search(query, { topK: topK * 2, ...filters }),
      this.graphSearch.search(query, { topK: topK * 2, ...filters })
    ]);

    // Fuse results using weighted reciprocal rank fusion
    const fusedResults = this.fusion.fuse([
      { results: vectorResults, weight: weights.vector, source: 'vector' },
      { results: keywordResults, weight: weights.keyword, source: 'keyword' },
      { results: graphResults, weight: weights.graph, source: 'graph' }
    ]);

    // Apply reranking if enabled
    let finalResults = fusedResults;
    if (this.config.enableReranking) {
      finalResults = await this.fusion.rerank(query, fusedResults);
    }

    // Filter by minimum score and limit
    finalResults = finalResults
      .filter(r => r.combinedScore >= minScore)
      .slice(0, topK);

    // Add cross-references
    finalResults = await this.linker.addCrossReferences(finalResults);

    return finalResults;
  }

  /**
   * Index a document for hybrid retrieval
   * @param {object} document - Document to index
   * @returns {Promise<object>} Indexing result
   */
  async index(document) {
    if (!this.initialized) {
      await this.initialize();
    }

    const [vectorResult, keywordResult, graphResult] = await Promise.all([
      this.vectorSearch.index(document),
      this.keywordSearch.index(document),
      this.graphSearch.index(document)
    ]);

    // Create cross-references between indexed content
    await this.linker.createReferences({
      documentId: document.id,
      vectorId: vectorResult.id,
      keywordId: keywordResult.id,
      graphId: graphResult.id
    });

    return {
      success: true,
      documentId: document.id,
      vectorId: vectorResult.id,
      keywordId: keywordResult.id,
      graphId: graphResult.id
    };
  }

  /**
   * Bulk index multiple documents
   * @param {Array<object>} documents - Documents to index
   * @returns {Promise<object>} Bulk indexing results
   */
  async bulkIndex(documents) {
    const results = await Promise.all(
      documents.map(doc => this.index(doc).catch(err => ({ error: err.message, documentId: doc.id })))
    );

    return {
      total: documents.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => r.error).length,
      results
    };
  }

  /**
   * Get search statistics
   * @returns {Promise<object>} Search statistics
   */
  async getStats() {
    const [vectorStats, keywordStats, graphStats] = await Promise.all([
      this.vectorSearch.getStats(),
      this.keywordSearch.getStats(),
      this.graphSearch.getStats()
    ]);

    return {
      vector: vectorStats,
      keyword: keywordStats,
      graph: graphStats,
      hybrid: {
        totalSearches: this.fusion.searchCount,
        avgFusionTime: this.fusion.avgFusionTime,
        avgRerankTime: this.fusion.avgRerankTime
      }
    };
  }

  /**
   * Clear all indices
   * @returns {Promise<void>}
   */
  async clear() {
    await Promise.all([
      this.vectorSearch.clear(),
      this.keywordSearch.clear(),
      this.graphSearch.clear(),
      this.linker.clear()
    ]);
  }
}

module.exports = HybridSearchPlugin;
