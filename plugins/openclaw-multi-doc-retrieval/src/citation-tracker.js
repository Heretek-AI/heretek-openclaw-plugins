/**
 * Citation Tracker Module
 * Tracks and manages document citations in retrieved content
 */

const { LRU } = require('lru-cache');

class CitationTracker {
  constructor(config = {}) {
    this.config = {
      maxCitations: config.maxCitations || 50,
      cacheSize: config.cacheSize || 200,
      includePageNumbers: config.includePageNumbers ?? false,
      citationStyle: config.citationStyle || 'numeric',
      ...config
    };

    this.citations = new Map();
    this.cache = new LRU({ max: this.config.cacheSize });
    this.initialized = false;
    this.trackedCount = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Track citations for retrieved documents
   * @param {Array<object>} documents - Retrieved documents
   * @param {string} query - Original query
   * @returns {Promise<object>} Citation data
   */
  async track(documents, query) {
    const cacheKey = this.hash(`${query}:${documents.map(d => d.id).join(',')}`);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const citations = [];
    const citationMap = new Map();

    for (let i = 0; i < documents.length && i < this.config.maxCitations; i++) {
      const doc = documents[i];
      const citationId = i + 1;
      
      const citation = {
        id: citationId,
        documentId: doc.id,
        source: doc.metadata?.source || 'unknown',
        type: doc.metadata?.type || 'document',
        title: doc.metadata?.title || `Document ${citationId}`,
        relevanceScore: doc.combinedScore || doc.score || 0,
        timestamp: doc.metadata?.timestamp || Date.now()
      };

      if (this.config.includePageNumbers && doc.metadata?.page) {
        citation.page = doc.metadata.page;
      }

      citations.push(citation);
      citationMap.set(doc.id, citationId);
      this.citations.set(citationId, citation);
    }

    this.trackedCount++;
    const result = { citations, citationMap: Object.fromEntries(citationMap) };
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Get citation by ID
   * @param {number} citationId - Citation ID
   * @returns {object|null} Citation data
   */
  getCitation(citationId) {
    return this.citations.get(citationId) || null;
  }

  /**
   * Format citations in specified style
   * @param {string} style - Citation style (numeric, apa, mla)
   * @returns {string} Formatted citations
   */
  formatCitations(style = this.config.citationStyle) {
    const citations = Array.from(this.citations.values());
    
    switch (style) {
      case 'numeric':
        return citations.map((c, i) => `[${i + 1}] ${c.title}. Source: ${c.source}`).join('\n');
      
      case 'apa':
        return citations.map(c => 
          `${c.title}. (${new Date(c.timestamp).getFullYear()}). ${c.source}.`
        ).join('\n');
      
      case 'mla':
        return citations.map(c => 
          `"${c.title}". ${c.source}, ${new Date(c.timestamp).getFullYear()}.`
        ).join('\n');
      
      default:
        return citations.map(c => JSON.stringify(c)).join('\n');
    }
  }

  /**
   * Get all citations
   * @returns {Array<object>} All tracked citations
   */
  getAllCitations() {
    return Array.from(this.citations.values());
  }

  /**
   * Get citation statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    return {
      type: 'citations',
      trackedCount: this.trackedCount,
      activeCitations: this.citations.size,
      cacheSize: this.cache.size,
      maxCitations: this.config.maxCitations,
      citationStyle: this.config.citationStyle
    };
  }

  /**
   * Clear all citations
   * @returns {Promise<void>}
   */
  async clear() {
    this.citations.clear();
    this.cache.clear();
    this.trackedCount = 0;
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

module.exports = CitationTracker;
