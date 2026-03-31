# OpenClaw Plugins Documentation

This directory contains documentation for Phase 9 plugin expansion capabilities.

## Plugins Overview

### RAG Plugins

1. **[Hybrid Search Plugin](./PLUGIN_EXPANSION.md#1-hybrid-search-plugin-openclaw-hybrid-search-plugin)**
   - Vector + Keyword + Graph search
   - Hybrid fusion with RRF
   - Cross-reference linking

2. **[Multi-Document Retrieval Plugin](./PLUGIN_EXPANSION.md#2-multi-document-retrieval-plugin-openclaw-multi-doc-retrieval)**
   - Pipeline orchestration
   - Context building
   - Citation tracking

### API Connectors

3. **[MCP Connectors Plugin](./PLUGIN_EXPANSION.md#openclaw-mcp-connectors-plugin-openclaw-mcp-connectors)**
   - Model Context Protocol client
   - API authentication (Bearer, Basic, API Key, HMAC, OAuth2)
   - Response caching with TTL
   - Rate limiting with token bucket
   - Unified API abstraction layer

### Skill Extensions

4. **[Skill Extensions Plugin](./PLUGIN_EXPANSION.md#openclaw-skill-extensions-plugin-openclaw-skill-extensions)**
   - Skill registry and discovery
   - Skill composition (parallel, sequential, pipeline)
   - Semantic versioning
   - Built-in workflows

## Quick Start

```javascript
// Initialize all Phase 9 plugins
const HybridSearch = require('@heretek-ai/openclaw-hybrid-search-plugin');
const MultiDocRetrieval = require('@heretek-ai/openclaw-multi-doc-retrieval');
const MCPConnectors = require('@heretek-ai/openclaw-mcp-connectors');
const SkillExtensions = require('@heretek-ai/openclaw-skill-extensions');

const plugins = {
  search: new HybridSearch(),
  retrieval: new MultiDocRetrieval(),
  connectors: new MCPConnectors(),
  skills: new SkillExtensions()
};

await Promise.all(Object.values(plugins).map(p => p.initialize()));
```

## Documentation

- [Full Plugin Expansion Documentation](./PLUGIN_EXPANSION.md) - Complete documentation with architecture diagrams and API reference

## Configuration

See [Configuration Section](./PLUGIN_EXPANSION.md#configuration) in the main documentation for detailed configuration options.

## Plugin Directory Structure

```
plugins/
├── openclaw-hybrid-search-plugin/
│   ├── src/
│   │   ├── index.js
│   │   ├── vector-search.js
│   │   ├── keyword-search.js
│   │   ├── graph-search.js
│   │   ├── hybrid-fusion.js
│   │   └── cross-reference-linker.js
│   ├── package.json
│   ├── README.md
│   └── SKILL.md
├── openclaw-multi-doc-retrieval/
│   ├── src/
│   │   ├── index.js
│   │   ├── document-pipeline.js
│   │   ├── context-builder.js
│   │   ├── citation-tracker.js
│   │   └── retrieval-orchestrator.js
│   ├── package.json
│   └── README.md
├── openclaw-mcp-connectors/
│   ├── src/
│   │   ├── index.js
│   │   ├── mcp-client.js
│   │   ├── api-authenticator.js
│   │   ├── response-cache.js
│   │   ├── rate-limiter.js
│   │   └── api-abstraction.js
│   ├── package.json
│   └── README.md
└── openclaw-skill-extensions/
    ├── src/
    │   ├── index.js
    │   ├── skill-registry.js
    │   ├── skill-composer.js
    │   ├── skill-versioner.js
    │   └── workflow-skills.js
    ├── package.json
    └── README.md
```
