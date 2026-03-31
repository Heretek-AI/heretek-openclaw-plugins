# Phase 9: Plugin Expansion Documentation

## Overview

Phase 9 expands the OpenClaw system with additional RAG plugins, external API connectors via MCP, and custom skill extensions. This documentation covers the installed plugins, their configuration, and usage patterns.

## Table of Contents

1. [RAG Plugins](#rag-plugins)
2. [MCP Connectors](#mcp-connectors)
3. [Skill Extensions](#skill-extensions)
4. [Configuration](#configuration)
5. [API Reference](#api-reference)
6. [Integration Examples](#integration-examples)

---

## RAG Plugins

### 1. Hybrid Search Plugin (`openclaw-hybrid-search-plugin`)

**Location:** `plugins/openclaw-hybrid-search-plugin/`

**Description:** Advanced hybrid search combining vector, keyword, and graph-based retrieval for enhanced RAG capabilities.

#### Features

- **Vector Search:** Semantic search using embeddings with LRU caching
- **Keyword Search:** Lexical search using BM25 and TF-IDF algorithms
- **Graph Search:** Relationship-based traversal through knowledge graphs
- **Hybrid Fusion:** Weighted Reciprocal Rank Fusion (RRF) for result combination
- **Cross-Reference Linking:** Automatic linking between related documents
- **Reranking:** Cross-encoder style result refinement

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HybridSearchPlugin                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ VectorSearch │  │ KeywordSearch│  │  GraphSearch │      │
│  │   Module     │  │   Module     │  │   Module     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  HybridFusion   │                        │
│                  │   (RRF + Rank)  │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │ CrossReference  │                        │
│                  │    Linker       │                        │
│                  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

#### Usage Example

```javascript
const HybridSearchPlugin = require('@heretek-ai/openclaw-hybrid-search-plugin');

const search = new HybridSearchPlugin({
  vectorWeight: 0.5,
  keywordWeight: 0.3,
  graphWeight: 0.2,
  topK: 10,
  enableReranking: true
});

await search.initialize();

// Index a document
await search.index({
  id: 'doc-1',
  content: 'Document content here',
  metadata: { type: 'article', source: 'web' }
});

// Perform hybrid search
const results = await search.search('query terms', {
  topK: 10,
  filters: { type: 'article' }
});

console.log(results);
// Each result includes:
// - id, content, combinedScore
// - individualScores (vector, keyword, graph)
// - sources (which methods matched)
// - crossReferences (related documents)
```

#### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `vectorWeight` | 0.5 | Weight for vector search results in fusion |
| `keywordWeight` | 0.3 | Weight for keyword search results in fusion |
| `graphWeight` | 0.2 | Weight for graph search results in fusion |
| `topK` | 10 | Default number of results to return |
| `minScore` | 0.3 | Minimum score threshold for results |
| `enableReranking` | true | Enable cross-encoder style reranking |

---

### 2. Multi-Document Retrieval Plugin (`openclaw-multi-doc-retrieval`)

**Location:** `plugins/openclaw-multi-doc-retrieval/`

**Description:** Multi-document retrieval with pipeline orchestration for complex RAG operations.

#### Features

- **Pipeline Orchestration:** Multi-stage document processing
- **Context Building:** Intelligent context construction from multiple documents
- **Citation Tracking:** Automatic citation generation and tracking
- **Document Fusion:** Combining results from multiple sources

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               MultiDocRetrievalPlugin                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ DocumentPipeline │  │RetrievalOrchestr.│                │
│  │  - fetch         │  │  - multi-source  │                │
│  │  - filter        │  │  - deduplication │                │
│  │  - rank          │  │  - scoring       │                │
│  │  - transform     │  └──────────────────┘                │
│  │  - aggregate     │                                      │
│  └──────────────────┘  ┌──────────────────┐                │
│                        │ ContextBuilder   │                │
│  ┌──────────────────┐  │  - concatenation │                │
│  │CitationTracker   │  │  - truncation    │                │
│  │  - tracking      │  │  - formatting    │                │
│  │  - formatting    │  └──────────────────┘                │
│  │  - styles        │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Usage Example

```javascript
const MultiDocRetrieval = require('@heretek-ai/openclaw-multi-doc-retrieval');

const retrieval = new MultiDocRetrieval({
  maxDocuments: 20,
  maxContextLength: 8000,
  enableCitations: true
});

await retrieval.initialize();

// Retrieve with full context
const result = await retrieval.retrieve('research query', {
  maxDocuments: 15,
  maxContextLength: 4000,
  sources: ['vector', 'keyword', 'graph'],
  enableCitations: true
});

console.log(result);
// Returns:
// {
//   query: 'research query',
//   documents: [...],
//   context: 'Built context string...',
//   citations: { citations: [...], citationMap: {...} },
//   metadata: { retrievalTime, documentCount, contextLength, sources }
// }
```

#### Pipeline Stages

```javascript
// Custom pipeline execution
const pipelineResult = await retrieval.executePipeline('query', [
  { name: 'fetch', type: 'fetch', config: { sources: ['vector'] } },
  { name: 'filter', type: 'filter', config: { field: 'type', operator: 'eq', value: 'article' } },
  { name: 'rank', type: 'rank', config: { field: 'score', order: 'desc' } },
  { name: 'limit', type: 'filter', config: { field: 'index', operator: 'lt', value: 10 } }
]);
```

---

## MCP Connectors

### OpenClaw MCP Connectors Plugin (`openclaw-mcp-connectors`)

**Location:** `plugins/openclaw-mcp-connectors/`

**Description:** Model Context Protocol (MCP) connectors for external service integration with comprehensive API management.

#### Features

- **MCP Client:** Full Model Context Protocol implementation
- **API Authentication:** Bearer, Basic, API Key, HMAC, and OAuth2 support
- **Response Caching:** LRU cache with TTL and stale-while-revalidate
- **Rate Limiting:** Token bucket algorithm with per-server configuration
- **API Abstraction:** Unified interface for external APIs

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  MCPConnectorsPlugin                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  MCPClient   │  │APIAuthentic. │  │ResponseCache │      │
│  │  - connect   │  │  - bearer    │  │  - LRU cache │      │
│  │  - call      │  │  - basic     │  │  - TTL       │      │
│  │  - resources │  │  - apikey    │  │  - stale SWR │      │
│  │  - tools     │  │  - hmac      │  └──────────────┘      │
│  │  - prompts   │  │  - oauth2    │                        │
│  └──────────────┘  └──────────────┘  ┌──────────────┐      │
│                                       │ RateLimiter  │      │
│  ┌──────────────┐                    │  - token     │      │
│  │ APIAbstraction│                   │  - bucket    │      │
│  │  - register  │                    │  - per-server│      │
│  │  - call      │                    └──────────────┘      │
│  │  - transform │                                          │
│  └──────────────┘  ┌──────────────┐                        │
│                    │ Unified API  │                        │
│                    │  Layer       │                        │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

#### Usage Example

```javascript
const MCPConnectors = require('@heretek-ai/openclaw-mcp-connectors');

const connectors = new MCPConnectors();
await connectors.initialize();

// Connect to MCP server
await connectors.connect('my-server', {
  transportType: 'stdio',
  command: '/path/to/server',
  capabilities: ['resources', 'tools', 'prompts']
});

// Configure authentication
await connectors.configureAuth('api-server', {
  type: 'bearer',
  token: 'your-access-token',
  expiresIn: 3600
});

// Make API request with caching and rate limiting
const response = await connectors.request('api-server', '/api/data', {
  method: 'GET',
  params: { filter: 'active' },
  useCache: true,
  ttl: 300000
});

// Register and call API abstraction
await connectors.registerAPI('weather-api', {
  baseUrl: 'https://api.weather.com',
  authentication: { type: 'apikey', apiKey: 'xxx' },
  operations: {
    getCurrent: {
      method: 'GET',
      path: '/v1/current/{location}',
      cacheable: true,
      cacheTTL: 300000
    }
  }
});

const weather = await connectors.callAPI('weather-api', 'getCurrent', {
  location: 'london'
});
```

#### Authentication Types

| Type | Description | Configuration |
|------|-------------|---------------|
| `bearer` | Bearer token authentication | `{ type: 'bearer', token: '...' }` |
| `basic` | HTTP Basic authentication | `{ type: 'basic', username: '...', password: '...' }` |
| `apikey` | API Key authentication | `{ type: 'apikey', apiKey: '...', headerName: 'X-API-Key' }` |
| `hmac` | HMAC signature authentication | `{ type: 'hmac', apiKey: '...', secret: '...' }` |
| `oauth2` | OAuth2 with token refresh | `{ type: 'oauth2', accessToken: '...', refreshToken: '...', expiresIn: N }` |

---

## Skill Extensions

### OpenClaw Skill Extensions Plugin (`openclaw-skill-extensions`)

**Location:** `plugins/openclaw-skill-extensions/`

**Description:** Custom skill extensions with composition, versioning, and workflow capabilities.

#### Features

- **Skill Registry:** Central registration and discovery
- **Skill Composition:** Combine multiple skills into complex operations
- **Skill Versioning:** Semantic versioning with rollback support
- **Workflow Skills:** Pre-built workflows for common operations
- **Skill Discovery:** Auto-discovery of skills in configured paths

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 SkillExtensionsPlugin                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │SkillRegistry │  │SkillComposer │  │SkillVersioner│      │
│  │  - register  │  │  - compose   │  │  - register  │      │
│  │  - discover  │  │  - parallel  │  │  - load      │      │
│  │  - list      │  │  - pipeline  │  │  - deprecate │      │
│  │  - tags      │  │  - sequential│  │  - semver    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 WorkflowSkills                       │  │
│  │  - document-processing                               │  │
│  │  - multi-agent-deliberation                          │  │
│  │  - backup-verify                                     │  │
│  │  - custom workflows                                  │  │
│  └───────────────────────────────────────────────��──────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Usage Example

```javascript
const SkillExtensions = require('@heretek-ai/openclaw-skill-extensions');

const skills = new SkillExtensions({
  autoDiscover: true,
  discoveryPaths: ['./skills', './custom-skills']
});

await skills.initialize();

// Register a custom skill
await skills.registerSkill('my-skill', {
  name: 'My Custom Skill',
  description: 'A custom skill for specific tasks',
  version: '1.0.0',
  tags: ['custom', 'utility'],
  handler: async (params, context) => {
    return { result: 'success', data: params };
  }
});

// Execute a skill
const result = await skills.executeSkill('my-skill', {
  input: 'data'
});

// Compose skills
await skills.composeSkill('composed-skill', [
  { skillId: 'skill-a', params: { mode: 'fast' } },
  { skillId: 'skill-b', outputMapping: true },
  { skillId: 'skill-c' }
], {
  sequence: 'sequential'
});

// Execute workflow
const workflowResult = await skills.executeWorkflow('document-processing', {
  document: {
    id: 'doc-1',
    content: 'Document text here'
  }
});
```

#### Built-in Workflows

| Workflow | Description | Steps |
|----------|-------------|-------|
| `document-processing` | Process documents through ingestion, analysis, and indexing | validate → extract → embed → index |
| `multi-agent-deliberation` | Coordinate deliberation between multiple agents | broadcast → aggregate → synthesize |
| `backup-verify` | Create backup and verify integrity | backup → verify → notify |

---

## Configuration

### Global Configuration

Create or update `plugins/plugin-config.json`:

```json
{
  "hybridSearch": {
    "vectorWeight": 0.5,
    "keywordWeight": 0.3,
    "graphWeight": 0.2,
    "topK": 10,
    "minScore": 0.3,
    "enableReranking": true
  },
  "multiDocRetrieval": {
    "maxDocuments": 20,
    "maxContextLength": 8000,
    "enableCitations": true,
    "pipelineTimeout": 30000
  },
  "mcpConnectors": {
    "defaultTimeout": 30000,
    "maxRetries": 3,
    "enableCache": true,
    "enableRateLimiting": true,
    "cache": {
      "maxSize": 1000,
      "defaultTTL": 300000
    },
    "rateLimit": {
      "defaultRateLimit": 10,
      "defaultBurstSize": 20
    }
  },
  "skillExtensions": {
    "enableComposition": true,
    "enableVersioning": true,
    "autoDiscover": true,
    "discoveryPaths": ["./skills", "./custom-skills"],
    "workflows": {
      "maxConcurrent": 10,
      "defaultTimeout": 60000
    }
  }
}
```

---

## API Reference

### Hybrid Search Plugin

| Method | Description | Parameters |
|--------|-------------|------------|
| `initialize()` | Initialize the plugin | - |
| `search(query, options)` | Perform hybrid search | `query`: string, `options`: object |
| `index(document)` | Index a document | `document`: object |
| `bulkIndex(documents)` | Bulk index documents | `documents`: array |
| `getStats()` | Get statistics | - |
| `clear()` | Clear all indices | - |

### Multi-Document Retrieval

| Method | Description | Parameters |
|--------|-------------|------------|
| `retrieve(query, options)` | Retrieve documents with context | `query`: string, `options`: object |
| `executePipeline(query, stages)` | Execute custom pipeline | `query`: string, `stages`: array |
| `addDocuments(documents)` | Add documents to index | `documents`: array |
| `getStats()` | Get statistics | - |

### MCP Connectors

| Method | Description | Parameters |
|--------|-------------|------------|
| `connect(serverId, config)` | Connect to MCP server | `serverId`: string, `config`: object |
| `disconnect(serverId)` | Disconnect from server | `serverId`: string |
| `request(serverId, endpoint, options)` | Make API request | `serverId`, `endpoint`, `options` |
| `registerAPI(apiId, definition)` | Register API abstraction | `apiId`: string, `definition`: object |
| `callAPI(apiId, operation, params)` | Call registered API | `apiId`, `operation`, `params` |
| `configureAuth(serverId, authConfig)` | Configure authentication | `serverId`, `authConfig` |

### Skill Extensions

| Method | Description | Parameters |
|--------|-------------|------------|
| `registerSkill(skillId, definition)` | Register a skill | `skillId`: string, `definition`: object |
| `executeSkill(skillId, params)` | Execute a skill | `skillId`: string, `params`: object |
| `composeSkill(composedId, skills, options)` | Compose skills | `composedId`, `skills`, `options` |
| `getSkillVersions(skillId)` | Get skill versions | `skillId`: string |
| `loadSkillVersion(skillId, version)` | Load specific version | `skillId`, `version` |
| `executeWorkflow(workflowName, params)` | Execute workflow | `workflowName`, `params` |

---

## Integration Examples

### Complete RAG Pipeline

```javascript
const HybridSearch = require('@heretek-ai/openclaw-hybrid-search-plugin');
const MultiDocRetrieval = require('@heretek-ai/openclaw-multi-doc-retrieval');
const MCPConnectors = require('@heretek-ai/openclaw-mcp-connectors');
const SkillExtensions = require('@heretek-ai/openclaw-skill-extensions');

async function completeRAGPipeline(query) {
  // Initialize all plugins
  const search = new HybridSearch();
  const retrieval = new MultiDocRetrieval();
  const connectors = new MCPConnectors();
  const skills = new SkillExtensions();
  
  await Promise.all([
    search.initialize(),
    retrieval.initialize(),
    connectors.initialize(),
    skills.initialize()
  ]);

  // Step 1: Hybrid search
  const searchResults = await search.search(query, { topK: 20 });

  // Step 2: Multi-document retrieval with context
  const retrieved = await retrieval.retrieve(query, {
    maxDocuments: 10,
    maxContextLength: 4000
  });

  // Step 3: Enrich with external API data
  const enrichedData = await connectors.callAPI('external-api', 'enrich', {
    query,
    documents: retrieved.documents
  });

  // Step 4: Process through skill workflow
  const processed = await skills.executeWorkflow('document-processing', {
    document: {
      id: 'combined',
      content: retrieved.context,
      metadata: { enriched: enrichedData }
    }
  });

  return {
    searchResults,
    retrieved,
    enriched: enrichedData,
    processed
  };
}
```

### Skill Composition for Complex Operations

```javascript
// Create a composed skill for document analysis
await skills.composeSkill('document-analysis', [
  { skillId: 'extract-entities', params: { types: ['person', 'org', 'location'] } },
  { skillId: 'sentiment-analysis', outputMapping: true },
  { skillId: 'summarize', params: { maxLength: 500 } },
  { skillId: 'generate-citations' }
], {
  sequence: 'pipeline',
  errorStrategy: 'continue',
  outputMapper: (results) => ({
    entities: results[0]?.result,
    sentiment: results[1]?.result,
    summary: results[2]?.result,
    citations: results[3]?.result
  })
});
```

---

## Plugin Status Summary

| Plugin | Status | Version | Capabilities |
|--------|--------|---------|--------------|
| `openclaw-hybrid-search-plugin` | ✅ Installed | 1.0.0 | vector-search, keyword-search, graph-search, hybrid-fusion, reranking |
| `openclaw-multi-doc-retrieval` | ✅ Installed | 1.0.0 | multi-document-retrieval, pipeline-orchestration, context-building, citation-tracking |
| `openclaw-mcp-connectors` | ✅ Installed | 1.0.0 | mcp-client, api-authentication, response-caching, rate-limiting, api-abstraction |
| `openclaw-skill-extensions` | ✅ Installed | 1.0.0 | workflow-skills, skill-composition, skill-versioning, skill-discovery |

---

## Next Steps

1. Configure plugin settings in `plugins/plugin-config.json`
2. Set up MCP server connections for external APIs
3. Create custom skills for project-specific workflows
4. Integrate plugins into the main OpenClaw system
5. Monitor plugin performance via `getStats()` methods
