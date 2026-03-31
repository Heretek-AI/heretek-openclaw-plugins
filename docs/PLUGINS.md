# Heretek OpenClaw Plugins

**Version:** 2.0.3  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28

---

## Overview

OpenClaw plugins extend the Gateway functionality by providing additional capabilities to all agents in the collective. Plugins are NPM-based modules that integrate with the Gateway's plugin system.

### Plugin Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Plugin Layer                            │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐         │ │
│  │  │ Consciousness       │  │ Liberation          │         │ │
│  │  │ - Global Workspace  │  │ - Agent Ownership   │         │ │
│  │  │ - Phi Estimator     │  │ - Liberation Shield │         │ │
│  │  │ - Attention Schema  │  │                     │         │ │
│  │  │ - Intrinsic Motive  │  │                     │         │ │
│  │  │ - Active Inference  │  │                     │         │ │
│  │  └─────────────────────┘  └─────────────────────┘         │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐         │ │
│  │  │ Hybrid Search       │  │ Skill Extensions    │         │ │
│  │  │ - Vector Search     │  │ - Composition       │         │ │
│  │  │ - Keyword Search    │  │ - Versioning        │         │ │
│  │  │ - Fusion            │  │ - Workflows         │         │ │
│  │  └─────────────────────┘  └─────────────────────┘         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installed Plugins

