/**
 * Memory Resource Handler
 * Exposes OpenClaw memory resources through MCP protocol
 * 
 * Resources exposed:
 * - memory://episodic/list - List episodic memories
 * - memory://episodic/{id} - Get specific episodic memory
 * - memory://semantic/list - List semantic schemas
 * - memory://semantic/{id} - Get specific semantic schema
 * - memory://session/{agent} - Get agent session memory
 */

const fs = require('fs').promises;
const path = require('path');

class MemoryResourceHandler {
  constructor(memoryPath = './memory') {
    this.memoryPath = memoryPath;
    this.resourceCache = new Map();
  }

  async listResources() {
    const resources = [
      {
        uri: 'memory://episodic/list',
        name: 'Episodic Memory List',
        description: 'List all episodic memories in the swarm memory pool',
        mimeType: 'application/json',
      },
      {
        uri: 'memory://semantic/list',
        name: 'Semantic Schema List',
        description: 'List all semantic schemas in the knowledge graph',
        mimeType: 'application/json',
      },
      {
        uri: 'memory://session/list',
        name: 'Session Memory List',
        description: 'List all agent session memories',
        mimeType: 'application/json',
      },
      {
        uri: 'memory://swarm/stats',
        name: 'Swarm Memory Statistics',
        description: 'Get statistics about swarm memory usage and coverage',
        mimeType: 'application/json',
      },
      // Template resources for dynamic access
      {
        uri: 'memory://episodic/{id}',
        name: 'Episodic Memory Entry',
        description: 'Get a specific episodic memory by ID',
        mimeType: 'application/json',
      },
      {
        uri: 'memory://semantic/{schemaId}',
        name: 'Semantic Schema',
        description: 'Get a specific semantic schema by ID',
        mimeType: 'application/json',
      },
      {
        uri: 'memory://session/{agentId}',
        name: 'Agent Session Memory',
        description: 'Get session memory for a specific agent',
        mimeType: 'application/json',
      },
    ];

    return resources;
  }

  async readResource(uri) {
    const url = new URL(uri);
    const [_, category, identifier] = url.pathname.split('/');

    switch (category) {
      case 'episodic':
        return await this.readEpisodic(identifier);
      case 'semantic':
        return await this.readSemantic(identifier);
      case 'session':
        return await this.readSession(identifier);
      case 'swarm':
        return await this.readSwarmStats(identifier);
      default:
        throw new Error(`Unknown memory category: ${category}`);
    }
  }

