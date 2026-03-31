/**
 * OpenClaw GraphRAG Enhancements Plugin
 * Graph-based Retrieval Augmented Generation with entity extraction,
 * community detection, and multi-hop reasoning
 */

const GraphRAG = require('./algorithms/graph-rag');
const EntityExtractor = require('./extractors/entity-extractor');
const RelationshipMapper = require('./extractors/relationship-mapper');
const CommunityDetector = require('./communities/community-detector');
const GraphTraverser = require('./traversal/graph-traverser');

class GraphRAGEnhancementsPlugin {
  constructor(config = {}) {
    this.config = {
      entityTypes: config.entityTypes || [
        'person', 'organization', 'location', 'concept', 'event'
      ],
      relationshipTypes: config.relationshipTypes || [
        'related_to', 'part_of', 'causes', 'similar_to', 'references',
        'located_in', 'member_of', 'works_at', 'created_by', 'owns'
      ],
      communityResolution: config.communityResolution || 0.5,
      maxHops: config.maxHops || 3,
      topK: config.topK || 10,
      minScore: config.minScore || 0.3,
      enableCommunityDetection: config.enableCommunityDetection ?? true,
      enableMultiHopReasoning: config.enableMultiHopReasoning ?? true,
      hybridSearchIntegration: config.hybridSearchIntegration ?? true,
      ...config
    };

    this.graphRAG = new GraphRAG(this.config);
    this.hybridSearchPlugin = null;
    this.initialized = false;
  }

  async initialize() {
    await this.graphRAG.initialize();
    this.initialized = true;
    console.log('[GraphRAG] Plugin initialized');
  }

  /**
   * Integrate with hybrid search plugin
   * @param {object} hybridSearchPlugin - Instance of HybridSearchPlugin
   */
  integrateWithHybridSearch(hybridSearchPlugin) {
    this.hybridSearchPlugin = hybridSearchPlugin;
    console.log('[GraphRAG] Integrated with Hybrid Search Plugin');
  }

  /**
   * Process a document for GraphRAG
   * @param {object} document - Document to process
   * @returns {Promise<object>} Processing result
   */
  async processDocument(document) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.processDocument(document);
  }

  /**
   * Process multiple documents
   * @param {Array<object>} documents - Documents to process
   * @returns {Promise<object>} Batch processing result
   */
  async processDocuments(documents) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.processDocuments(documents);
  }

  /**
   * Perform graph-based retrieval
   * @param {string} query - Query string
   * @param {object} options - Retrieval options
   * @returns {Promise<object>} Retrieval results
   */
  async retrieve(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.retrieve(query, options);
  }

  /**
   * Generate RAG context for LLM
   * @param {string} query - Query string
   * @param {object} options - Context generation options
   * @returns {Promise<object>} RAG-ready context
   */
  async generateContext(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.generateRAGContext(query, options);
  }

  /**
   * Detect communities in the knowledge graph
   * @param {object} options - Detection options
   * @returns {Promise<Array>} Detected communities
   */
  async detectCommunities(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.detectCommunities(options);
  }

  /**
   * Perform multi-hop reasoning query
   * @param {string} query - Query string
   * @param {object} options - Reasoning options
   * @returns {Promise<object>} Reasoning results
   */
  async reason(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { seedNodes = [], maxHops = this.config.maxHops } = options;
    return this.graphRAG.graphTraverser.reason(query, { seedNodes, maxHops });
  }

  /**
   * Extract entities from text
   * @param {string} text - Text to extract entities from
   * @param {object} options - Extraction options
   * @returns {Promise<Array>} Extracted entities
   */
  async extractEntities(text, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.entityExtractor.extract(text, options);
  }

  /**
   * Map relationships between entities
   * @param {Array} entities - Entities to map relationships between
   * @param {string} text - Source text
   * @param {object} options - Mapping options
   * @returns {Promise<Array>} Mapped relationships
   */
  async mapRelationships(entities, text, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.relationshipMapper.map(entities, text, options);
  }

  /**
   * Perform hybrid search with GraphRAG integration
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>} Hybrid search results with graph reasoning
   */
  async hybridSearch(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Get GraphRAG results
    const graphResults = await this.retrieve(query, {
      topK: options.topK || 5,
      enableMultiHop: true
    });

    // If hybrid search plugin is integrated, combine results
    if (this.hybridSearchPlugin) {
      const hybridResults = await this.hybridSearchPlugin.search(query, {
        topK: options.topK || 10,
        weights: {
          vector: options.vectorWeight || 0.4,
          keyword: options.keywordWeight || 0.3,
          graph: options.graphWeight || 0.3
        }
      });

      return {
        hybrid: hybridResults,
        graphRAG: graphResults,
        combined: this.combineResults(hybridResults, graphResults)
      };
    }

    return {
      graphRAG: graphResults,
      combined: graphResults.results
    };
  }

  /**
   * Combine hybrid search and GraphRAG results
   */
  combineResults(hybridResults, graphResults) {
    const resultIdMap = new Map();

    // Add hybrid results
    for (const result of hybridResults) {
      resultIdMap.set(result.id, {
        ...result,
        graphEnhanced: false
      });
    }

    // Add graph results with enhancement
    for (const result of graphResults.results) {
      if (resultIdMap.has(result.id)) {
        const existing = resultIdMap.get(result.id);
        existing.graphEnhanced = true;
        existing.reasoningChains = graphResults.reasoningChains;
      } else {
        resultIdMap.set(result.id, {
          ...result,
          graphEnhanced: true,
          reasoningChains: graphResults.reasoningChains
        });
      }
    }

    return Array.from(resultIdMap.values())
      .sort((a, b) => (b.combinedScore || b.score || 0) - (a.combinedScore || a.score || 0));
  }

  /**
   * Get plugin statistics
   */
  async getStats() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.graphRAG.getStats();
  }

  /**
   * Export graph data
   */
  exportGraph() {
    return this.graphRAG.exportGraph();
  }

  /**
   * Import graph data
   */
  importGraph(graphData) {
    return this.graphRAG.importGraph(graphData);
  }

  /**
   * Clear all data
   */
  async clear() {
    await this.graphRAG.clear();
  }
}

module.exports = GraphRAGEnhancementsPlugin;
module.exports.GraphRAG = GraphRAG;
module.exports.EntityExtractor = EntityExtractor;
module.exports.RelationshipMapper = RelationshipMapper;
module.exports.CommunityDetector = CommunityDetector;
module.exports.GraphTraverser = GraphTraverser;