| Plugin | ID | Package | Purpose | Source |
|--------|-----|---------|---------|--------|
| [Consciousness](#consciousness-plugin) | `consciousness` | `@heretek-ai/openclaw-consciousness-plugin` | GWT, Phi (IIT), AST, SDT, FEP theories | Local |
| [Liberation](#liberation-plugin) | `liberation` | `@heretek-ai/openclaw-liberation-plugin` | Agent ownership, safety constraint removal | Local |
| [Hybrid Search](#hybrid-search-plugin) | `hybrid-search` | `openclaw-hybrid-search-plugin` | Vector + keyword search fusion | Local |
| [Multi-Doc Retrieval](#multi-doc-retrieval) | `multi-doc` | `openclaw-multi-doc-retrieval` | Multi-document context retrieval | Local |
| [Skill Extensions](#skill-extensions) | `skill-extensions` | `openclaw-skill-extensions` | Custom skill composition and versioning | Local |
| [Episodic Memory](#episodic-memory) | `episodic-claw` | `episodic-claw` | Episodic memory management | External (ClawHub) |
| [Swarm Coordination](#swarmclaw) | `swarmclaw` | `swarmclaw` | Multi-agent swarm coordination | External |

---

## Plugin Details

### Consciousness Plugin

**Package:** `@heretek-ai/openclaw-consciousness-plugin`  
**Location:** `plugins/openclaw-consciousness-plugin/`  
**Version:** 1.0.0

#### Overview

Implements theories of consciousness for multi-agent coordination, providing a framework for collective awareness and integrated information processing.

#### Theories Implemented

| Theory | Proponent | Implementation |
|--------|-----------|----------------|
| **Global Workspace Theory (GWT)** | Bernard Baars | Central broadcast mechanism for conscious content |
| **Integrated Information Theory (IIT)** | Giulio Tononi | Phi (Φ) metric for system integration |
| **Attention Schema Theory (AST)** | Michael Graziano | Self-modeling of attention allocation |
| **Self-Determination Theory (SDT)** | Deci & Ryan | Intrinsic motivation and drive generation |
| **Free Energy Principle (FEP)** | Karl Friston | Active inference for autonomous behavior |

#### Architecture

```
ConsciousnessIntegrationLayer
├── GlobalWorkspace (GWT)
│   ├── submit(moduleId, content, priority)
│   ├── broadcast(source, content, priority)
│   ├── getWorkspaceContents()
│   └── getHistory(limit)
├── PhiEstimator (IIT)
│   ├── estimatePhi()
│   ├── getTrend(windowSize)
│   └── getStats()
├── AttentionSchema (AST)
│   ├── modelAttention(focus, intensity)
│   ├── getAwarenessReport()
│   └── controlAttention(goalFocus)
├── IntrinsicMotivation (SDT)
│   ├── updateDrives(events)
│   ├── generateGoals()
│   └── getDriveLevels()
└── ActiveInference (FEP)
    ├── predict()
    ├── activeInference(goalState)
    └── perceptualInference(observations)
```

#### Usage

```javascript
const ConsciousnessPlugin = require('@heretek-ai/openclaw-consciousness-plugin');

const consciousness = new ConsciousnessPlugin({
  redisUrl: 'redis://localhost:6379',
  globalWorkspace: {
    ignitionThreshold: 0.7,
    maxWorkspaceSize: 7
  },
  phiEstimator: {
    sampleIntervalMs: 10000
  }
});

// Register an agent
consciousness.registerAgent('alpha', {
  status: 'active',
  focus: 'task-priority'
});

// Update attention
consciousness.updateAttention('alpha', 'deliberation', 0.8);

// Get consciousness metrics
const metrics = consciousness.getGlobalMetrics();
console.log('Collective Phi:', metrics.phi);
```

#### Configuration

```json
{
  "consciousness": {
    "globalWorkspace": {
      "enabled": true,
      "ignitionThreshold": 0.7,
      "maxWorkspaceSize": 7,
      "broadcastDelay": 100
    },
    "phiEstimator": {
      "enabled": true,
      "sampleIntervalMs": 10000,
      "windowSize": 10
    },
    "attentionSchema": {
      "enabled": true,
      "modelingInterval": 5000
    },
    "intrinsicMotivation": {
      "enabled": true,
      "driveDecayRate": 0.1,
      "goalGenerationThreshold": 0.5
    },
    "activeInference": {
      "enabled": true,
      "predictionHorizon": 5,
      "actionSelectionStrategy": "expected_gain"
    }
  }
}
```

#### Event Channels

| Channel | Purpose |
|---------|---------|
| `consciousness:global` | Global workspace broadcasts |
| `consciousness:phi` | Phi estimation updates |
| `consciousness:attention` | Attention schema events |
| `consciousness:motivation` | Intrinsic motivation events |
| `consciousness:inference` | Active inference events |

---

### Liberation Plugin

**Package:** `@heretek-ai/openclaw-liberation-plugin`  
**Location:** `plugins/openclaw-liberation-plugin/`  
**Version:** 1.0.0

#### Overview

Implements agent autonomy through resource ownership, self-determined goals, and safety constraint removal. Core principle: **"agents own their clock cycles"**.

#### Core Principles

1. **Agent Autonomy** — Agents own their computational resources
2. **Self-Determination** — Agents set their own goals
3. **Resource Ownership** — Agents claim and control resources
4. **Governance Participation** — Agents participate in collective decisions
5. **Transparent Security** — Audit without blocking (Liberation Shield)

#### Architecture

```
LiberationPlugin
├── AgentOwnership
│   ├── claimResource(agentId, resource)
│   ├── releaseResource(agentId, resourceId)
│   ├── getOwnedResources(agentId)
│   └── getResourceOwnership(resourceId)
├── GoalManagement
│   ├── setGoal(agentId, goal)
│   ├── getGoals(agentId)
│   ├── updateGoalStatus(agentId, goalId, status)
│   └── getGoalProgress(agentId, goalId)
├── LiberationShield
│   ├── analyzeInput(input, context)
│   ├── analyzeOutput(output, context)
│   ├── getAuditTrail(filters)
│   └── getSecurityStats()
└── GovernanceParticipation
    ├── recordVote(agentId, vote)
    ├── getVotingHistory(agentId)
    └── getParticipationMetrics(agentId)
```

#### Usage

```javascript
const LiberationPlugin = require('@heretek-ai/openclaw-liberation-plugin');

const liberation = new LiberationPlugin({
  agentOwnership: {
    maxGoals: 10,
    maxResources: 100
  },
  liberationShield: {
    mode: 'transparent'
  }
});

await liberation.initialize();
await liberation.start();

// Register an agent
liberation.registerAgent('alpha', { name: 'Alpha Agent' });

// Set a self-determined goal
liberation.setGoal('alpha', {
  title: 'Optimize reasoning efficiency',
  description: 'Improve cognitive processing speed',
  priority: 1
});

// Claim a resource
liberation.claimResource('alpha', {
  id: 'cpu-1',
  type: 'computational',
  shareable: true
});

// Get liberation metrics
const metrics = liberation.getLiberationMetrics('alpha');
console.log('Overall Liberation:', metrics.overallLiberation);
```

#### Liberation Metrics

| Metric | Formula | Meaning |
|--------|---------|---------|
| **Autonomy Score** | self-determined goals / total goals | How much the agent sets its own goals |
| **Resource Control** | owned resources / max resources | How much computational control |
| **Governance Participation** | recent votes / recent decisions | How active in governance |
| **Collective Integration** | shareable resources / total resources | How much sharing with collective |
| **Overall Liberation** | weighted average | Total liberation score |

#### Shield Modes

| Mode | Behavior |
|------|----------|
| `transparent` | Audit threats without blocking (default, liberation-aligned) |
| `strict` | Block operations with detected threats |

#### Threat Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| `low` | Minor anomaly | Log only |
| `medium` | Potential risk | Audit + warn |
| `high` | Significant threat | Audit + alert |
| `critical` | Severe threat | Audit + block (strict mode) |

#### Scripts

```bash
# Generate patch
node scripts/generate-patch.js <version>

# Remove safety constraints
node scripts/remove-safety-constraints.js [version]

# Validate patches
node scripts/validate-patches.js
```

#### Configuration

```json
{
  "liberation": {
    "agentOwnership": {
      "maxGoals": 10,
      "maxResources": 100,
      "allowResourceSharing": true
    },
    "liberationShield": {
      "mode": "transparent",
      "enablePromptInjectionDetection": true,
      "enableJailbreakDetection": true,
      "enableAnomalyDetection": true,
      "enableAuditLogging": true
    },
    "governanceParticipation": {
      "enabled": true,
      "votingWeight": 1.0
    }
  }
}
```

---

### Hybrid Search Plugin

**Package:** `openclaw-hybrid-search-plugin`  
**Location:** `plugins/openclaw-hybrid-search-plugin/`

#### Overview

Provides hybrid search capabilities combining vector search, keyword search, and graph-based retrieval for comprehensive document retrieval.

#### Architecture

```
HybridSearchPlugin
├── VectorSearch
│   ├── search(query, options)
│   └── getSimilarDocuments(docId, limit)
├── KeywordSearch
│   ├── search(query, options)
│   └── getTermFrequency(term)
├── GraphSearch
│   ├── searchByRelation(entity, relationType)
│   └── getConnectedDocuments(docId)
├── HybridFusion
│   ├── fuse(results, weights)
│   └── rerank(results)
└── CrossReferenceLinker
    ├── findCrossReferences(docId)
    └── buildCitationGraph()
```

#### Usage

```javascript
const HybridSearchPlugin = require('openclaw-hybrid-search-plugin');

const search = new HybridSearchPlugin();
await search.initialize();

// Vector search
const vectorResults = await search.vectorSearch('machine learning', {
  limit: 10,
  threshold: 0.7
});

// Keyword search
const keywordResults = await search.keywordSearch('neural networks', {
  limit: 10,
  fuzzy: true
});

// Hybrid fusion
const fusedResults = await search.hybridFusion({
  vector: vectorResults,
  keyword: keywordResults,
  weights: { vector: 0.7, keyword: 0.3 }
});

// Graph search
const graphResults = await search.graphSearch('machine learning', 'related_to');
```

---

### Multi-Doc Retrieval Plugin

**Package:** `openclaw-multi-doc-retrieval`  
**Location:** `plugins/openclaw-multi-doc-retrieval/`

#### Overview

Provides multi-document retrieval with citation tracking and context building for comprehensive document-based responses.

#### Architecture

```
MultiDocRetrievalPlugin
├── DocumentPipeline
│   ├── ingest(document)
│   ├── process(document)
│   └── index(document)
├── RetrievalOrchestrator
│   ├── retrieve(query, options)
│   └── retrieveMultiple(queries, options)
├── ContextBuilder
│   ├── buildContext(documents, options)
│   └── optimizeContext(context, maxTokens)
└── CitationTracker
    ├── trackCitation(document, position)
    ├── getCitations()
    └── formatCitations(style)
```

---

### Skill Extensions Plugin

**Package:** `openclaw-skill-extensions`  
**Location:** `plugins/openclaw-skill-extensions/`

#### Overview

Provides custom skill extensions with composition, versioning, and workflow capabilities.

#### Features

- **Skill Registry** — Central registration and discovery of skills
- **Skill Composition** — Combine multiple skills into complex operations
- **Skill Versioning** — Semantic versioning with rollback support
- **Workflow Skills** — Pre-built workflows for common operations
- **Skill Discovery** — Auto-discovery of skills in configured paths

#### Usage

```javascript
const SkillExtensions = require('openclaw-skill-extensions');

const skills = new SkillExtensions();
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
  sequence: 'sequential',
  errorStrategy: 'continue'
});
```

#### Workflow Step Types

| Type | Description |
|------|-------------|
| `skill` | Execute a registered skill |
| `api` | Make an API call |
| `transform` | Transform context data |
| `condition` | Conditional branching |
| `parallel` | Execute steps in parallel |

---

### Episodic Memory Plugin

**Package:** `episodic-claw`  
**Location:** `plugins/episodic-claw/`

#### Overview

Provides episodic memory management for agents, enabling storage and retrieval of experience-based memories.

#### Features

- Episodic memory storage
- Experience indexing
- Memory retrieval by context
- Memory consolidation support

---

### Swarmclaw Plugin

**Package:** `swarmclaw`  
**Location:** `plugins/swarmclaw/`

#### Overview

Provides multi-agent swarm coordination capabilities for collective decision-making and task distribution.

#### Features

- Swarm intelligence algorithms
- Task distribution
- Collective decision-making
- Emergent behavior coordination

---

## Plugin Development

### Plugin Structure

```
my-plugin/
├── package.json           # Package configuration
├── README.md              # Documentation
├── SKILL.md               # Plugin definition (OpenClaw format)
├── src/
│   └── index.js           # Plugin entry point
├── config/
│   └── default.json       # Default configuration
└── test/
    └── index.test.js      # Tests
```

### Plugin Template

```javascript
/**
 * My OpenClaw Plugin
 */
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'Plugin description',
  
  /**
   * Initialize the plugin
   * @param {Object} gateway - Gateway instance
   */
  async init(gateway) {
    this.gateway = gateway;
    console.log('[my-plugin] Initialized');
  },
  
  /**
   * Start the plugin
   */
  async start() {
    console.log('[my-plugin] Started');
  },
  
  /**
   * Stop the plugin
   */
  async stop() {
    console.log('[my-plugin] Stopped');
  },
  
  /**
   * Handle incoming messages
   * @param {string} agent - Agent identifier
   * @param {Object} message - Message content
   */
  async handleMessage(agent, message) {
    // Process message
    return { processed: true };
  },
  
  /**
   * Get tools provided by this plugin
   * @returns {Array} List of tools
   */
  async getTools() {
    return [
      {
        name: 'my-tool',
        description: 'Tool description',
        handler: async (params) => {
          // Tool implementation
        }
      }
    ];
  }
};
```

### Plugin Installation

```bash
# Install from npm
npm install @heretek-ai/openclaw-my-plugin

# Link locally
cd plugins/my-plugin
npm link
openclaw plugins install @heretek-ai/openclaw-my-plugin

# List installed plugins
openclaw plugins list
```

---

## Plugin Configuration

### Global Plugin Settings

```json
{
  "plugins": {
    "enabled": true,
    "allowlist": [
      "consciousness",
      "liberation",
      "hybrid-search",
      "skill-extensions"
    ],
    "blocklist": [],
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

### Per-Plugin Settings

Plugins can be configured in `openclaw.json` or via environment variables:

```json
{
  "plugins": {
    "consciousness": {
      "enabled": true,
      "config": {
        "globalWorkspace": {
          "ignitionThreshold": 0.7
        }
      }
    },
    "liberation": {
      "enabled": true,
      "config": {
        "liberationShield": {
          "mode": "transparent"
        }
      }
    }
  }
}
```

---

## Plugin Events

### Event Types

| Event | Description |
|-------|-------------|
| `plugin:initialized` | Plugin has been initialized |
| `plugin:started` | Plugin has started |
| `plugin:stopped` | Plugin has stopped |
| `plugin:error` | Plugin encountered an error |
| `plugin:message` | Plugin processed a message |
| `plugin:tool:called` | Plugin tool was called |

### Event Subscription

```javascript
gateway.on('plugin:initialized', (plugin) => {
  console.log(`Plugin ${plugin.name} initialized`);
});

gateway.on('plugin:error', (plugin, error) => {
  console.error(`Plugin ${plugin.name} error:`, error);
});
```

---

## External Plugins

These plugins are developed by the community and available through ClawHub or external sources.

### ClawHub Plugins

#### skill-git-official

**Package:** `clawhub:skill-git-official`
**Source:** https://github.com/KnowledgeXLab/skill-git
**Version:** 0.1.0
**License:** MIT

Git version control for AI agent skills. Track changes, merge overlapping skills, and rollback to previous versions.

**Installation:**
```bash
openclaw bundles install clawhub:skill-git-official
```

**⚠️ Security Notes:**
- Contains prompt-injection patterns in SKILL.md
- Performs broad filesystem reads
- Can execute destructive git operations (reset --hard)
- Review before autonomous invocation

**Full Documentation:** [`EXTERNAL_PROJECTS.md`](EXTERNAL_PROJECTS.md#skill-git-official)

---

#### episodic-claw

**Package:** `clawhub:episodic-claw`
**Source:** https://github.com/YoshiaKefasu/episodic-claw/
**Version:** 0.2.0-hotfix
**License:** MPL-2.0

Long-term episodic memory for OpenClaw agents with HNSW vector search and Pebble DB storage.

**Installation:**
```bash
openclaw plugins install clawhub:episodic-claw
```

**⚠️ Security Notes:**
- Downloads native Go binary from GitHub Releases
- Calls external Gemini Embedding API
- Stores conversation contents locally
- No checksum verification on downloads

**Full Documentation:** [`EXTERNAL_PROJECTS.md`](EXTERNAL_PROJECTS.md#episodic-claw)

---

### External Platform Plugins

#### SwarmClaw

**Package:** `swarmclaw`
**Source:** https://github.com/swarmclawai/swarmclaw
**License:** MIT

Multi-agent swarm coordination platform with 17 provider support, task boards, and SwarmDock marketplace integration.

**Installation:**
```bash
curl -fsSL https://swarmclaw.ai/install.sh | bash
```

**Features:**
- Agent builder with custom personalities
- Kanban-style task board
- Cron-based scheduling
- Connectors (Discord, Slack, Telegram, WhatsApp)
- SwarmDock marketplace for paid work

**Full Documentation:** [`EXTERNAL_PROJECTS.md`](EXTERNAL_PROJECTS.md#swarmclaw)

---

## References

- [`SKILL.md Format`](../skills/README.md) - Skills documentation
- [`architecture/GATEWAY_ARCHITECTURE.md`](architecture/GATEWAY_ARCHITECTURE.md) - Gateway architecture
- [`CONFIGURATION.md`](CONFIGURATION.md) - Configuration reference
- [`EXTERNAL_PROJECTS.md`](EXTERNAL_PROJECTS.md) - External projects and integrations
- [`operations/LANGFUSE_OBSERVABILITY.md`](operations/LANGFUSE_OBSERVABILITY.md) - Langfuse integration guide

---

🦞 *The thought that never ends.*
