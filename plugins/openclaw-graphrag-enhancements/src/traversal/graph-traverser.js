/**
 * Graph Traverser for GraphRAG
 * Implements multi-hop reasoning through graph traversal
 */

class GraphTraverser {
  constructor(config = {}) {
    this.config = {
      maxHops: config.maxHops || 3,
      maxPaths: config.maxPaths || 50,
      minPathScore: config.minPathScore || 0.3,
      beamWidth: config.beamWidth || 10,
      relationshipWeights: config.relationshipWeights || {
        'related_to': 1.0,
        'part_of': 0.8,
        'causes': 0.9,
        'similar_to': 0.7,
        'references': 0.6,
        'located_in': 0.7,
        'member_of': 0.8,
        'works_at': 0.85,
        'created_by': 0.9,
        'owns': 0.75
      },
      ...config
    };

    this.nodes = new Map();
    this.edges = new Map();
    this.traversalCount = 0;
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Perform multi-hop traversal from seed nodes
   * @param {Array|string} seeds - Seed node IDs or single node ID
   * @param {object} options - Traversal options
   * @returns {Promise<Array>} Paths found through traversal
   */
  async traverse(seeds, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      maxHops = this.config.maxHops,
      maxPaths = this.config.maxPaths,
      minPathScore = this.config.minPathScore,
      beamWidth = this.config.beamWidth,
      targetNode = null,
      relationshipFilter = null
    } = options;

    const seedArray = Array.isArray(seeds) ? seeds : [seeds];
    const paths = [];

    // Perform traversal from each seed
    for (const seedId of seedArray) {
      const seedPaths = this.traverseFromSeed(seedId, {
        maxHops,
        maxPaths: Math.ceil(maxPaths / seedArray.length),
        minPathScore,
        beamWidth,
        targetNode,
        relationshipFilter
      });
      
      paths.push(...seedPaths);
    }

    // Sort by score and limit
    paths.sort((a, b) => b.score - a.score);
    const result = paths.slice(0, maxPaths);

    this.traversalCount++;
    return result;
  }

  /**
   * Traverse from a single seed node using beam search
   */
  traverseFromSeed(seedId, options) {
    const { maxHops, maxPaths, minPathScore, beamWidth, targetNode, relationshipFilter } = options;
    
    const paths = [];
    const beam = [{
      currentNode: seedId,
      path: [seedId],
      score: 1.0,
      relationships: [],
      depth: 0
    }];

    const visited = new Set();

    while (beam.length > 0 && paths.length < maxPaths) {
      // Sort beam by score and take top beamWidth
      beam.sort((a, b) => b.score - a.score);
      const currentBeam = beam.slice(0, beamWidth);
      beam.length = 0;

      for (const state of currentBeam) {
        const { currentNode, path, score, relationships, depth } = state;

        // Check if we've reached max depth
        if (depth >= maxHops) {
          if (score >= minPathScore) {
            paths.push({
              path,
              relationships,
              score,
              length: path.length,
              hops: depth
            });
          }
          continue;
        }

        // Get neighbors
        const neighbors = this.getNeighbors(currentNode, relationshipFilter);
        
        for (const { target, relationship, weight } of neighbors) {
          // Skip visited nodes (avoid cycles)
          if (visited.has(`${currentNode}->${target}`)) continue;
          
          const newPath = [...path, target];
          const newScore = score * weight * this.decayFactor(depth);
          const newRelationships = [...relationships, {
            from: currentNode,
            to: target,
            type: relationship,
            weight
          }];

          // Check if we reached target
          if (targetNode && target === targetNode) {
            paths.push({
              path: newPath,
              relationships: newRelationships,
              score: newScore,
              length: newPath.length,
              hops: depth + 1,
              isTargetPath: true
            });
            continue;
          }

          // Add to beam for further exploration
          beam.push({
            currentNode: target,
            path: newPath,
            score: newScore,
            relationships: newRelationships,
            depth: depth + 1
          });

          visited.add(`${currentNode}->${target}`);
        }

        // Mark current node as processed
        visited.add(currentNode);
      }
    }

    return paths;
  }

  /**
   * Get neighbors of a node with optional relationship filter
   */
  getNeighbors(nodeId, relationshipFilter = null) {
    const edges = this.edges.get(nodeId) || [];
    const neighbors = [];

    for (const edge of edges) {
      if (!relationshipFilter || edge.relationship === relationshipFilter) {
        neighbors.push({
          target: edge.target,
          relationship: edge.relationship,
          weight: edge.weight || this.config.relationshipWeights[edge.relationship] || 0.5
        });
      }
    }

    return neighbors;
  }

  /**
   * Apply decay factor based on depth
   */
  decayFactor(depth) {
    // Exponential decay with depth
    return Math.pow(0.9, depth);
  }

  /**
   * Find shortest path between two nodes using BFS
   */
  async findShortestPath(sourceId, targetId, options = {}) {
    const { maxHops = this.config.maxHops, relationshipFilter = null } = options;

    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }

    const queue = [{
      node: sourceId,
      path: [sourceId],
      relationships: [],
      depth: 0
    }];

