/**
 * Hybrid Fusion Module
 * Combines results from multiple search sources using Reciprocal Rank Fusion (RRF)
 */

class HybridFusion {
  constructor(config = {}) {
    this.config = {
      k: config.k || 60, // RRF constant
      vectorWeight: config.vectorWeight || 0.5,
      keywordWeight: config.keywordWeight || 0.3,
      graphWeight: config.graphWeight || 0.2,
      enableReranking: config.enableReranking ?? true,
      ...config
    };

    this.searchCount = 0;
    this.totalFusionTime = 0;
    this.totalRerankTime = 0;
  }

  /**
   * Fuse results from multiple sources using weighted RRF
   * @param {Array<object>} sources - Array of {results, weight, source} objects
   * @returns {Array<object>} Fused and ranked results
   */
  fuse(sources) {
    const startTime = Date.now();
    const rankMap = new Map(); // docId -> {scores, sources, data}

    // Calculate RRF scores for each source
    for (const { results, weight, source } of sources) {
      results.forEach((result, index) => {
        const docId = result.id;
        const rank = index + 1;
        const rrfScore = weight / (this.config.k + rank);

        if (!rankMap.has(docId)) {
          rankMap.set(docId, {
            docId,
            scores: {},
            sourceCount: 0,
            combinedScore: 0,
            data: result
          });
        }

        const entry = rankMap.get(docId);
        entry.scores[source] = (entry.scores[source] || 0) + result.score;
        entry.sourceCount++;
        entry.combinedScore += rrfScore;
        
        // Keep highest individual score
        if (result.score > (entry.data.score || 0)) {
          entry.data = { ...entry.data, ...result };
        }
      });
    }

    // Normalize and sort
    const maxScore = Math.max(
      ...Array.from(rankMap.values()).map(v => v.combinedScore)
    );

    const results = Array.from(rankMap.values())
      .map(entry => ({
        ...entry.data,
        combinedScore: entry.combinedScore / maxScore,
        individualScores: entry.scores,
        sourceCount: entry.sourceCount,
        sources: Object.keys(entry.scores)
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore);

    this.searchCount++;
    this.totalFusionTime += Date.now() - startTime;
    return results;
  }

  /**
   * Rerank results using cross-encoder style scoring
   * @param {string} query - Original query
   * @param {Array<object>} results - Results to rerank
   * @returns {Promise<Array<object>>} Reranked results
   */
  async rerank(query, results) {
    const startTime = Date.now();

    // Placeholder for actual reranking model
    // In production, this would use a cross-encoder model
    const reranked = results.map(result => {
      const rerankScore = this.calculateRerankScore(query, result);
      return {
        ...result,
        rerankScore,
        finalScore: (result.combinedScore * 0.6) + (rerankScore * 0.4)
      };
    });

    // Sort by final score
    reranked.sort((a, b) => b.finalScore - a.finalScore);

    this.totalRerankTime += Date.now() - startTime;
    return reranked;
  }

  /**
   * Calculate reranking score (placeholder for actual model)
   */
  calculateRerankScore(query, result) {
    const queryLower = query.toLowerCase();
    const content = result.content?.toLowerCase() || '';
    
    let score = 0;
    
    // Exact phrase match bonus
    if (content.includes(queryLower)) {
      score += 0.5;
    }
    
    // Word overlap
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const matchedWords = queryWords.filter(w => content.includes(w)).length;
    score += (matchedWords / queryWords.length) * 0.3;
    
    // Source diversity bonus
    if (result.sources && result.sources.length > 1) {
      score += 0.1 * result.sources.length;
    }
    
    // Recency bonus (if available)
    if (result.metadata?.timestamp) {
      const age = Date.now() - result.metadata.timestamp;
      const recencyScore = Math.exp(-age / (1000 * 60 * 60 * 24 * 30)); // 30 days half-life
      score += recencyScore * 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  get avgFusionTime() {
    return this.searchCount > 0 ? this.totalFusionTime / this.searchCount : 0;
  }

  get avgRerankTime() {
    return this.searchCount > 0 ? this.totalRerankTime / this.searchCount : 0;
  }
}

module.exports = HybridFusion;
