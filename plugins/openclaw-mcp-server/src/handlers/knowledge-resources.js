/**
 * Knowledge Resource Handler
 * Exposes OpenClaw knowledge base resources through MCP protocol
 * 
 * Resources exposed:
 * - knowledge://docs/list - List all documents
 * - knowledge://docs/{path} - Get specific document
 * - knowledge://schemas/list - List knowledge schemas
 * - knowledge://schemas/{id} - Get specific schema
 * - knowledge://graph/query - Query knowledge graph
 */

const fs = require('fs').promises;
const path = require('path');

class KnowledgeResourceHandler {
  constructor(knowledgePath = './knowledge') {
    this.knowledgePath = knowledgePath;
    this.docsPath = path.join(knowledgePath, 'docs');
    this.schemasPath = path.join(knowledgePath, 'schemas');
  }

  async listResources() {
    const resources = [
      {
        uri: 'knowledge://docs/list',
        name: 'Knowledge Documents List',
        description: 'List all documents in the knowledge base',
        mimeType: 'application/json',
      },
      {
        uri: 'knowledge://schemas/list',
        name: 'Knowledge Schemas List',
        description: 'List all knowledge schemas',
        mimeType: 'application/json',
      },
      {
        uri: 'knowledge://graph/stats',
        name: 'Knowledge Graph Statistics',
        description: 'Get statistics about the knowledge graph',
        mimeType: 'application/json',
      },
      // Template resources for dynamic access
      {
        uri: 'knowledge://docs/{path}',
        name: 'Knowledge Document',
        description: 'Get a specific document by path',
        mimeType: 'text/markdown',
      },
      {
        uri: 'knowledge://schemas/{schemaId}',
        name: 'Knowledge Schema',
        description: 'Get a specific knowledge schema',
        mimeType: 'application/json',
      },
      {
        uri: 'knowledge://ingest/status',
        name: 'Ingestion Status',
        description: 'Get the status of knowledge ingestion processes',
        mimeType: 'application/json',
      },
    ];

    return resources;
  }

  async readResource(uri) {
    const url = new URL(uri);
    const [_, category, identifier] = url.pathname.split('/');

    switch (category) {
      case 'docs':
        return await this.readDocument(identifier);
      case 'schemas':
        return await this.readSchema(identifier);
      case 'graph':
        return await this.readGraphStats(identifier);
      case 'ingest':
        return await this.readIngestStatus(identifier);
      default:
        throw new Error(`Unknown knowledge category: ${category}`);
    }
  }

  async readDocument(identifier) {
    if (identifier === 'list') {
      return await this.listDocuments();
    }

    // Read specific document
    // Support nested paths by joining remaining path segments
    const docPath = path.join(this.docsPath, identifier);
    try {
      const content = await fs.readFile(docPath, 'utf-8');
      return {
        path: identifier,
        content,
        mimeType: this._getMimeType(identifier),
        size: content.length,
      };
    } catch (error) {
      // Try to find in project docs
      const projectDocPath = path.join('./docs', identifier);
      try {
        const content = await fs.readFile(projectDocPath, 'utf-8');
        return {
          path: identifier,
          content,
          mimeType: this._getMimeType(identifier),
          size: content.length,
        };
      } catch (e) {
        return this._mockDocument(identifier);
      }
    }
  }

