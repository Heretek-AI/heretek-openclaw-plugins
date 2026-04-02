/**
 * OpenClaw Hybrid Search Plugin - Main Entry Point
 *
 * This plugin provides hybrid search capabilities combining:
 * 1. Vector search (pgvector backend)
 * 2. Keyword search (BM25-style)
 * 3. Graph-based retrieval (Neo4j)
 * 4. Fusion ranking for combined results
 * 5. Cross-reference linking
 *
 * @module @heretek-ai/openclaw-hybrid-search-plugin
 */

const { definePluginEntry } = require('openclaw/plugin-sdk/plugin-entry');
const HybridSearchPlugin = require('./original-index.js');

module.exports = definePluginEntry({
  id: 'hybrid-search',
  name: 'Hybrid Search',
  description: 'Vector + keyword search fusion for enhanced retrieval',
  register(api) {
    try {
      // Merge plugin config with API config for database settings
      const pluginConfig = api.pluginConfig || {};
      const vectorConfig = pluginConfig.vector || {};

      const plugin = new HybridSearchPlugin({
        ...pluginConfig,
        vector: {
          connectionString: vectorConfig.connectionString,
          collection: vectorConfig.collection,
          dimensions: vectorConfig.dimensions,
          indexType: vectorConfig.indexType,
          cacheSize: vectorConfig.cacheSize,
          ...vectorConfig
        },
        fusion: pluginConfig.fusion || {},
        graph: pluginConfig.graph || {}
      });

      // Initialize the plugin
      if (plugin.initialize) {
        plugin.initialize().catch(err => api.logger.error('Hybrid search init error:', err));
      }

      // Register hybrid-search tool
      api.registerTool((ctx) => ({
        name: 'hybrid-search',
        description: 'Perform hybrid search across vector, keyword, and graph indices with fused ranking',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            topK: { type: 'number', description: 'Number of results to return (default 10)', default: 10 },
            minScore: { type: 'number', description: 'Minimum score threshold (default 0.3)', default: 0.3 },
            enableReranking: { type: 'boolean', description: 'Enable reranking of results (default true)', default: true }
          },
          required: ['query']
        },
        execute: async (_toolCallId, params) => {
          try {
            const { query, topK = 10, minScore = 0.3, enableReranking = true } = params || {};
            if (!query) {
              return {
                content: [{ type: 'text', text: 'Error: query is required' }]
              };
            }

            if (!plugin.search) {
              return {
                content: [{ type: 'text', text: 'Hybrid search not available' }]
              };
            }

            const results = await plugin.search(query, { topK, minScore, enableReranking });

            if (!results || results.length === 0) {
              return {
                content: [{ type: 'text', text: 'No results found for your search query.' }]
              };
            }

            const formattedResults = results.map((r, i) =>
              `[${i + 1}] Score: ${r.combinedScore?.toFixed(3) || 'N/A'}\n${r.content || r.text || JSON.stringify(r)}`
            ).join('\n\n');

            return {
              content: [{ type: 'text', text: `Found ${results.length} results:\n\n${formattedResults}` }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Search error: ${err.message}` }]
            };
          }
        }
      }));

      // Register index-document tool
      api.registerTool((ctx) => ({
        name: 'index-document',
        description: 'Index a document for hybrid retrieval across vector, keyword, and graph indices',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Document content to index' },
            id: { type: 'string', description: 'Optional document ID' },
            metadata: { type: 'object', description: 'Optional metadata for the document' }
          },
          required: ['content']
        },
        execute: async (_toolCallId, params) => {
          try {
            const { content, id, metadata = {} } = params || {};
            if (!content) {
              return {
                content: [{ type: 'text', text: 'Error: content is required' }]
              };
            }

            if (!plugin.index) {
              return {
                content: [{ type: 'text', text: 'Document indexing not available' }]
              };
            }

            const result = await plugin.index({ content, id, ...metadata });

            return {
              content: [{ type: 'text', text: `Document indexed successfully: ${JSON.stringify(result)}` }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Indexing error: ${err.message}` }]
            };
          }
        }
      }));

      api.logger.info('Hybrid search plugin loaded with tools: hybrid-search, index-document');
    } catch (err) {
      api.logger.error('Hybrid search plugin failed:', err);
      throw err;
    }
  }
});
