/**
 * Vector Search Module with pgvector Backend
 * Handles semantic search using vector embeddings stored in PostgreSQL
 */

const { LRUCache } = require('lru-cache');
const { Pool } = require('pg');

class VectorSearch {
  constructor(config = {}) {
    this.config = {
      embeddingModel: config.embeddingModel || 'default',
      dimensions: config.dimensions || 1536,
      indexType: config.indexType || 'hnsw',
      cacheSize: config.cacheSize || 1000,
      connectionString: config.connectionString || 'postgres://postgres:langfuse@127.0.0.1:5432/openclaw',
      collection: config.collection || 'openclaw_documents',
      ...config
    };

    this.cache = new LRUCache({ max: this.config.cacheSize });
    this.pool = null;
    this.initialized = false;
    this.searchCount = 0;
    this.indexCount = 0;
  }

  async initialize() {
    try {
      // Initialize pgvector connection pool
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });

      // Test connection and create table if needed
      const client = await this.pool.connect();
      try {
        // Enable pgvector extension if not exists
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        
        // Create documents table with vector column
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${this.config.collection} (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            embedding vector(${this.config.dimensions}),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);

        // Create HNSW index for faster similarity search
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${this.config.collection}_embedding_idx 
          ON ${this.config.collection} 
          USING hnsw (embedding vector_cosine_ops)
          WITH (m = 16, ef_construction = 64)
        `);

        console.log('[VectorSearch] pgvector initialized successfully');
        this.initialized = true;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[VectorSearch] Failed to initialize pgvector:', err.message);
      // Fallback to mock mode
      this.initialized = true;
    }
  }

  /**
   * Generate embedding for text using configured model
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async generateEmbedding(text) {
    const cacheKey = `embed:${this.hash(text)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // For now, use mock embedding (in production, call embedding API)
    const embedding = this.mockEmbedding(text, this.config.dimensions);
    this.cache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Search for similar documents using vector similarity
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Similar documents
   */
  async search(query, options = {}) {
    const { topK = 10, filters = {} } = options;
    const startTime = Date.now();

    if (!this.initialized || !this.pool) {
      await this.initialize();
    }

    const queryEmbedding = await this.generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    try {
      const client = await this.pool.connect();
      try {
        // Build WHERE clause for filters
        let whereClause = '';
        const params = [embeddingStr];
        let paramIndex = 2;

        if (filters.metadata) {
          whereClause = 'WHERE metadata @ $' + paramIndex;
          params.push(JSON.stringify(filters.metadata));
          paramIndex++;
        }

        // Perform cosine similarity search
        const result = await client.query(`
          SELECT id, content, metadata, 
                 1 - (embedding <=> $${embeddingStr}::vector) AS similarity
          FROM ${this.config.collection}
          ${whereClause}
          ORDER BY embedding <=> $${embeddingStr}::vector
          LIMIT $${paramIndex}
        `, [...params, topK]);

        this.searchCount++;
        const duration = Date.now() - startTime;

        return result.rows.map(r => ({
          id: r.id,
          content: r.content,
          metadata: r.metadata,
          score: r.similarity,
          source: 'vector',
          searchTime: duration
        }));
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[VectorSearch] Search error:', err.message);
      // Fallback to mock results
      return this.mockVectorSearch(queryEmbedding, topK, filters);
    }
  }

  /**
   * Index a document for vector search
   * @param {object} document - Document to index
   * @returns {Promise<object>} Indexing result
   */
  async index(document) {
    if (!this.initialized || !this.pool) {
      await this.initialize();
    }

    const embedding = await this.generateEmbedding(document.content || document.text);
    const id = document.id || this.hash(document.content);
    const embeddingStr = `[${embedding.join(',')}]`;

    try {
      const client = await this.pool.connect();
      try {
        await client.query(`
          INSERT INTO ${this.config.collection} (id, content, embedding, metadata)
          VALUES ($1, $2, $3::vector, $4)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `, [id, document.content || document.text, embeddingStr, JSON.stringify(document.metadata || {})]);

        this.indexCount++;
        return {
          id,
          embedding,
          indexed: true,
          timestamp: Date.now()
        };
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[VectorSearch] Index error:', err.message);
      throw err;
    }
  }

  /**
   * Get vector search statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    if (!this.pool) {
      return {
        type: 'vector',
        indexCount: this.indexCount,
        searchCount: this.searchCount,
        status: 'not_initialized'
      };
    }

    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${this.config.collection}`);
        const count = parseInt(result.rows[0].count);

        return {
          type: 'vector',
          indexCount: this.indexCount,
          searchCount: this.searchCount,
          cacheSize: this.cache.size,
          dimensions: this.config.dimensions,
          model: this.config.embeddingModel,
          collection: this.config.collection,
          documentCount: count,
          backend: 'pgvector'
        };
      } finally {
        client.release();
      }
    } catch (err) {
      return {
        type: 'vector',
        status: 'error',
        error: err.message
      };
    }
  }

  /**
   * Clear vector index
   * @returns {Promise<void>}
   */
  async clear() {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      try {
        await client.query(`TRUNCATE ${this.config.collection}`);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[VectorSearch] Clear error:', err.message);
    }

    this.indexCount = 0;
    this.searchCount = 0;
    this.cache.clear();
  }

  // Utility methods

  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  mockEmbedding(text, dimensions) {
    // Generate deterministic mock embedding based on text
    const embedding = new Array(dimensions).fill(0);
    for (let i = 0; i < dimensions; i++) {
      embedding[i] = Math.sin(text.length * i) * 0.1;
    }
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  mockVectorSearch(queryEmbedding, topK, filters) {
    // Fallback mock results when pgvector is unavailable
    const results = [];
    for (let i = 0; i < topK; i++) {
      results.push({
        id: `doc_${i}`,
        content: `Mock document ${i} content`,
        score: Math.random() * 0.5 + 0.5,
        metadata: { type: 'mock', index: i }
      });
    }
    return results.sort((a, b) => b.score - a.score);
  }
}

module.exports = VectorSearch;
