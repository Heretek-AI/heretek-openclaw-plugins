/**
 * Graph RAG Algorithm
 * Combines entity extraction, relationship mapping, and graph traversal for RAG
 */

import EntityExtractor from '../extractors/entity-extractor.js';
import RelationshipMapper from '../extractors/relationship-mapper.js';
import CommunityDetector from '../communities/community-detector.js';
import GraphTraverser from '../traversal/graph-traverser.js';

class GraphRAG {
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
      ...config
    };

    this.entityExtractor = new EntityExtractor({
      entityTypes: this.config.entityTypes
    });

    this.relationshipMapper = new RelationshipMapper({
      relationshipTypes: this.config.relationshipTypes
    });

    this.communityDetector = new CommunityDetector({
      resolution: this.config.communityResolution
    });

    this.graphTraverser = new GraphTraverser({
      maxHops: this.config.maxHops,
      relationshipWeights: this.config.relationshipWeights
    });

    this.documents = new Map();
    this.graph = {
      nodes: [],
      edges: []
    };
    this.entities = new Map();
    this.relationships = new Map();
    this.communities = [];

    this.initialized = false;
    this.processingCount = 0;
  }

  async initialize() {
    await this.entityExtractor.initialize();
    await this.relationshipMapper.initialize();
    await this.communityDetector.initialize();
    await this.graphTraverser.initialize();
    this.initialized = true;
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

    const { id, content, metadata = {} } = document;
    const docId = id || `doc-${Date.now()}`;

    // Extract entities
    const entities = await this.entityExtractor.extract(content);

    // Map relationships between entities
    const relationships = await this.relationshipMapper.map(entities, content);

    // Build graph nodes from entities
    const nodes = entities.map(entity => ({
      id: entity.id,
      type: entity.type,
      text: entity.text,
      content: entity.context,
      metadata: {
        ...metadata,
        entityType: entity.type,
        confidence: entity.confidence,
        sourceDocument: docId
      }
    }));

    // Build graph edges from relationships
    const edges = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      relationship: rel.type,
      weight: rel.confidence,
      metadata: {
        evidence: rel.evidence,
        direction: rel.direction
      }
    }));

    // Add to graph
    this.graph.nodes.push(...nodes);
    this.graph.edges.push(...edges);

    // Add to traverser
    for (const node of nodes) {
      this.graphTraverser.addNode(node);
    }
    for (const edge of edges) {
      this.graphTraverser.addEdge(edge.source, edge.target, edge.relationship, edge.metadata);
    }

    // Store document
    this.documents.set(docId, {
      ...document,
      id: docId,
      entities: entities.map(e => e.id),
      relationships: relationships.map(r =>
        this.relationshipMapper.getRelationshipId(r.source, r.target, r.type)
      ),
      processedAt: Date.now()
    });

    // Update entities and relationships maps
    for (const entity of entities) {
      this.entities.set(entity.id, entity);
    }
    for (const rel of relationships) {
      const relId = this.relationshipMapper.getRelationshipId(rel.source, rel.target, rel.type);
      this.relationships.set(relId, rel);
    }

    this.processingCount++;

    return {
      documentId: docId,
      entities: entities,
      relationships: relationships,
      entitiesFound: entities.length,
      relationshipsFound: relationships.length,
      nodesAdded: nodes.length,
      edgesAdded: edges.length
    };
  }

  /**
   * Process multiple documents
   * @param {Array<object>} documents - Documents to process
   * @returns {Promise<object>} Batch processing result
   */
  async processDocuments(documents) {
    const results = await Promise.all(
      documents.map(doc => 
        this.processDocument(doc).catch(err => ({
          error: err.message,
          documentId: doc.id
        }))
      )
    );

    const successfulResults = results.filter(r => !r.error);
    const totalEntities = successfulResults.reduce((sum, r) => sum + (r.entities?.length || 0), 0);
    const totalRelationships = successfulResults.reduce((sum, r) => sum + (r.relationships?.length || 0), 0);

    return {
      processed: successfulResults.length,
      failed: results.filter(r => r.error).length,
      documents: successfulResults,
      total: documents.length,
      totalEntities,
      totalRelationships
    };
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

    const communities = await this.communityDetector.detect(
      this.graph,
      options
    );

    this.communities = communities;

    return {
      communities,
      count: communities.length,
      stats: {
        communityCount: communities.length
      }
    };
  }

  /**
   * Perform graph-based retrieval for RAG
   * @param {string} query - Query string
   * @param {object} options - Retrieval options
   * @returns {Promise<object>} Retrieval results with reasoning chains
   */
  async retrieve(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      topK = this.config.topK,
      minScore = this.config.minScore,
      enableMultiHop = this.config.enableMultiHopReasoning,
      maxHops = this.config.maxHops,
      includeCommunities = this.config.enableCommunityDetection
    } = options;

    // Extract entities from query
    const queryEntities = await this.entityExtractor.extract(query);

    // Find seed nodes
    const seedNodes = this.findSeedNodes(query, queryEntities);

    if (seedNodes.length === 0) {
      return {
        nodes: [],
        results: [],
        seedNodes: [],
        reasoningChains: [],
        communities: [],
        context: '',
        metadata: {
          query,
          seedNodesFound: 0,
          message: 'No matching seed nodes found'
        }
      };
    }

    // Perform multi-hop traversal
    let reasoningChains = [];
    if (enableMultiHop) {
      const traversalResults = await this.graphTraverser.traverse(seedNodes, {
        maxHops,
        maxPaths: topK * 2
      });

      reasoningChains = traversalResults
        .filter(path => path.score >= minScore)
        .map(path => ({
          path: path.path.map(nodeId => this.graphTraverser.getNode(nodeId)),
          relationships: path.relationships,
          score: path.score,
          hops: path.hops,
          summary: this.graphTraverser.generateReasoningSummary(path)
        }));
    }

    // Detect communities if enabled
    let communities = [];
    if (includeCommunities) {
      communities = await this.communityDetector.detect(this.graph, {
        minCommunitySize: 2
      });
    }

    // Compile results
    const compiledResults = this.compileResults(seedNodes, reasoningChains, topK);
    const nodes = compiledResults.nodes || [];

    return {
      nodes,
      results: nodes,
      context: nodes.map(r => r.content).join('\n'),
      seedNodes: seedNodes,
      reasoningChains: reasoningChains.slice(0, topK),
      communities: communities.slice(0, 5), // Top 5 communities
      metadata: {
        query,
        seedNodesFound: seedNodes.length,
        totalPaths: reasoningChains.length,
        communitiesDetected: communities.length,
        processingTime: Date.now()
      }
    };
  }

  /**
   * Find seed nodes matching a query
   */
  findSeedNodes(query, queryEntities) {
    const seedIds = new Set();

    // Match by entity IDs
    for (const entity of queryEntities) {
      if (this.graphTraverser.getNode(entity.id)) {
        seedIds.add(entity.id);
      }
    }

    // Match by text search in graph
    const queryLower = query.toLowerCase();
    for (const node of this.graphTraverser.getAllNodes()) {
      const content = (node.content || '').toLowerCase();
      const text = (node.text || '').toLowerCase();

      if (content.includes(queryLower) || text.includes(queryLower)) {
        seedIds.add(node.id);
      }
    }

    return Array.from(seedIds);
  }

  /**
   * Compile final results from retrieval
   */
  compileResults(seedNodes, reasoningChains, topK) {
    const resultMap = new Map();

    // Add seed nodes
    for (const nodeId of seedNodes) {
      const node = this.graphTraverser.getNode(nodeId);
      if (node && !resultMap.has(nodeId)) {
        resultMap.set(nodeId, {
          id: nodeId,
          type: node.type || 'unknown',
          content: node.content || node.text,
          score: 1.0,
          isSeed: true,
          metadata: node.metadata
        });
      }
    }

    // Add nodes from reasoning chains
    for (const chain of reasoningChains) {
      if (!chain.path || !Array.isArray(chain.path)) continue;
      for (const node of chain.path) {
        if (node && !resultMap.has(node.id)) {
          resultMap.set(node.id, {
            id: node.id,
            type: node.type || 'unknown',
            content: node.content || node.text,
            score: chain.score,
            isSeed: false,
            inChain: true,
            metadata: node.metadata
          });
        }
      }
    }

    // Convert to array and sort
    const nodes = Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      nodes,
      reasoningChains
    };
  }

  /**
   * Generate RAG context from retrieval results
   * @param {string} query - Original query
   * @param {object} retrieveOptions - Options for retrieval
   * @returns {Promise<object>} RAG-ready context
   */
  async generateRAGContext(query, retrieveOptions = {}) {
    const retrieval = await this.retrieve(query, retrieveOptions);

    // Build context from results
    const contextParts = [];

    // Add result contents
    for (const result of retrieval.results) {
      if (result.content) {
        contextParts.push(`[${result.type}]: ${result.content}`);
      }
    }

    // Add reasoning summaries
    for (const chain of retrieval.reasoningChains) {
      if (chain.summary) {
        contextParts.push(`Reasoning: ${chain.summary}`);
      }
    }

    // Add community info
    if (retrieval.communities.length > 0) {
      const communitySummary = retrieval.communities
        .slice(0, 3)
        .map(c => `Community ${c.id} (${c.size} members)`);
      contextParts.push(`Knowledge Clusters: ${communitySummary.join('; ')}`);
    }

    return {
      query,
      context: contextParts.join('\n\n'),
      documents: retrieval.results || [],
      results: retrieval.results,
      reasoningChains: retrieval.reasoningChains,
      metadata: retrieval.metadata
    };
  }

  /**
   * Get graph statistics
   */
  async getStats() {
    const entityStats = this.entityExtractor.getStats();
    const relationshipStats = this.relationshipMapper.getStats();
    const communityStats = this.communityDetector.getStats();
    const traversalStats = this.graphTraverser.getStats();

    return {
      documents: this.documents.size,
      processingCount: this.processingCount,
      graph: {
        nodes: this.graph.nodes.length,
        edges: this.graph.edges.length,
        communities: this.communities
      },
      entities: this.entities,
      relationships: this.relationships,
      communities: this.communities,
      entityExtraction: entityStats,
      relationshipMapping: relationshipStats,
      communityDetection: communityStats,
      graphTraversal: traversalStats
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.documents.clear();
    this.graph = { nodes: [], edges: [] };
    this.entities.clear();
    this.relationships.clear();
    this.communities = [];
    this.entityExtractor.clear();
    this.relationshipMapper.clear();
    this.communityDetector.clear();
    this.graphTraverser.clear();
    this.processingCount = 0;
  }

  /**
   * Export graph in standard format
   */
  exportGraph() {
    return {
      nodes: this.graph.nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.text,
        properties: n.metadata
      })),
      edges: this.graph.edges.map(e => ({
        source: e.source,
        target: e.target,
        relationship: e.relationship,
        weight: e.weight,
        properties: e.metadata
      }))
    };
  }

  /**
   * Import graph from standard format
   */
  importGraph(graphData) {
    this.graph.nodes = graphData.nodes || [];
    this.graph.edges = graphData.edges || [];

    // Rebuild traverser
    for (const node of this.graph.nodes) {
      this.graphTraverser.addNode(node);
    }
    for (const edge of this.graph.edges) {
      this.graphTraverser.addEdge(
        edge.source,
        edge.target,
        edge.relationship,
        edge.properties
      );
    }
  }
}

export default GraphRAG;
