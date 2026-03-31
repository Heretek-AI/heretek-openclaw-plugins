/**
 * Community Detector for GraphRAG
 * Implements community detection algorithms for knowledge clustering
 * Uses Louvain-style modularity optimization for community discovery
 */

class CommunityDetector {
  constructor(config = {}) {
    this.config = {
      resolution: config.resolution || 0.5,
      minCommunitySize: config.minCommunitySize || 2,
      maxIterations: config.maxIterations || 100,
      convergenceThreshold: config.convergenceThreshold || 0.001,
      ...config
    };

    this.communities = new Map();
    this.nodeAssignments = new Map();
    this.detectionCount = 0;
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Detect communities in a graph
   * @param {object} graph - Graph with nodes and edges
   * @param {object} options - Detection options
   * @returns {Promise<Array>} Array of detected communities
   */
  async detect(graph, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      resolution = this.config.resolution,
      minCommunitySize = this.config.minCommunitySize,
      maxIterations = this.config.maxIterations,
      convergenceThreshold = this.config.convergenceThreshold
    } = options;

    const { nodes, edges } = this.buildGraphStructure(graph);
    
    if (nodes.length === 0) {
      return [];
    }

    // Initialize each node in its own community
    this.initializeCommunities(nodes);

    // Run Louvain-style optimization
    let modularity = this.calculateModularity(nodes, edges, resolution);
    let iteration = 0;
    let improved = true;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      // Phase 1: Move nodes to optimize modularity
      for (const node of nodes) {
        const bestCommunity = this.findBestCommunity(node, nodes, edges, resolution);
        
        if (bestCommunity !== this.nodeAssignments.get(node.id)) {
          this.nodeAssignments.set(node.id, bestCommunity);
          improved = true;
        }
      }

      // Check convergence
      const newModularity = this.calculateModularity(nodes, edges, resolution);
      if (Math.abs(newModularity - modularity) < convergenceThreshold) {
        break;
      }
      modularity = newModularity;
    }

    // Aggregate communities
    const detectedCommunities = this.aggregateCommunities(nodes, minCommunitySize);

    // Store results
    for (const community of detectedCommunities) {
      const commId = `comm-${community.id}`;
      this.communities.set(commId, {
        ...community,
        detectedAt: Date.now()
      });
    }

