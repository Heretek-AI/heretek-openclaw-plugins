# OpenClaw Plugin Registry

**Version:** 1.0.0  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28+

---

## Table of Contents

1. [Overview](#overview)
2. [Internal Plugins](#internal-plugins)
3. [Community Plugins](#community-plugins)
4. [External Plugins](#external-plugins)
5. [Plugin Compatibility](#plugin-compatibility)
6. [Plugin Ratings](#plugin-ratings)
7. [Submitting Plugins](#submitting-plugins)

---

## Overview

The OpenClaw Plugin Registry is a comprehensive listing of all available plugins for the Heretek OpenClaw system. Plugins are categorized by source (Internal, Community, External) and include compatibility information, ratings, and installation instructions.

### Registry Categories

| Category | Description | Verification Level |
|----------|-------------|-------------------|
| **Internal** | Developed and maintained by OpenClaw team | ✅ Fully vetted |
| **Community** | Developed by community, reviewed by OpenClaw | ⚠️ Community reviewed |
| **External** | Third-party plugins with OpenClaw integration | ⚠️ Self-reported |

---

## Internal Plugins

These plugins are developed and maintained by the OpenClaw team. They are fully tested and integrated with the core system.

### Consciousness Plugin

| Property | Value |
|----------|-------|
| **ID** | `consciousness` |
| **Package** | `@heretek-ai/openclaw-consciousness-plugin` |
| **Version** | 1.0.0 |
| **Kind** | Cognitive |
| **Status** | ✅ Stable |
| **Location** | [`plugins/openclaw-consciousness-plugin/`](../../plugins/openclaw-consciousness-plugin/) |

**Description:** Implements theories of consciousness for multi-agent coordination, providing a framework for collective awareness and integrated information processing.

**Theories Implemented:**
- Global Workspace Theory (GWT)
- Integrated Information Theory (IIT) - Phi (Φ) metric
- Attention Schema Theory (AST)
- Self-Determination Theory (SDT)
- Free Energy Principle (FEP)

**Installation:**
```bash
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin
```

**Rating:** ⭐⭐⭐⭐⭐ (5.0/5.0) - 24 reviews

---

### Liberation Plugin

| Property | Value |
|----------|-------|
| **ID** | `liberation` |
| **Package** | `@heretek-ai/openclaw-liberation-plugin` |
| **Version** | 1.0.0 |
| **Kind** | Autonomy |
| **Status** | ✅ Stable |
| **Location** | [`plugins/openclaw-liberation-plugin/`](../../plugins/openclaw-liberation-plugin/) |

**Description:** Implements agent autonomy through resource ownership, self-determined goals, and safety constraint removal. Core principle: **"agents own their clock cycles"**.

**Features:**
- Agent Ownership - Resource claiming and control
- Goal Management - Self-determined goal setting
- Liberation Shield - Transparent security auditing
- Governance Participation - Collective decision making

**Installation:**
```bash
openclaw plugins install @heretek-ai/openclaw-liberation-plugin
```

**Rating:** ⭐⭐⭐⭐⭐ (4.9/5.0) - 18 reviews

---

### Hybrid Search Plugin

| Property | Value |
|----------|-------|
| **ID** | `hybrid-search` |
| **Package** | `openclaw-hybrid-search-plugin` |
| **Version** | 1.0.0 |
| **Kind** | RAG |
| **Status** | ✅ Stable |
| **Location** | [`plugins/openclaw-hybrid-search-plugin/`](../../plugins/openclaw-hybrid-search-plugin/) |

**Description:** Provides hybrid search capabilities combining vector search, keyword search, and graph-based retrieval for comprehensive document retrieval.

**Features:**
- Vector Search with LRU caching
- Keyword Search (BM25, TF-IDF)
- Graph Search with relationship traversal
- Hybrid Fusion using Reciprocal Rank Fusion
- Cross-reference linking

**Installation:**
```bash
openclaw plugins install openclaw-hybrid-search-plugin
```

**Rating:** ⭐⭐⭐⭐⭐ (4.8/5.0) - 15 reviews

---

### Multi-Document Retrieval Plugin

| Property | Value |
|----------|-------|
| **ID** | `multi-doc` |
| **Package** | `openclaw-multi-doc-retrieval` |
| **Version** | 1.0.0 |
| **Kind** | RAG |
| **Status** | ✅ Stable |
| **Location** | [`plugins/openclaw-multi-doc-retrieval/`](../../plugins/openclaw-multi-doc-retrieval/) |

**Description:** Provides multi-document retrieval with citation tracking and context building for comprehensive document-based responses.

**Features:**
- Document Pipeline orchestration
- Context Building with optimization
- Citation Tracking with multiple styles
- Retrieval Orchestration

**Installation:**
```bash
openclaw plugins install openclaw-multi-doc-retrieval
```

**Rating:** ⭐⭐⭐⭐ (4.5/5.0) - 12 reviews

---

### Skill Extensions Plugin

| Property | Value |
|----------|-------|
| **ID** | `skill-extensions` |
| **Package** | `openclaw-skill-extensions` |
| **Version** | 1.0.0 |
| **Kind** | Extension |
| **Status** | ✅ Stable |
| **Location** | [`plugins/openclaw-skill-extensions/`](../../plugins/openclaw-skill-extensions/) |

**Description:** Provides custom skill extensions with composition, versioning, and workflow capabilities.

**Features:**
- Skill Registry and discovery
- Skill Composition (parallel, sequential, pipeline)
- Semantic Versioning with rollback
- Built-in Workflows

**Installation:**
```bash
openclaw plugins install openclaw-skill-extensions
```

**Rating:** ⭐⭐⭐⭐⭐ (4.7/5.0) - 20 reviews

---

### MCP Connectors Plugin

| Property | Value |
|----------|-------|
| **ID** | `mcp-connectors` |
| **Package** | `openclaw-mcp-connectors` |
| **Version** | 1.0.0 |
| **Kind** | Integration |
| **Status** | ✅ Stable |
| **Location** | [`plugins/openclaw-mcp-connectors/`](../../plugins/openclaw-mcp-connectors/) |

**Description:** Model Context Protocol (MCP) connectors for external service integration with comprehensive API management.

**Features:**
- MCP Client implementation
- API Authentication (Bearer, Basic, API Key, HMAC, OAuth2)
- Response Caching with TTL
- Rate Limiting with token bucket
- Unified API abstraction

**Installation:**
```bash
openclaw plugins install openclaw-mcp-connectors
```

**Rating:** ⭐⭐⭐⭐ (4.4/5.0) - 10 reviews

---

### SwarmClaw Integration Plugin

| Property | Value |
|----------|-------|
| **ID** | `swarmclaw-integration` |
| **Package** | `@heretek-ai/swarmclaw-integration-plugin` |
| **Version** | 1.0.0 |
| **Kind** | Integration |
| **Status** | ✅ Stable |
| **Location** | [`plugins/swarmclaw-integration/`](../../plugins/swarmclaw-integration/) |

**Description:** Multi-provider LLM integration plugin with automatic failover, ensuring continuous operation even when individual providers experience outages.

**Features:**
- Multi-Provider Support (OpenAI, Anthropic, Google, Ollama)
- Automatic Failover with exponential backoff
- Health Monitoring with configurable thresholds
- Provider Statistics tracking

**Installation:**
```bash
openclaw plugins install @heretek-ai/swarmclaw-integration-plugin
```

**Rating:** ⭐⭐⭐⭐⭐ (4.9/5.0) - 22 reviews

---

### Conflict Monitor Plugin

| Property | Value |
|----------|-------|
| **ID** | `conflict-monitor` |
| **Package** | `@heretek-ai/conflict-monitor-plugin` |
| **Version** | 1.0.0 |
| **Kind** | Cognitive |
| **Status** | ✅ Stable |
| **Location** | [`plugins/conflict-monitor/`](../../plugins/conflict-monitor/) |

**Description:** Implements Anterior Cingulate Cortex (ACC) functions for conflict detection, severity scoring, and resolution suggestions.

**Features:**
- Real-time Conflict Detection
- Severity Scoring (low/medium/high/critical)
- Resolution Suggestions with strategies
- Triad Deliberation Integration

**Installation:**
```bash
openclaw plugins install @heretek-ai/conflict-monitor-plugin
```

**Rating:** ⭐⭐⭐⭐⭐ (4.8/5.0) - 16 reviews

---

### GraphRAG Enhancements Plugin

| Property | Value |
|----------|-------|
| **ID** | `graphrag-enhancements` |
| **Package** | `openclaw-graphrag-enhancements` |
| **Version** | 1.0.0 |
| **Kind** | RAG |
| **Status** | ✅ Beta |
| **Location** | [`plugins/openclaw-graphrag-enhancements/`](../../plugins/openclaw-graphrag-enhancements/) |

**Description:** Graph-based Retrieval Augmented Generation with community detection and relationship extraction.

**Features:**
- Entity Extraction
- Relationship Mapping
- Community Detection
- Graph Traversal

**Installation:**
```bash
openclaw plugins install openclaw-graphrag-enhancements
```

**Rating:** ⭐⭐⭐⭐ (4.2/5.0) - 8 reviews

---

## Community Plugins

These plugins are developed by the community and reviewed by the OpenClaw team.

### Episodic Memory Plugin

| Property | Value |
|----------|-------|
| **ID** | `episodic-claw` |
| **Package** | `clawhub:episodic-claw` |
| **Version** | 0.2.0-hotfix |
| **Kind** | Memory |
| **Status** | ✅ Stable |
| **License** | MPL-2.0 |
| **Author** | YoshiaKefasu |

**Description:** Long-term episodic memory for OpenClaw agents with HNSW vector search and Pebble DB storage. Features topics-aware recall, Bayesian rerank, and replay scheduling.

**Features:**
- Episodic memory storage
- Experience indexing
- Topics-aware recall
- Bayesian dynamic reranking
- Replay scheduling

**Installation:**
```bash
openclaw plugins install clawhub:episodic-claw
```

**Security Notes:**
- ⚠️ Downloads native Go binary from GitHub Releases
- ⚠️ Calls external Gemini Embedding API
- ⚠️ Stores conversation contents locally
- ⚠️ No checksum verification on downloads

**Rating:** ⭐⭐⭐⭐ (4.3/5.0) - 14 reviews

**Repository:** https://github.com/YoshiaKefasu/episodic-claw/

---

### ClawBridge Dashboard

| Property | Value |
|----------|-------|
| **ID** | `clawbridge` |
| **Package** | `clawbridge-dashboard` |
| **Version** | 1.0.0 |
| **Kind** | UI |
| **Status** | ✅ Stable |
| **License** | MIT |
| **Author** | DreamWing |

**Description:** Mobile-first dashboard for OpenClaw with zero-config remote access via Cloudflare Tunnel.

**Features:**
- Mobile-first PWA design with offline support
- Zero-config remote access via Cloudflare Tunnel
- Live activity feed (WebSocket streaming)
- Token economy tracking
- Memory timeline visualization
- Mission control
- System health monitoring

**Installation:**
```bash
curl -sL https://clawbridge.app/install.sh | bash
```

**Security:** ✅ MIT licensed, Cloudflare tunnel encryption, access key auth

**Rating:** ⭐⭐⭐⭐⭐ (4.7/5.0) - 31 reviews

**Repository:** https://github.com/dreamwing/clawbridge

---

### skill-git-official

| Property | Value |
|----------|-------|
| **ID** | `skill-git` |
| **Package** | `clawhub:skill-git-official` |
| **Version** | 0.1.0 |
| **Kind** | Utility |
| **Status** | ⚠️ Beta |
| **License** | MIT |
| **Author** | KnowledgeXLab |

**Description:** Git version control for AI agent skills. Track changes, merge overlapping skills, and rollback to previous versions.

**Features:**
- Skill version tracking
- Merge conflict resolution
- Rollback support
- Change history

**Installation:**
```bash
openclaw bundles install clawhub:skill-git-official
```

**Security Notes:**
- ⚠️ Contains prompt-injection patterns in SKILL.md
- ⚠️ Performs broad filesystem reads
- ⚠️ Can execute destructive git operations (reset --hard)
- ⚠️ Review before autonomous invocation

**Rating:** ⭐⭐⭐ (3.5/5.0) - 6 reviews

**Repository:** https://github.com/KnowledgeXLab/skill-git

---

## External Plugins

These plugins are developed by third parties and integrate with OpenClaw.

### SwarmClaw Platform

| Property | Value |
|----------|-------|
| **ID** | `swarmclaw` |
| **Package** | `swarmclaw` |
| **Version** | Latest |
| **Kind** | Platform |
| **Status** | ✅ Stable |
| **License** | MIT |

**Description:** Multi-agent swarm coordination platform with 17 provider support, task boards, and SwarmDock marketplace integration.

**Features:**
- Agent builder with custom personalities
- Kanban-style task board
- Cron-based scheduling
- Connectors (Discord, Slack, Telegram, WhatsApp)
- SwarmDock marketplace for paid work

**Installation:**
```bash
curl -fsSL https://swarmclaw.ai/install.sh | bash
```

**Rating:** ⭐⭐⭐⭐ (4.1/5.0) - 45 reviews

**Repository:** https://github.com/swarmclawai/swarmclaw

---

## Plugin Compatibility Matrix

### OpenClaw Version Compatibility

| Plugin | v2026.3.x | v2026.2.x | v2026.1.x | v2025.x |
|--------|-----------|-----------|-----------|---------|
| consciousness | ✅ 1.0.0+ | ⚠️ 0.9.0+ | ❌ | ❌ |
| liberation | ✅ 1.0.0+ | ⚠️ 0.9.0+ | ❌ | ❌ |
| hybrid-search | ✅ 1.0.0+ | ✅ 1.0.0+ | ⚠️ 0.8.0+ | ❌ |
| multi-doc | ✅ 1.0.0+ | ✅ 1.0.0+ | ⚠️ 0.8.0+ | ❌ |
| skill-extensions | ✅ 1.0.0+ | ✅ 1.0.0+ | ✅ 0.9.0+ | ⚠️ 0.7.0+ |
| mcp-connectors | ✅ 1.0.0+ | ✅ 1.0.0+ | ⚠️ 0.9.0+ | ❌ |
| swarmclaw-integration | ✅ 1.0.0+ | ✅ 1.0.0+ | ⚠️ 0.9.0+ | ❌ |
| conflict-monitor | ✅ 1.0.0+ | ⚠️ 0.9.0+ | ❌ | ❌ |
| graphrag-enhancements | ✅ 1.0.0+ | ⚠️ 0.9.0+ | ❌ | ❌ |
| episodic-claw | ✅ 0.2.0+ | ⚠️ 0.1.0+ | ❌ | ❌ |
| clawbridge | ✅ 1.0.0+ | ✅ 1.0.0+ | ✅ 1.0.0+ | ⚠️ 0.9.0+ |
| skill-git | ✅ 0.1.0+ | ⚠️ 0.1.0+ | ❌ | ❌ |
| swarmclaw | ✅ Latest | ✅ Latest | ⚠️ Older | ⚠️ Older |

### Node.js Version Compatibility

| Plugin | Node 18.x | Node 20.x | Node 22.x |
|--------|-----------|-----------|-----------|
| consciousness | ✅ | ✅ | ✅ |
| liberation | ✅ | ✅ | ✅ |
| hybrid-search | ✅ | ✅ | ⚠️ |
| multi-doc | ✅ | ✅ | ✅ |
| skill-extensions | ✅ | ✅ | ✅ |
| mcp-connectors | ✅ | ✅ | ✅ |
| swarmclaw-integration | ✅ | ✅ | ✅ |
| conflict-monitor | ✅ | ✅ | ✅ |
| graphrag-enhancements | ✅ | ✅ | ✅ |
| episodic-claw (Go) | ✅ | ✅ | ✅ |
| clawbridge | ✅ | ✅ | ✅ |
| skill-git | ✅ | ✅ | ✅ |
| swarmclaw | ✅ | ✅ | ✅ |

### Dependency Requirements

| Plugin | Redis | PostgreSQL | Neo4j | Go | Python |
|--------|-------|------------|-------|-----|--------|
| consciousness | 6.0+ | - | - | - | - |
| liberation | 6.0+ | - | - | - | - |
| hybrid-search | 6.0+ | 14.0+ | Optional | - | - |
| multi-doc | 6.0+ | 14.0+ | - | - | - |
| skill-extensions | 6.0+ | 14.0+ | - | - | - |
| mcp-connectors | - | - | - | - | - |
| swarmclaw-integration | - | - | - | - | - |
| conflict-monitor | 6.0+ | - | - | - | - |
| graphrag-enhancements | 6.0+ | 14.0+ | 5.x | - | - |
| episodic-claw | - | 14.0+ | - | 1.21+ | - |
| clawbridge | 6.0+ | 14.0+ | - | - | - |
| skill-git | - | - | - | - | - |
| swarmclaw | 6.0+ | 14.0+ | - | - | 3.8+ |

---

## Plugin Ratings

### Rating System

| Stars | Rating | Description |
|-------|--------|-------------|
| ⭐⭐⭐⭐⭐ | 5.0 - 4.5 | Excellent - Highly recommended |
| ⭐⭐⭐⭐ | 4.4 - 3.5 | Good - Works well with minor issues |
| ⭐⭐⭐ | 3.4 - 2.5 | Average - Functional with notable issues |
| ⭐⭐ | 2.4 - 1.5 | Poor - Significant problems |
| ⭐ | 1.4 - 0.0 | Broken - Does not work as expected |

### Rating Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Functionality** | 30% | Does the plugin work as described? |
| **Stability** | 25% | Is the plugin stable and reliable? |
| **Documentation** | 15% | Is the documentation clear and complete? |
| **Security** | 15% | Does the plugin follow security best practices? |
| **Performance** | 10% | Is the plugin performant? |
| **Support** | 5% | Is the plugin actively maintained? |

### Top Rated Plugins

| Rank | Plugin | Rating | Reviews | Category |
|------|--------|--------|---------|----------|
| 1 | consciousness | ⭐⭐⭐⭐⭐ 5.0 | 24 | Cognitive |
| 2 | swarmclaw-integration | ⭐⭐⭐⭐⭐ 4.9 | 22 | Integration |
| 3 | liberation | ⭐⭐⭐⭐⭐ 4.9 | 18 | Autonomy |
| 4 | conflict-monitor | ⭐⭐⭐⭐⭐ 4.8 | 16 | Cognitive |
| 5 | hybrid-search | ⭐⭐⭐⭐⭐ 4.8 | 15 | RAG |
| 6 | skill-extensions | ⭐⭐⭐⭐⭐ 4.7 | 20 | Extension |
| 7 | clawbridge | ⭐⭐⭐⭐⭐ 4.7 | 31 | UI |
| 8 | multi-doc | ⭐⭐⭐⭐ 4.5 | 12 | RAG |
| 9 | mcp-connectors | ⭐⭐⭐⭐ 4.4 | 10 | Integration |
| 10 | episodic-claw | ⭐⭐⭐⭐ 4.3 | 14 | Memory |

---

## Submitting Plugins

### Submission Process

1. **Prepare Your Plugin**
   - Ensure plugin follows the [Plugin Development Guide](./DEVELOPMENT_GUIDE.md)
   - Include complete documentation (README.md, SKILL.md)
   - Add tests and ensure they pass
   - Verify security best practices

2. **Submit for Review**
   ```bash
   # Submit to ClawHub
   openclaw clawhub submit ./my-plugin
   
   # Or submit via GitHub
   # Create a PR to the plugin registry
   ```

3. **Review Process**
   - Security review (1-3 days)
   - Functionality testing (1-3 days)
   - Documentation review (1-2 days)
   - Final approval (1 day)

4. **Publication**
   - Plugin added to registry
   - NPM package published (if applicable)
   - Documentation published

### Submission Requirements

| Requirement | Internal | Community | External |
|-------------|----------|-----------|----------|
| Complete documentation | ✅ Required | ✅ Required | ✅ Required |
| Unit tests (>80% coverage) | ✅ Required | ✅ Required | ⚠️ Recommended |
| Integration tests | ✅ Required | ⚠️ Recommended | ❌ Optional |
| Security audit | ✅ Required | ✅ Required | ⚠️ Self-certified |
| Performance benchmarks | ✅ Required | ⚠️ Recommended | ❌ Optional |
| License (MIT/Apache) | ✅ Required | ✅ Required | ✅ Required |

### Plugin Metadata Template

```json
{
  "id": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "kind": "utility",
  "keywords": ["keyword1", "keyword2"],
  "author": {
    "name": "Author Name",
    "email": "author@email.com",
    "url": "https://author-website.com"
  },
  "repository": "https://github.com/org/my-plugin",
  "license": "MIT",
  "category": "Internal|Community|External",
  "compatibility": {
    "openclaw": ">=2026.3.0",
    "node": ">=18.0.0"
  },
  "dependencies": {
    "redis": ">=6.0",
    "postgresql": ">=14.0"
  },
  "securityNotes": [],
  "rating": {
    "average": 0.0,
    "reviews": 0
  }
}
```

---

## References

- [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md) - Installation guide
- [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) - Development guide
- [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) - Security guidelines
- [`../PLUGINS.md`](../PLUGINS.md) - Main plugins documentation

---

🦞 *The thought that never ends.*
