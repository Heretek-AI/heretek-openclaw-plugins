/**
 * Keyword Search Module
 * Handles lexical search using TF-IDF and BM25
 */

const natural = require('natural');

class KeywordSearch {
  constructor(config = {}) {
    this.config = {
      algorithm: config.algorithm || 'bm25',
      language: config.language || 'en',
      stemmer: config.stemmer !== false,
      removeStopwords: config.removeStopwords !== false,
      cacheSize: config.cacheSize || 1000,
      ...config
    };

    this.documents = new Map();
    this.invertedIndex = new Map();
    this.documentFrequencies = new Map();
    this.initialized = false;
    this.searchCount = 0;
    this.indexCount = 0;

    // Initialize tokenizer and stemmer
    this.tokenizer = new natural.WordTokenizer();
    if (this.config.stemmer) {
      this.stemmer = natural.PorterStemmer;
    }
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Tokenize and normalize text
   * @param {string} text - Text to process
   * @returns {Array<string>} Tokens
   */
  tokenize(text) {
    let tokens = this.tokenizer.tokenize(text.toLowerCase());
    
    if (this.config.removeStopwords) {
      tokens = tokens.filter(t => !natural.stopwords.includes(t));
    }
    
    if (this.config.stemmer && this.stemmer) {
      tokens = tokens.map(t => this.stemmer.stem(t));
    }
    
    return tokens;
  }

  /**
   * Search for documents matching keywords
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Matching documents
   */
  async search(query, options = {}) {
    const { topK = 10, filters = {} } = options;
    const startTime = Date.now();

    const queryTokens = this.tokenize(query);
    const scores = new Map();

    // Calculate scores for each document
    for (const [docId, doc] of this.documents) {
      // Apply filters
      if (filters.type && doc.metadata?.type !== filters.type) continue;
      if (filters.source && doc.metadata?.source !== filters.source) continue;

      let score = 0;
      
      if (this.config.algorithm === 'bm25') {
        score = this.calculateBM25(queryTokens, doc);
      } else if (this.config.algorithm === 'tfidf') {
        score = this.calculateTFIDF(queryTokens, doc);
      } else {
        score = this.calculateOverlap(queryTokens, doc);
      }

      if (score > 0) {
        scores.set(docId, { docId, score, matchedTokens: queryTokens });
      }
    }

    // Sort by score and return top K
    const results = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => {
        const doc = this.documents.get(r.docId);
        return {
          id: r.docId,
          content: doc.content,
          keywordScore: r.score,
          source: 'keyword',
          searchTime: Date.now() - startTime,
          metadata: doc.metadata
        };
      });

    this.searchCount++;
    return results;
  }

  /**
   * Index a document for keyword search
   * @param {object} document - Document to index
   * @returns {Promise<object>} Indexing result
   */
  async index(document) {
    const tokens = this.tokenize(document.content || document.text);
    const id = document.id || this.hash(document.content);
    
    // Store document
    this.documents.set(id, {
      id,
      content: document.content || document.text,
      tokens,
      metadata: document.metadata || {},
      indexedAt: Date.now()
    });

    // Update inverted index
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token).add(id);
      
      // Update document frequency
      this.documentFrequencies.set(
        token,
        this.invertedIndex.get(token).size
      );
    }

    this.indexCount++;
    return { id, tokens, indexed: true, timestamp: Date.now() };
  }

  /**
   * BM25 scoring algorithm
   */
  calculateBM25(queryTokens, doc) {
    const k1 = 1.5; // Term frequency saturation
    const b = 0.75; // Length normalization
    const N = this.documents.size;
    
    let score = 0;
    const docLength = doc.tokens.length;
    const avgDocLength = this.getAverageDocumentLength();

    for (const token of queryTokens) {
      const df = this.documentFrequencies.get(token) || 0;
      if (df === 0) continue;

      const tf = doc.tokens.filter(t => t === token).length;
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
      
      const tfNumerator = tf * (k1 + 1);
      const tfDenominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
      
      score += idf * (tfNumerator / tfDenominator);
    }

    return score;
  }

  /**
   * TF-IDF scoring algorithm
   */
  calculateTFIDF(queryTokens, doc) {
    const N = this.documents.size;
    let score = 0;

    for (const token of queryTokens) {
      const df = this.documentFrequencies.get(token) || 0;
      if (df === 0) continue;

      const tf = doc.tokens.filter(t => t === token).length / doc.tokens.length;
      const idf = Math.log(N / df);
      
      score += tf * idf;
    }

    return score;
  }

  /**
   * Simple token overlap scoring
   */
  calculateOverlap(queryTokens, doc) {
    const docTokens = new Set(doc.tokens);
    let overlap = 0;
    
    for (const token of queryTokens) {
      if (docTokens.has(token)) overlap++;
    }
    
    return overlap / queryTokens.length;
  }

  getAverageDocumentLength() {
    let total = 0;
    for (const doc of this.documents.values()) {
      total += doc.tokens.length;
    }
    return total / this.documents.size || 1;
  }

  /**
   * Get keyword search statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    return {
      type: 'keyword',
      indexCount: this.indexCount,
      searchCount: this.searchCount,
      uniqueTokens: this.invertedIndex.size,
      algorithm: this.config.algorithm,
      language: this.config.language
    };
  }

  /**
   * Clear keyword index
   * @returns {Promise<void>}
   */
  async clear() {
    this.documents.clear();
    this.invertedIndex.clear();
    this.documentFrequencies.clear();
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

module.exports = KeywordSearch;