    this.detectionCount++;
    return detectedCommunities;
  }

  /**
   * Build graph structure from input
   */
  buildGraphStructure(graph) {
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    // Process nodes
    if (graph.nodes) {
      for (const node of graph.nodes) {
        const nodeId = node.id || node.nodeId;
        nodeMap.set(nodeId, {
          id: nodeId,
          weight: node.weight || 1,
          data: node
        });
        nodes.push(nodeMap.get(nodeId));
      }
    }

    // Process edges
    if (graph.edges) {
      for (const edge of graph.edges) {
        const source = edge.source || edge.from;
        const target = edge.target || edge.to;
        const weight = edge.weight || 1;

        if (nodeMap.has(source) && nodeMap.has(target)) {
          edges.push({
            source,
            target,
            weight,
            data: edge
          });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Initialize each node in its own community
   */
  initializeCommunities(nodes) {
    this.nodeAssignments.clear();
    for (const node of nodes) {
      this.nodeAssignments.set(node.id, node.id);
    }
  }

  /**
   * Find the best community for a node
   */
  findBestCommunity(node, nodes, edges, resolution) {
    const currentCommunity = this.nodeAssignments.get(node.id);
    const neighborCommunities = new Map();

    // Gather neighbor communities
    for (const edge of edges) {
      let neighborId = null;
      
      if (edge.source === node.id) {
        neighborId = edge.target;
      } else if (edge.target === node.id) {
        neighborId = edge.source;
      }

      if (neighborId) {
        const neighborCommunity = this.nodeAssignments.get(neighborId);
        if (!neighborCommunities.has(neighborCommunity)) {
          neighborCommunities.set(neighborCommunity, {
            internalWeight: 0,
            totalWeight: 0
          });
        }

        const comm = neighborCommunities.get(neighborCommunity);
        comm.internalWeight += edge.weight;
        comm.totalWeight += edge.weight;
      }
    }

    // Calculate modularity gain for each community
    let bestCommunity = currentCommunity;
    let bestGain = 0;

    const nodeDegree = this.calculateNodeDegree(node.id, edges);
    const totalEdgeWeight = this.calculateTotalEdgeWeight(edges) * 2;

    for (const [community, weights] of neighborCommunities) {
      if (community === currentCommunity) continue;

      const gain = this.calculateModularityGain(
        node,
        community,
        weights.internalWeight,
        nodeDegree,
        totalEdgeWeight,
        resolution
      );

      if (gain > bestGain) {
        bestGain = gain;
        bestCommunity = community;
      }
    }

    return bestCommunity;
  }

  /**
   * Calculate modularity gain for moving a node
   */
  calculateModularityGain(node, targetCommunity, internalWeight, nodeDegree, totalWeight, resolution) {
    const sumTot = this.calculateCommunityWeight(targetCommunity, this.nodeAssignments, nodeDegree);
    
    // Modularity gain formula
    const gain = (internalWeight / totalWeight) - 
                 (resolution * (sumTot * nodeDegree) / (totalWeight * totalWeight));
    
    return gain;
  }

  /**
   * Calculate total weight of a community
   */
  calculateCommunityWeight(communityId, assignments, excludeWeight = 0) {
    let weight = 0;
    for (const [nodeId, commId] of assignments) {
      if (commId === communityId && nodeId !== communityId) {
        weight += excludeWeight;
      }
    }
    return weight;
  }

  /**
   * Calculate node degree (sum of edge weights)
   */
  calculateNodeDegree(nodeId, edges) {
    let degree = 0;
    for (const edge of edges) {
      if (edge.source === nodeId || edge.target === nodeId) {
        degree += edge.weight;
      }
    }
    return degree;
  }

  /**
   * Calculate total edge weight
   */
  calculateTotalEdgeWeight(edges) {
    return edges.reduce((sum, edge) => sum + edge.weight, 0);
  }

  /**
   * Calculate modularity of current partition
   */
  calculateModularity(nodes, edges, resolution) {
    const totalWeight = this.calculateTotalEdgeWeight(edges) * 2;
    if (totalWeight === 0) return 0;

    let modularity = 0;

    for (const edge of edges) {
      if (this.nodeAssignments.get(edge.source) === this.nodeAssignments.get(edge.target)) {
        const ki = this.calculateNodeDegree(edge.source, edges);
        const kj = this.calculateNodeDegree(edge.target, edges);
        
        modularity += edge.weight - (resolution * (ki * kj) / totalWeight);
      }
    }

    return modularity / totalWeight;
  }

  /**
   * Aggregate nodes into communities
   */
  aggregateCommunities(nodes, minCommunitySize) {
    const communityMap = new Map();

    // Group nodes by community assignment
    for (const node of nodes) {
      const communityId = this.nodeAssignments.get(node.id);
      
      if (!communityMap.has(communityId)) {
        communityMap.set(communityId, []);
      }
      communityMap.get(communityId).push(node);
    }

    // Filter and format communities
    const communities = [];
    let communityIndex = 0;

    for (const [commId, members] of communityMap) {
      if (members.length >= minCommunitySize) {
        communities.push({
          id: communityIndex++,
          originalId: commId,
          size: members.length,
          members: members.map(m => m.id),
          memberData: members.map(m => m.data),
          density: this.calculateCommunityDensity(members, commId),
          centroid: this.calculateCommunityCentroid(members)
        });
      }
    }

    // Sort by size (largest first)
    return communities.sort((a, b) => b.size - a.size);
  }

  /**
   * Calculate community density
   */
  calculateCommunityDensity(members, communityId) {
    if (members.length < 2) return 0;

    const maxEdges = (members.length * (members.length - 1)) / 2;
    let actualEdges = 0;

    // Count internal edges (simplified - would need edge data)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        // Check if connected (simplified)
        actualEdges++;
      }
    }

    return actualEdges / maxEdges;
  }

  /**
   * Calculate community centroid (representative node)
   */
  calculateCommunityCentroid(members) {
    if (members.length === 0) return null;
    
    // Return the first member as a simple centroid
    // In a more sophisticated implementation, this would be
    // the node with highest centrality in the community
    return members[0].id;
  }

  /**
   * Get community by ID
   */
  getCommunity(communityId) {
    return this.communities.get(`comm-${communityId}`);
  }

  /**
   * Get all communities
   */
  getAllCommunities() {
    return Array.from(this.communities.values());
  }

  /**
   * Get community assignments for nodes
   */
  getNodeAssignments() {
    return new Map(this.nodeAssignments);
  }

  /**
   * Get node's community
   */
  getNodeCommunity(nodeId) {
    return this.nodeAssignments.get(nodeId);
  }

  /**
   * Clear all communities
   */
  clear() {
    this.communities.clear();
    this.nodeAssignments.clear();
    this.detectionCount = 0;
  }

  /**
   * Get detection statistics
   */
  getStats() {
    const sizeDistribution = new Map();
    for (const community of this.communities.values()) {
      const sizeBucket = Math.floor(community.size / 5) * 5;
      sizeDistribution.set(sizeBucket, (sizeDistribution.get(sizeBucket) || 0) + 1);
    }

    return {
      totalCommunities: this.communities.size,
      detectionCount: this.detectionCount,
      averageSize: this.communities.size > 0 
        ? Array.from(this.communities.values()).reduce((s, c) => s + c.size, 0) / this.communities.size 
        : 0,
      sizeDistribution: Object.fromEntries(sizeDistribution),
      largestCommunity: this.communities.size > 0
        ? Math.max(...Array.from(this.communities.values()).map(c => c.size))
        : 0
    };
  }
}

module.exports = CommunityDetector;