  async readEpisodic(identifier) {
    if (identifier === 'list') {
      return await this.listEpisodicMemories();
    }

    // Read specific episodic memory
    const memoryFile = path.join(this.memoryPath, 'episodic', `${identifier}.json`);
    try {
      const content = await fs.readFile(memoryFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return mock data for demonstration
      return this._mockEpisodicMemory(identifier);
    }
  }

  async readSemantic(identifier) {
    if (identifier === 'list') {
      return await this.listSemanticSchemas();
    }

    // Read specific semantic schema
    const schemaFile = path.join(this.memoryPath, 'semantic', `${identifier}.json`);
    try {
      const content = await fs.readFile(schemaFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return mock data for demonstration
      return this._mockSemanticSchema(identifier);
    }
  }

  async readSession(identifier) {
    if (identifier === 'list') {
      return await this.listSessionMemories();
    }

    // Read specific agent session
    const sessionFile = path.join(this.memoryPath, 'sessions', `${identifier}.jsonl`);
    try {
      const content = await fs.readFile(sessionFile, 'utf-8');
      return content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    } catch (error) {
      // Return mock data for demonstration
      return this._mockSessionMemory(identifier);
    }
  }

  async readSwarmStats(identifier) {
    return {
      totalEpisodicMemories: await this._countEpisodicMemories(),
      totalSemanticSchemas: await this._countSemanticSchemas(),
      activeAgents: ['alpha', 'beta', 'charlie', 'steward', 'explorer', 'historian'],
      sharedMemories: 0,
      crossAgentLinks: 0,
      lastConsolidation: new Date().toISOString(),
      memoryCoverage: {
        triad: { memories: 0, schemas: 0 },
        advocates: { memories: 0, schemas: 0 },
        artisans: { memories: 0, schemas: 0 },
        synthesizers: { memories: 0, schemas: 0 },
      },
    };
  }

  async listEpisodicMemories() {
    const episodicDir = path.join(this.memoryPath, 'episodic');
    try {
      const files = await fs.readdir(episodicDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      // Return empty list if directory doesn't exist
      return [];
    }
  }

  async listSemanticSchemas() {
    const semanticDir = path.join(this.memoryPath, 'semantic');
    try {
      const files = await fs.readdir(semanticDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  async listSessionMemories() {
    const sessionsDir = path.join(this.memoryPath, 'sessions');
    try {
      const files = await fs.readdir(sessionsDir);
      return files
        .filter(f => f.endsWith('.jsonl'))
        .map(f => f.replace('.jsonl', ''));
    } catch (error) {
      return ['alpha', 'beta', 'charlie', 'steward', 'explorer', 'historian', 'coder', 'dreamer', 'empath', 'examiner', 'sentinel'];
    }
  }

  async _countEpisodicMemories() {
    const list = await this.listEpisodicMemories();
    return list.length;
  }

  async _countSemanticSchemas() {
    const list = await this.listSemanticSchemas();
    return list.length;
  }

  getTools() {
    return [
      {
        name: 'memory-search',
        description: 'Search across episodic and semantic memory using natural language queries',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query',
            },
            topK: {
              type: 'number',
              description: 'Number of results to return',
              default: 10,
            },
            memoryType: {
              type: 'string',
              enum: ['episodic', 'semantic', 'both'],
              description: 'Type of memory to search',
              default: 'both',
            },
            agentFilter: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by source agents',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'memory-read',
        description: 'Read a specific memory by ID or URI',
        inputSchema: {
          type: 'object',
          properties: {
            memoryId: {
              type: 'string',
              description: 'Memory identifier or URI',
            },
            memoryType: {
              type: 'string',
              enum: ['episodic', 'semantic', 'session'],
              description: 'Type of memory',
            },
          },
          required: ['memoryId'],
        },
      },
      {
        name: 'memory-stats',
        description: 'Get swarm memory statistics and coverage metrics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'memory-consolidate',
        description: 'Trigger memory consolidation from episodic to semantic',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Agent ID to consolidate memories for',
            },
            threshold: {
              type: 'number',
              description: 'Priority threshold for consolidation',
              default: 0.7,
            },
          },
          required: ['agentId'],
        },
      },
    ];
  }

  async callTool(name, args) {
    switch (name) {
      case 'memory-search':
        return await this.searchMemory(args);
      case 'memory-read':
        return await this.readMemoryById(args);
      case 'memory-stats':
        return await this.readSwarmStats();
      case 'memory-consolidate':
        return await this.consolidateMemory(args);
      default:
        return null;
    }
  }

  async searchMemory(args) {
    const { query, topK = 10, memoryType = 'both', agentFilter = [] } = args;
    
    // Mock search results - in production this would use vector search
    return {
      query,
      results: [
        {
          id: 'mem-search-001',
          type: 'episodic',
          content: `Memory related to: ${query}`,
          sourceAgent: agentFilter[0] || 'explorer',
          similarity: 0.92,
          timestamp: Date.now(),
        },
      ],
      totalFound: 1,
      searchType: memoryType,
    };
  }

  async readMemoryById(args) {
    const { memoryId, memoryType = 'episodic' } = args;
    
    let uri;
    if (memoryId.startsWith('memory://')) {
      uri = memoryId;
    } else {
      uri = `memory://${memoryType}/${memoryId}`;
    }
    
    return await this.readResource(uri);
  }

  async consolidateMemory(args) {
    const { agentId, threshold = 0.7 } = args;
    
    return {
      status: 'consolidated',
      agentId,
      threshold,
      memoriesProcessed: 0,
      memoriesPromoted: 0,
      schemasUpdated: [],
      timestamp: Date.now(),
    };
  }

  // Mock data generators for demonstration
  _mockEpisodicMemory(id) {
    return {
      id: id || `mem-${Date.now()}`,
      sourceAgent: 'explorer',
      sessionId: `session-${Date.now()}`,
      content: {
        text: 'Episodic memory content - this is a demonstration entry',
        embedding: Array(768).fill(0),
        metadata: {
          conversationContext: 'Demonstration context',
          emotionalMarkers: {
            surprise: 0.3,
            reward: 0.5,
            novelty: 0.7,
          },
        },
      },
      priority: {
        emotionalScore: 0.5,
        frequencyScore: 0.3,
        semanticScore: 0.6,
        swarmRelevance: 0.8,
      },
      accessControl: {
        owner: 'explorer',
        readPermissions: ['TRIAD', 'MEMORY_KEEPER'],
        writePermissions: ['explorer'],
      },
      timestamps: {
        created: Date.now(),
        lastAccessed: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      },
      consolidation: {
        status: 'pending',
        promotedToSemantic: false,
        schemaLinks: [],
      },
    };
  }

  _mockSemanticSchema(id) {
    return {
      id: id || `schema-${Date.now()}`,
      concept: 'demonstration_concept',
      contributors: [
        { agent: 'explorer', memoryCount: 5, confidence: 0.9 },
        { agent: 'historian', memoryCount: 3, confidence: 0.85 },
      ],
      abstraction: {
        level: 1,
        summary: 'This is a demonstration semantic schema',
        keyConcepts: ['demo', 'schema', 'knowledge'],
        relationships: [
          { to: 'related-schema-1', type: 'extends' },
          { to: 'related-schema-2', type: 'implements' },
        ],
      },
      provenance: {
        firstObserved: Date.now() - 86400000,
        lastUpdated: Date.now(),
        consolidationCycles: 2,
      },
      accessControl: {
        readPermissions: ['ALL_AGENTS'],
        writePermissions: ['historian'],
      },
    };
  }

  _mockSessionMemory(agentId) {
    return [
      {
        role: 'user',
        content: 'Hello, this is a demonstration session message',
        timestamp: Date.now() - 60000,
      },
      {
        role: 'assistant',
        content: 'This is a demonstration response from the agent',
        timestamp: Date.now(),
      },
    ];
  }
}

module.exports = { MemoryResourceHandler };
