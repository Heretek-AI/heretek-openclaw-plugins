/**
 * Graph Search Module
 * Handles relationship-based search using knowledge graph traversal
 */

class GraphSearch {
  constructor(config = {}) {
    this.config = {
      maxDepth: config.maxDepth || 3,
      maxNodes: config.maxNodes || 100,
      relationshipWeights: config.relationshipWeights || {
        'related_to': 1.0,
        'part_of': 0.8,
        'causes': 0.9,
        'similar_to': 0.7,
        'references': 0.6
      },
      ...config
    };

    this.nodes = new Map();
    this.edges = new Map();
    this.initialized = false;
    this.searchCount = 0;
    this.indexCount = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Add a node to the graph
   * @param {object} node - Node data
   * @returns {object} Added node
   */
  addNode(node) {
    const id = node.id || this.hash(node.content);
    this.nodes.set(id, {
      id,
      content: node.content,
      metadata: node.metadata || {},
      embeddings: node.embeddings || [],
      indexedAt: Date.now()
    });
    this.indexCount++;
    return this.nodes.get(id);
  }

  /**
   * Add an edge between nodes
   * @param {string} source - Source node ID
   * @param {string} target - Target node ID
   * @param {string} relationship - Relationship type
   * @param {object} properties - Edge properties
   * @returns {object} Added edge
   */
  addEdge(source, target, relationship = 'related_to', properties = {}) {
    const edgeId = `${source}->${target}:${relationship}`;
    const edge = {
      id: edgeId,
      source,
      target,
      relationship,
      weight: this.config.relationshipWeights[relationship] || 0.5,
      properties,
      createdAt: Date.now()
    };

    if (!this.edges.has(source)) {
      this.edges.set(source, []);
    }
    this.edges.get(source).push(edge);

    return edge;
  }

  /**
   * Search the graph for related content
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Graph traversal results
   */
  async search(query, options = {}) {
    const { topK = 10, filters = {}, maxDepth = this.config.maxDepth } = options;
    const startTime = Date.now();

    // Find seed nodes matching query
    const seedNodes = this.findSeedNodes(query, filters);
    
    if (seedNodes.length === 0) {
      return [];
    }

    // Traverse graph from seed nodes
    const visited = new Set();
    const results = new Map();

    for (const seed of seedNodes) {
      this.traverseFromNode(seed.id, maxDepth, visited, results, query);
    }

    // Convert to array and sort by score
    const sortedResults = Array.from(results.values())
      .sort((a, b) => b.graphScore - a.graphScore)
      .slice(0, topK)
      .map(r => ({
        ...r,
        source: 'graph',
        searchTime: Date.now() - startTime
      }));

    this.searchCount++;
    return sortedResults;
  }

  /**
   * Find seed nodes matching a query
   */
  findSeedNodes(query, filters) {
    const queryLower = query.toLowerCase();
    const seeds = [];

    for (const [id, node] of this.nodes) {
      // Apply filters
      if (filters.type && node.metadata?.type !== filters.type) continue;
      if (filters.source && node.metadata?.source !== filters.source) continue;

      // Check content match
      const content = node.content?.toLowerCase() || '';
      const metadata = JSON.stringify(node.metadata).toLowerCase();
      
      if (content.includes(queryLower) || metadata.includes(queryLower)) {
        seeds.push({
          id,
          node,
          initialScore: this.calculateInitialMatch(node.content, query)
        });
      }
    }

    return seeds.sort((a, b) => b.initialScore - a.initialScore);
  }

  /**
   * Traverse graph from a node using BFS
   */
  traverseFromNode(nodeId, maxDepth, visited, results, query) {
    const queue = [{ nodeId, depth: 0, pathScore: 1.0, path: [nodeId] }];

    while (queue.length > 0) {
      const { nodeId: currentId, depth, pathScore, path } = queue.shift();

      if (visited.has(currentId) || depth > maxDepth) continue;
      visited.add(currentId);

      const node = this.nodes.get(currentId);
      if (!node) continue;

      // Add to results
      const existingScore = results.get(currentId)?.graphScore || 0;
      results.set(currentId, {
        id: currentId,
        content: node.content,
        graphScore: Math.max(existingScore, pathScore),
        depth,
        path,
        metadata: node.metadata
      });

      // Add neighbors to queue
      const edges = this.edges.get(currentId) || [];
      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          queue.push({
            nodeId: edge.target,
            depth: depth + 1,
            pathScore: pathScore * edge.weight * 0.9, // Decay factor
            path: [...path, edge.target]
          });
        }
      }
    }
  }

  calculateInitialMatch(content, query) {
    if (!content) return 0;
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    if (contentLower.includes(queryLower)) score += 0.5;
    
    // Check for keyword matches
    const queryWords = queryLower.split(/\s+/);
    for (const word of queryWords) {
      if (contentLower.includes(word)) score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Index a document in the graph
   * @param {object} document - Document to index
   * @returns {Promise<object>} Indexing result
   */
  async index(document) {
    const node = this.addNode(document);
    
    // Auto-create relationships based on metadata
    if (document.metadata?.relatedTo) {
      for (const relatedId of document.metadata.relatedTo) {
        this.addEdge(node.id, relatedId, 'related_to');
      }
    }
    
    if (document.metadata?.partOf) {
      this.addEdge(node.id, document.metadata.partOf, 'part_of');
    }

    return {
      id: node.id,
      nodeId: node.id,
      indexed: true,
      timestamp: Date.now()
    };
  }

  /**
   * Get graph statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    let totalEdges = 0;
    const relationshipCounts = new Map();

    for (const edges of this.edges.values()) {
      totalEdges += edges.length;
      for (const edge of edges) {
        relationshipCounts.set(
          edge.relationship,
          (relationshipCounts.get(edge.relationship) || 0) + 1
        );
    }
    }

    return {
      type: 'graph',
      nodeCount: this.nodes.size,
      edgeCount: totalEdges,
      indexCount: this.indexCount,
      searchCount: this.searchCount,
      relationshipCounts: Object.fromEntries(relationshipCounts),
      maxDepth: this.config.maxDepth
    };
  }

  /**
   * Clear graph
   * @returns {Promise<void>}
   */
  async clear() {
    this.nodes.clear();
    this.edges.clear();
    this.indexCount = 0;
    this.searchCount = 0;
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

module.exports = GraphSearch;
