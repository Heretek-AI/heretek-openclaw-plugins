/**
 * Cross-Reference Linker Module
 * Creates and manages cross-references between retrieved documents
 */

const { LRU } = require('lru-cache');

class CrossReferenceLinker {
  constructor(config = {}) {
    this.config = {
      maxReferences: config.maxReferences || 10,
      minConfidence: config.minConfidence || 0.3,
      cacheSize: config.cacheSize || 500,
      autoLinkThreshold: config.autoLinkThreshold || 0.7,
      ...config
    };

    this.references = new Map(); // docId -> [referenceIds]
    this.referenceGraph = new Map(); // docId -> Set<linkedDocId>
    this.cache = new LRU({ max: this.config.cacheSize });
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Create cross-references for an indexed document
   * @param {object} ids - Document IDs from different indices
   * @returns {object} Reference mapping
   */
  createReferences({ documentId, vectorId, keywordId, graphId }) {
    const refs = [];
    
    // Link different index representations of the same document
    if (vectorId) refs.push({ type: 'vector', id: vectorId });
    if (keywordId) refs.push({ type: 'keyword', id: keywordId });
    if (graphId) refs.push({ type: 'graph', id: graphId });

    this.references.set(documentId, refs);

    // Create bidirectional links
    for (const ref of refs) {
      if (!this.referenceGraph.has(ref.id)) {
        this.referenceGraph.set(ref.id, new Set());
      }
      this.referenceGraph.get(ref.id).add(documentId);
    }

    return { documentId, references: refs };
  }

  /**
   * Add cross-references to search results
   * @param {Array<object>} results - Search results
   * @returns {Promise<Array<object>>} Results with cross-references
   */
  async addCrossReferences(results) {
    return results.map(result => {
      const cached = this.cache.get(result.id);
      if (cached) {
        return { ...result, crossReferences: cached };
      }

      const crossRefs = this.findRelatedReferences(result.id);
      this.cache.set(result.id, crossRefs);

      return {
        ...result,
        crossReferences: crossRefs,
        hasCrossReferences: crossRefs.length > 0
      };
    });
  }

  /**
   * Find related references for a document
   */
  findRelatedReferences(docId, maxResults = this.config.maxReferences) {
    const related = [];
    const visited = new Set();

    // Get direct references
    const directRefs = this.references.get(docId) || [];
    for (const ref of directRefs) {
      if (!visited.has(ref.id)) {
        visited.add(ref.id);
        related.push({
          id: ref.id,
          type: ref.type,
          relationship: 'same_document',
          confidence: 1.0
        });
      }
    }

    // Get linked documents from graph
    const linkedDocs = this.referenceGraph.get(docId) || new Set();
    for (const linkedId of linkedDocs) {
      if (!visited.has(linkedId) && related.length < maxResults) {
        visited.add(linkedId);
        const linkedRefs = this.references.get(linkedId) || [];
        
        related.push({
          id: linkedId,
          type: 'document',
          relationship: 'linked',
          confidence: this.calculateLinkConfidence(docId, linkedId),
          metadata: {
            referenceCount: linkedRefs.length
          }
        });
      }
    }

    // Sort by confidence and limit
    return related
      .filter(r => r.confidence >= this.config.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);
  }

  /**
   * Calculate confidence score for a link
   */
  calculateLinkConfidence(docId, linkedId) {
    // Base confidence
    let confidence = 0.5;

    // Check for shared reference types
    const docRefs = this.references.get(docId) || [];
    const linkedRefs = this.references.get(linkedId) || [];
    
    const docTypes = new Set(docRefs.map(r => r.type));
    const linkedTypes = new Set(linkedRefs.map(r => r.type));
    
    // Shared types increase confidence
    const sharedTypes = [...docTypes].filter(t => linkedTypes.has(t)).length;
    confidence += sharedTypes * 0.1;

    // Bidirectional links are stronger
    if (this.referenceGraph.get(linkedId)?.has(docId)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find documents that reference a given document
   * @param {string} docId - Document ID
   * @returns {Array<object>} Referencing documents
   */
  findIncomingReferences(docId) {
    const incoming = [];

    for (const [sourceId, targets] of this.referenceGraph) {
      if (targets.has(docId)) {
        incoming.push({
          sourceId,
          confidence: this.calculateLinkConfidence(sourceId, docId)
        });
      }
    }

    return incoming.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get reference statistics
   * @returns {object} Statistics
   */
  getStats() {
    let totalRefs = 0;
    let totalLinks = 0;

    for (const refs of this.references.values()) {
      totalRefs += refs.length;
    }

    for (const links of this.referenceGraph.values()) {
      totalLinks += links.size;
    }

    return {
      documentCount: this.references.size,
      totalReferences: totalRefs,
      totalLinks,
      cacheSize: this.cache.size,
      avgRefsPerDoc: this.references.size > 0 ? totalRefs / this.references.size : 0
    };
  }

  /**
   * Clear all references
   * @returns {Promise<void>}
   */
  async clear() {
    this.references.clear();
    this.referenceGraph.clear();
    this.cache.clear();
  }
}

module.exports = CrossReferenceLinker;