    const visited = new Set([sourceId]);

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.node === targetId) {
        return {
          path: current.path,
          relationships: current.relationships,
          length: current.path.length,
          hops: current.depth,
          score: this.calculatePathScore(current.relationships)
        };
      }

      if (current.depth >= maxHops) continue;

      const neighbors = this.getNeighbors(current.node, relationshipFilter);
      for (const { target, relationship, weight } of neighbors) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push({
            node: target,
            path: [...current.path, target],
            relationships: [...current.relationships, {
              from: current.node,
              to: target,
              type: relationship,
              weight
            }],
            depth: current.depth + 1
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Find all paths between two nodes within hop limit
   */
  async findAllPaths(sourceId, targetId, options = {}) {
    const { maxHops = this.config.maxHops, maxPaths = 20, relationshipFilter = null } = options;

    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return [];
    }

    const paths = [];
    const queue = [{
      node: sourceId,
      path: [sourceId],
      relationships: [],
      depth: 0
    }];

    while (queue.length > 0 && paths.length < maxPaths) {
      const current = queue.shift();

      if (current.node === targetId) {
        paths.push({
          path: current.path,
          relationships: current.relationships,
          length: current.path.length,
          hops: current.depth,
          score: this.calculatePathScore(current.relationships)
        });
        continue;
      }

      if (current.depth >= maxHops) continue;

      const neighbors = this.getNeighbors(current.node, relationshipFilter);
      for (const { target, relationship, weight } of neighbors) {
        if (!current.path.includes(target)) { // Avoid cycles
          queue.push({
            node: target,
            path: [...current.path, target],
            relationships: [...current.relationships, {
              from: current.node,
              to: target,
              type: relationship,
              weight
            }],
            depth: current.depth + 1
          });
        }
      }
    }

    return paths.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate path score based on relationships
   */
  calculatePathScore(relationships) {
    if (relationships.length === 0) return 0;

    let score = 1.0;
    for (const rel of relationships) {
      score *= rel.weight;
    }

    // Apply length penalty
    score *= Math.pow(0.95, relationships.length - 1);

    return score;
  }

  /**
   * Perform reasoning query - find connections relevant to a query
   */
  async reason(query, options = {}) {
    const {
      seedNodes = [],
      maxHops = this.config.maxHops,
      maxResults = 10
    } = options;

    // Find seed nodes matching query
    const matchedSeeds = seedNodes.length > 0 
      ? seedNodes 
      : this.findNodesByQuery(query);

    if (matchedSeeds.length === 0) {
      return { results: [], reasoning: 'No seed nodes found for query' };
    }

    // Traverse from seeds
    const paths = await this.traverse(matchedSeeds, { maxHops });

    // Extract reasoning chains
    const reasoningChains = paths.map(path => ({
      chain: path.path.map(nodeId => this.nodes.get(nodeId)),
      relationships: path.relationships,
      score: path.score,
      hops: path.hops,
      summary: this.generateReasoningSummary(path)
    }));

    return {
      results: reasoningChains.slice(0, maxResults),
      totalPaths: paths.length,
      seedNodes: matchedSeeds
    };
  }

  /**
   * Find nodes matching a query
   */
  findNodesByQuery(query) {
    const queryLower = query.toLowerCase();
    const matches = [];

    for (const [id, node] of this.nodes) {
      const content = (node.content || '').toLowerCase();
      const metadata = JSON.stringify(node.metadata || {}).toLowerCase();

      if (content.includes(queryLower) || metadata.includes(queryLower)) {
        matches.push(id);
      }
    }

    return matches;
  }

  /**
   * Generate human-readable summary of a reasoning path
   */
  generateReasoningSummary(path) {
    const parts = [];
    
    for (let i = 0; i < path.relationships.length; i++) {
      const rel = path.relationships[i];
      const fromNode = this.nodes.get(rel.from);
      const toNode = this.nodes.get(rel.to);
      
      const fromText = fromNode?.text || fromNode?.content?.substring(0, 30) || rel.from;
      const toText = toNode?.text || toNode?.content?.substring(0, 30) || rel.to;
      
      parts.push(`${fromText} --[${rel.type}]--> ${toText}`);
    }

    return parts.join(' → ');
  }

  /**
   * Add a node to the graph
   */
  addNode(node) {
    const id = node.id || this.hash(node.content || '');
    this.nodes.set(id, {
      id,
      content: node.content,
      text: node.text,
      metadata: node.metadata || {},
      indexedAt: Date.now()
    });
    return id;
  }

  /**
   * Add an edge to the graph
   */
  addEdge(source, target, relationship = 'related_to', properties = {}) {
    const edge = {
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
   * Get node by ID
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Clear graph
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.traversalCount = 0;
  }

  /**
   * Get traversal statistics
   */
  getStats() {
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
      nodeCount: this.nodes.size,
      edgeCount: totalEdges,
      traversalCount: this.traversalCount,
      relationshipCounts: Object.fromEntries(relationshipCounts),
      maxHops: this.config.maxHops
    };
  }

  /**
   * Simple hash function for node IDs
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'node-' + Math.abs(hash).toString(36);
  }
}

export default GraphTraverser;
