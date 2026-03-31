/**
 * Retrieval Orchestrator Module
 * Coordinates retrieval across multiple sources
 */

class RetrievalOrchestrator {
  constructor(config = {}) {
    this.config = {
      maxDocuments: config.maxDocuments || 20,
      sourceWeights: config.sourceWeights || {
        vector: 0.5,
        keyword: 0.3,
        graph: 0.2
      },
      deduplicate: config.deduplicate ?? true,
      ...config
    };

    this.initialized = false;
    this.retrieveCount = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Orchestrate retrieval from multiple sources
   * @param {string} query - Search query
   * @param {object} options - Retrieval options
   * @returns {Promise<Array>} Retrieved documents
   */
  async retrieve(query, options = {}) {
    const {
      maxDocuments = this.config.maxDocuments,
      sources = Object.keys(this.config.sourceWeights),
      filters = {}
    } = options;

    const perSourceLimit = Math.ceil(maxDocuments / sources.length);
    const allResults = [];

    // Retrieve from each source
    for (const source of sources) {
      try {
        const results = await this.retrieveFromSource(query, source, {
          topK: perSourceLimit,
          filters
        });
        allResults.push(...results);
      } catch (error) {
        console.error(`[Orchestrator] Error retrieving from ${source}:`, error.message);
      }
    }

    // Deduplicate if enabled
    let documents = allResults;
    if (this.config.deduplicate) {
      documents = this.deduplicate(allResults);
    }

    // Sort by score
    documents.sort((a, b) => (b.combinedScore || b.score || 0) - (a.combinedScore || a.score || 0));

    // Limit to max documents
    documents = documents.slice(0, maxDocuments);

    this.retrieveCount++;
    return documents;
  }

  /**
   * Retrieve from a specific source
   */
  async retrieveFromSource(query, source, options) {
    // Placeholder for actual source retrieval
    // In production, this would call the appropriate search module
    const results = [];
    const { topK = 10 } = options;

    for (let i = 0; i < topK; i++) {
      results.push({
        id: `${source}_doc_${i}`,
        content: `Content from ${source} document ${i}`,
        source,
        score: Math.random() * 0.5 + 0.5,
        metadata: {
          source,
          index: i,
          timestamp: Date.now() - Math.random() * 1000000000
        }
      });
    }

    return results;
  }

  /**
   * Deduplicate documents by ID and content similarity
   */
  deduplicate(documents) {
    const seen = new Map();
    const unique = [];

    for (const doc of documents) {
      const key = doc.id || this.hash(doc.content);
      
      if (!seen.has(key)) {
        seen.set(key, doc);
        unique.push(doc);
      } else {
        // Merge scores if duplicate
        const existing = seen.get(key);
        existing.combinedScore = Math.max(
          existing.combinedScore || existing.score || 0,
          doc.combinedScore || doc.score || 0
        );
        if (!existing.sources.includes(doc.source)) {
          existing.sources = [...(existing.sources || []), doc.source];
        }
      }
    }

    return unique;
  }

  /**
   * Get orchestrator statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    return {
      type: 'orchestrator',
      retrieveCount: this.retrieveCount,
      maxDocuments: this.config.maxDocuments,
      sourceWeights: this.config.sourceWeights,
      deduplicateEnabled: this.config.deduplicate
    };
  }

  /**
   * Clear orchestrator state
   * @returns {Promise<void>}
   */
  async clear() {
    this.retrieveCount = 0;
  }

  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

module.exports = RetrievalOrchestrator;