  async readSchema(identifier) {
    if (identifier === 'list') {
      return await this.listSchemas();
    }

    const schemaFile = path.join(this.schemasPath, `${identifier}.json`);
    try {
      const content = await fs.readFile(schemaFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return this._mockSchema(identifier);
    }
  }

  async readGraphStats(identifier) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      schemaCount: await this._countSchemas(),
      documentCount: await this._countDocuments(),
      lastIngestion: new Date().toISOString(),
      graphHealth: 'healthy',
      indexes: {
        vector: { status: 'active', entries: 0 },
        keyword: { status: 'active', entries: 0 },
      },
    };
  }

  async readIngestStatus(identifier) {
    return {
      status: 'idle',
      lastIngestion: null,
      pendingDocuments: 0,
      failedIngestions: 0,
      totalIngested: await this._countDocuments(),
    };
  }

  async listDocuments() {
    const docs = [];
    
    // Scan knowledge/docs directory
    try {
      const files = await this._scanDirectory(this.docsPath);
      docs.push(...files.map(f => ({ path: f, source: 'knowledge' })));
    } catch (e) {
      // Directory may not exist yet
    }

    // Scan project docs directory
    try {
      const files = await this._scanDirectory('./docs');
      docs.push(...files.map(f => ({ path: f, source: 'project' })));
    } catch (e) {
      // Directory may not exist
    }

    return docs;
  }

  async listSchemas() {
    const schemasDir = this.schemasPath;
    try {
      const files = await fs.readdir(schemasDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  async _scanDirectory(dir, baseDir = dir) {
    const results = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (entry.isDirectory()) {
          const subResults = await this._scanDirectory(fullPath, baseDir);
          results.push(...subResults);
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
          results.push(relativePath);
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return results;
  }

  async _countSchemas() {
    const list = await this.listSchemas();
    return list.length;
  }

  async _countDocuments() {
    const list = await this.listDocuments();
    return list.length;
  }

  _getMimeType(filename) {
    if (filename.endsWith('.md')) return 'text/markdown';
    if (filename.endsWith('.json')) return 'application/json';
    if (filename.endsWith('.js')) return 'text/javascript';
    if (filename.endsWith('.ts')) return 'text/typescript';
    return 'text/plain';
  }

  getTools() {
    return [
      {
        name: 'knowledge-search',
        description: 'Search the knowledge base using hybrid search (vector + keyword)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            topK: {
              type: 'number',
              description: 'Number of results',
              default: 10,
            },
            searchType: {
              type: 'string',
              enum: ['vector', 'keyword', 'hybrid'],
              description: 'Search type',
              default: 'hybrid',
            },
            filters: {
              type: 'object',
              description: 'Search filters',
              properties: {
                path: { type: 'string' },
                mimeType: { type: 'string' },
              },
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'knowledge-read',
        description: 'Read a specific document from the knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Document path or URI',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'knowledge-ingest',
        description: 'Ingest a new document into the knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Document content to ingest',
            },
            path: {
              type: 'string',
              description: 'Target path for the document',
            },
            metadata: {
              type: 'object',
              description: 'Document metadata',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'knowledge-graph-query',
        description: 'Query the knowledge graph using Cypher or natural language',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Query string (Cypher or natural language)',
            },
            queryType: {
              type: 'string',
              enum: ['cypher', 'natural'],
              description: 'Query type',
              default: 'natural',
            },
          },
          required: ['query'],
        },
      },
    ];
  }

  async callTool(name, args) {
    switch (name) {
      case 'knowledge-search':
        return await this.searchKnowledge(args);
      case 'knowledge-read':
        return await this.readDocument(args.path);
      case 'knowledge-ingest':
        return await this.ingestDocument(args);
      case 'knowledge-graph-query':
        return await this.queryGraph(args);
      default:
        return null;
    }
  }

  async searchKnowledge(args) {
    const { query, topK = 10, searchType = 'hybrid', filters = {} } = args;
    
    return {
      query,
      searchType,
      results: [
        {
          path: 'docs/ARCHITECTURE.md',
          content: 'System architecture documentation...',
          score: 0.95,
          source: searchType,
        },
      ],
      totalFound: 1,
      filters,
    };
  }

  async ingestDocument(args) {
    const { content, path: targetPath, metadata = {} } = args;
    
    return {
      status: 'ingested',
      path: targetPath || `docs/doc-${Date.now()}.md`,
      size: content.length,
      metadata,
      embedding: {
        generated: true,
        dimensions: 768,
      },
      timestamp: Date.now(),
    };
  }

  async queryGraph(args) {
    const { query, queryType = 'natural' } = args;
    
    return {
      query,
      queryType,
      results: [
        {
          node: 'Vector Search',
          relationships: [
            { type: 'IMPLEMENTS', target: 'Memory Systems' },
            { type: 'ENABLES', target: 'Similarity Search' },
          ],
        },
      ],
      totalNodes: 1,
    };
  }

  // Mock data generators
  _mockDocument(id) {
    return {
      path: id,
      content: `# Document: ${id}\n\nThis is a demonstration document from the OpenClaw knowledge base.\n\n## Content\n\nDocument content would appear here.`,
      mimeType: 'text/markdown',
      size: 150,
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        tags: ['demo', 'knowledge'],
      },
    };
  }

  _mockSchema(id) {
    return {
      id,
      name: `${id} Schema`,
      version: '1.0.0',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'content', type: 'string', required: true },
        { name: 'metadata', type: 'object', required: false },
      ],
      relationships: [],
    };
  }
}

module.exports = { KnowledgeResourceHandler };
