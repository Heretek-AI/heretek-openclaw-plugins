/**
 * OpenClaw Multi-Document Retrieval Plugin - Main Entry Point
 *
 * This plugin provides multi-document context retrieval with:
 * 1. Pipeline orchestration for document processing
 * 2. Document fusion and context building
 * 3. Citation tracking
 * 4. Reranking capabilities
 *
 * @module @heretek-ai/openclaw-multi-doc-retrieval
 */

const { definePluginEntry } = require('openclaw/plugin-sdk/plugin-entry');
const MultiDocRetrievalPlugin = require('./original-index.js');

module.exports = definePluginEntry({
  id: 'multi-doc',
  name: 'Multi-Document Retrieval',
  description: 'Multi-document context retrieval plugin',
  register(api) {
    try {
      const plugin = new MultiDocRetrievalPlugin(api.pluginConfig || {});

      // Initialize the plugin
      if (plugin.initialize) {
        plugin.initialize().catch(err => api.logger.error('Multi-doc init error:', err));
      }

      // Register retrieve-documents tool
      api.registerTool((ctx) => ({
        name: 'retrieve-documents',
        description: 'Retrieve relevant documents for a query with citation tracking',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query for document retrieval' },
            maxDocuments: { type: 'number', description: 'Maximum number of documents to return (default 5)', default: 5 },
            contextWindow: { type: 'number', description: 'Context window size (default 2000)', default: 2000 }
          },
          required: ['query']
        },
        execute: async (_toolCallId, params) => {
          try {
            const { query, maxDocuments = 5, contextWindow = 2000 } = params || {};
            if (!query) {
              return {
                content: [{ type: 'text', text: 'Error: query is required' }]
              };
            }

            if (!plugin.retrieve) {
              return {
                content: [{ type: 'text', text: 'Document retrieval not available' }]
              };
            }

            const results = await plugin.retrieve(query, { maxDocuments, contextWindow });

            if (!results || results.length === 0) {
              return {
                content: [{ type: 'text', text: 'No documents found for your query.' }]
              };
            }

            const formattedResults = results.map((r, i) =>
              `[${i + 1}] ${r.title || 'Document ' + (i + 1)}\n${r.content || r.text || JSON.stringify(r)}`
            ).join('\n\n');

            return {
              content: [{ type: 'text', text: `Found ${results.length} documents:\n\n${formattedResults}` }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Retrieval error: ${err.message}` }]
            };
          }
        }
      }));

      api.logger.info('Multi-doc plugin loaded with tools: retrieve-documents');
    } catch (err) {
      api.logger.error('Multi-doc plugin failed:', err);
      throw err;
    }
  }
});
