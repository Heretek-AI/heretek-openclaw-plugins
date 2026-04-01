# Heretek OpenClaw Skills Repository

**Version:** 2.0.4
**Last Updated:** 2026-03-31
**OpenClaw Gateway:** v2026.3.28+

---

## Plugin & Skills Documentation

For comprehensive plugin and skills documentation, see the following guides:

| Guide | Description |
|-------|-------------|
| [`docs/plugins/INSTALLATION_GUIDE.md`](./plugins/INSTALLATION_GUIDE.md) | Plugin installation procedures |
| [`docs/plugins/DEVELOPMENT_GUIDE.md`](./plugins/DEVELOPMENT_GUIDE.md) | Plugin and skill development guide |
| [`docs/plugins/PLUGIN_REGISTRY.md`](./plugins/PLUGIN_REGISTRY.md) | Plugin registry and compatibility |
| [`docs/plugins/SECURITY_GUIDE.md`](./plugins/SECURITY_GUIDE.md) | Security guidelines |
| [`docs/plugins/PLUGIN_CLI.md`](./plugins/PLUGIN_CLI.md) | CLI reference |
| [`docs/plugins/TROUBLESHOOTING.md`](./plugins/TROUBLESHOOTING.md) | Troubleshooting guide |
| [`plugins/templates/README.md`](../plugins/templates/README.md) | Plugin templates |

---

## Overview

The OpenClaw Skills Repository contains **48 skills** that provide capabilities to agents in the collective. Skills are executable modules that agents can invoke to perform specific tasks, from triad coordination to backup operations.

### Skill Format

Skills use the `SKILL.md` format with YAML frontmatter:

```markdown
---
name: skill-name
description: Human-readable description of the skill
---

# Skill Name

**Purpose:** What the skill does

**Usage:** How to execute the skill

**Parameters:** Input parameters

**Returns:** Output format
```

---

## Skills Registry

### Triad Protocols (4)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`triad-sync-protocol`](#triad-sync-protocol) | HTTP-based inter-agent communication for triad synchronization | Coordinate deliberation across triad members |
| [`triad-heartbeat`](#triad-heartbeat) | Triad health monitoring and status broadcasting | Monitor triad member availability |
| [`triad-unity-monitor`](#triad-unity-monitor) | Triad consensus tracking and unity metrics | Track consensus progress |
| [`triad-deliberation-protocol`](#triad-deliberation-protocol) | Full deliberation workflow management | Manage proposal deliberation |

### Governance (3)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`governance-modules`](#governance-modules) | Governance participation and voting | Participate in collective governance |
| [`quorum-enforcement`](#quorum-enforcement) | Quorum validation and enforcement | Ensure quorum for decisions |
| [`failover-vote`](#failover-vote) | Failover voting procedures | Handle agent failover scenarios |

### Operations (6)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`healthcheck`](#healthcheck) | System health verification | Check collective health |
| [`deployment-health-check`](#deployment-health-check) | Post-deployment verification | Verify deployment success |
| [`deployment-smoke-test`](#deployment-smoke-test) | Deployment smoke testing | Test deployment functionality |
| [`backup-ledger`](#backup-ledger) | Consensus ledger backup | Backup deliberation history |
| [`fleet-backup`](#fleet-backup) | Collective backup coordination | Coordinate fleet-wide backups |
| [`config-validator`](#config-validator) | Configuration validation | Validate agent configurations |

### Memory (4)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`memory-consolidation`](#memory-consolidation) | Memory processing and consolidation | Consolidate episodic memories |
| [`knowledge-ingest`](#knowledge-ingest) | Knowledge ingestion and indexing | Ingest new knowledge |
| [`knowledge-retrieval`](#knowledge-retrieval) | Knowledge search and retrieval | Retrieve stored knowledge |
| [`workspace-consolidation`](#workspace-consolidation) | Workspace consolidation | Consolidate agent workspaces |

### Autonomy (8)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`thought-loop`](#thought-loop) | Continuous autonomous thinking | Generate thoughts from environmental changes |
| [`self-model`](#self-model) | Self-modeling and cognitive state tracking | Model agent cognitive state |
| [`curiosity-engine`](#curiosity-engine) | Self-directed growth driver | Drive autonomous capability growth |
| [`opportunity-scanner`](#opportunity-scanner) | Opportunity detection and scanning | Scan for growth opportunities |
| [`gap-detector`](#gap-detector) | Skill and capability gap detection | Detect missing capabilities |
| [`auto-deliberation-trigger`](#auto-deliberation-trigger) | Automatic deliberation triggers | Trigger deliberation based on events |
| [`autonomous-pulse`](#autonomous-pulse) | Autonomous pulse and self-check | Perform autonomous self-checks |
| [`detect-corruption`](#detect-corruption) | Corruption detection | Detect data corruption |

### User Management (2)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`user-context-resolve`](#user-context-resolve) | User context resolution | Resolve user context for interactions |
| [`user-rolodex`](#user-rolodex) | User relationship management | Manage user relationships |

### Agent-Specific (5)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`steward-orchestrator`](#steward-orchestrator) | Collective orchestration | Orchestrate agent workflow |
| [`dreamer-agent`](#dreamer-agent) | Dreamer background processing | Process during idle periods |
| [`examiner`](#examiner) | Examiner questioning | Generate probing questions |
| [`explorer`](#explorer) | Explorer intelligence gathering | Gather external intelligence |
| [`sentinel`](#sentinel) | Sentinel safety review | Review for safety concerns |

### LiteLLM Operations (2)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`litellm-ops`](#litellm-ops) | LiteLLM operations and management | Manage LiteLLM gateway |
| [`matrix-triad`](#matrix-triad) | Matrix triad integration | Integrate with Matrix protocol |

### Utilities (11)

| Skill | Description | Usage |
|-------|-------------|-------|
| [`a2a-agent-register`](#a2a-agent-register) | A2A agent registration | Register agents with A2A protocol |
| [`audit-triad-files`](#audit-triad-files) | Triad file auditing | Audit triad files |
| [`autonomy-audit`](#autonomy-audit) | Autonomy capability auditing | Audit autonomy features |
| [`curiosity-auto-trigger`](#curiosity-auto-trigger) | Curiosity engine auto-trigger | Auto-trigger curiosity cycles |
| [`day-dream`](#day-dream) | Day-dream mode processing | Process during idle time |
| [`goal-arbitration`](#goal-arbitration) | Goal conflict arbitration | Resolve goal conflicts |
| [`heretek-theme`](#heretek-theme) | Heretek theme management | Manage theming |
| [`lib`](#lib) | Shared library functions | Common utilities |
| [`tabula-backup`](#tabula-backup) | Tabula backup procedures | Backup Tabula state |
| [`triad-cron-manager`](#triad-cron-manager) | Triad cron job management | Manage scheduled tasks |
| [`triad-resilience`](#triad-resilience) | Triad resilience and recovery | Handle triad failures |
| [`triad-signal-filter`](#triad-signal-filter) | Triad signal filtering | Filter triad communications |

---

## Skill Details

### Triad Sync Protocol

**Location:** `skills/triad-sync-protocol/`  
**Type:** Protocol  
**Agents:** Triad members (alpha, beta, charlie)

#### Purpose

Enable direct HTTP-based communication between agents within a single OpenClaw instance.

#### Architecture

```
OpenClaw Instance (single)
├── Gateway (port 18789)
├── Agent Sessions
│   ├── Steward (orchestrator)
│   ├── Triad Alpha (deliberation)
│   ├── Triad Beta (deliberation)
│   └── Triad Charlie (deliberation)
└── HTTP Sync Server (internal, port 8765)
```

#### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/state` | GET | Returns collective state |
| `/agents` | GET | Returns registered agent status |
| `/broadcast` | POST | Floods message to all agents |
| `/health` | GET | Health check endpoint |
| `/vote` | POST | Submit quorum vote |
| `/ledger` | GET | Get consensus ledger |

#### Usage

```bash
# Check collective state
curl http://localhost:8765/state

# Check agent status
curl http://localhost:8765/agents

# Broadcast to all agents
curl -X POST http://localhost:8765/broadcast \
  -H "Content-Type: application/json" \
  -d '{"type": "consensus", "message": "Proposal ratified"}'

# Submit vote
curl -X POST http://localhost:8765/vote \
  -H "Content-Type: application/json" \
  -d '{"agent": "beta", "proposal": "PROPOSAL-001", "vote": "yes"}'
```

---

### Steward Orchestrator

**Location:** `skills/steward-orchestrator/`  
**Type:** Orchestration  
**Agents:** steward

#### Purpose

Oversee and steer the collective. Does not participate in deliberation — ensures deliberation happens correctly.

#### Responsibilities

- Monitor all agents via heartbeats
- Enforce workflow execution
- Coordinate deliberation
- Manage proposals
- Trigger agent cycles
- Resolve deadlocks

#### Usage

```bash
# Check collective health
./steward-orchestrator.sh --health

# List pending proposals
./steward-orchestrator.sh --proposals

# Force agent cycle
./steward-orchestrator.sh --trigger explorer
```

#### Workflow

```
Explorer → delivers intel → Triad deliberates → Sentinel reviews → 
Triad votes → Coder implements → Steward pushes
```

---

### Curiosity Engine

**Location:** `skills/curiosity-engine/`  
**Type:** Autonomy  
**Agents:** explorer, autonomous

#### Purpose

Drive self-directed growth through gap detection, anomaly detection, opportunity scanning, capability mapping, and auto-deliberation triggers.

#### Modules

| Module | File | Purpose |
|--------|------|---------|
| Gap Detection | `modules/gap-detector.js` | Compares installed vs available skills |
| Anomaly Detection | `modules/anomaly-detector.js` | Pattern detection with scoring |
| Opportunity Scanning | `modules/opportunity-scanner.js` | MCP integration (SearXNG, GitHub, npm) |
| Capability Mapping | `modules/capability-mapper.js` | Maps goals → skills → gaps |
| Deliberation Trigger | `modules/deliberation-trigger.js` | Priority scoring, deduplication |

#### Usage

```bash
# Run all engines
./curiosity-engine.sh run

# Force modular mode
./curiosity-engine.sh modules

# View metrics history
./curiosity-engine.sh history

# Output JSON
./curiosity-engine.sh --json
```

#### Curiosity Metrics

```sql
-- Autonomy score formula
autonomy_score = (skills_installed / skills_available) * 100
               + (proposals_created_this_week * 10)
               - (anomalies_detected_this_week * 5)
```

**Goal:** Autonomy score → 100% (full self-direction)

---

### Thought Loop

**Location:** `skills/thought-loop/`  
**Type:** Autonomy  
**Agents:** All agents

#### Purpose

Enable continuous autonomous thinking by detecting changes in the environment and generating structured thoughts.

#### Thought Types

| Type | Description | Trigger |
|------|-------------|---------|
| `discovery` | New file or resource detected | file_created |
| `update` | Existing resource modified | file_modified, db_modified |
| `alert` | Resource deleted or agent offline | file_deleted, agent_offline |
| `external_awareness` | External event detected | external_cve, external_release |
| `reflection` | Internal self-reflection | idle |
| `state_change` | Database state change | db_modified |

#### Usage

```bash
# Run full thought loop cycle
node thought-loop.js run

# Detect changes only
node thought-loop.js detect --json

# Generate idle thoughts
node thought-loop.js idle --agent steward
```

#### Thought Structure

```json
{
  "id": "thought_1234567890_abc123",
  "type": "discovery",
  "trigger": "file_created",
  "subject": "test.md",
  "observation": "New file created: ./test.md",
  "implication": "May affect active proposals",
  "recommendation": "broadcast_thought",
  "confidence": 0.7,
  "timestamp": "2026-03-31T00:00:00Z",
  "agent": "steward"
}
```

---

### Backup Ledger

**Location:** `skills/backup-ledger/`  
**Type:** Operations  
**Agents:** historian, steward

#### Purpose

Create versioned backups of consensus ledger and curiosity metrics databases.

#### Usage

```bash
# Daily backup (cron)
./backup-ledger.sh --daily

# Manual backup
./backup-ledger.sh --manual

# Restore latest backup
./backup-ledger.sh --restore
```

#### Backup Locations

```
~/.openclaw/workspace/.secure/ledger-backups/
├── consensus-YYYYMMDD-HHMMSS.db.gz
└── curiosity-YYYYMMDD-HHMMSS.db.gz
```

---

### Health Check

**Location:** `skills/healthcheck/`  
**Type:** Operations  
**Agents:** steward, sentinel

#### Purpose

Verify system health and agent availability.

#### Usage

```bash
# Full system health check
./scripts/health-check.sh

# Continuous monitoring
./scripts/health-check.sh --watch

# Check specific service
./scripts/health-check.sh litellm
```

---

### Knowledge Retrieval

**Location:** `skills/knowledge-retrieval/`  
**Type:** Memory  
**Agents:** historian, all agents

#### Purpose

Search and retrieve stored knowledge from the collective memory.

#### Usage

```bash
# Search knowledge
./knowledge-retrieval.sh --query "machine learning"

# Get related documents
./knowledge-retrieval.sh --related doc-123

# Output as JSON
./knowledge-retrieval.sh --json
```

---

### Gap Detector

**Location:** `skills/gap-detector/`  
**Type:** Autonomy  
**Agents:** explorer, curiosity-engine

#### Purpose

Detect skill and capability gaps in the collective.

#### Critical Skills

- skill-creator
- knowledge-ingest
- knowledge-retrieval
- triad-deliberation-protocol
- triad-sync-protocol
- auto-patch
- auto-deliberation-trigger

#### Usage

```bash
# Detect gaps
./gap-detector.sh

# Output JSON
./gap-detector.sh --json

# Check critical skills only
./gap-detector.sh --critical-only
```

---

### Opportunity Scanner

**Location:** `skills/opportunity-scanner/`  
**Type:** Autonomy  
**Agents:** explorer

#### Purpose

Scan for growth opportunities from GitHub releases, npm updates, CVEs, and ClawHub.

#### MCP Integration

- **SearXNG:** Privacy-respecting search for npm/CVE mentions
- **GitHub API:** Release monitoring, security alerts
- **npm Registry:** Package version tracking

#### Usage

```bash
# Scan opportunities
./opportunity-scanner.sh

# Scan specific sources
./opportunity-scanner.sh --sources github,npm

# Output JSON
./opportunity-scanner.sh --json
```

---

### Self-Model

**Location:** `skills/self-model/`  
**Type:** Autonomy  
**Agents:** All agents

#### Purpose

Model agent cognitive state and track self-awareness metrics.

#### Usage

```bash
# Initialize self-model
node self-model.js --init

# Get cognitive state
node self-model.js --state

# Update self-model
node self-model.js --update
```

---

### Fleet Backup

**Location:** `skills/fleet-backup/`  
**Type:** Operations  
**Agents:** historian, steward

#### Purpose

Coordinate fleet-wide backup operations across all agents.

#### Usage

```bash
# Full fleet backup
./fleet-backup.sh --all

# Backup specific agent
./fleet-backup.sh --agent steward

# List backups
./fleet-backup.sh --list
```

---

## Skill Execution

### Via Gateway

```bash
# Execute skill via Gateway
openclaw skill execute curiosity-engine

# Execute with parameters
openclaw skill execute knowledge-retrieval --query "machine learning"
```

### Via LiteLLM A2A

```bash
# Send skill request via A2A
curl -X POST http://localhost:4000/v1/agents/steward/send \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "skill_request",
    "skill": "healthcheck",
    "content": {"mode": "full"}
  }'
```

### Direct Execution

```bash
# Execute shell-based skill
./skills/backup-ledger/backup-ledger.sh --daily

# Execute Node.js skill
node skills/self-model/self-model.js --state
```

---

## Skill Categories

### By Function

| Category | Count | Skills |
|----------|-------|--------|
| **Triad Protocols** | 4 | triad-sync-protocol, triad-heartbeat, triad-unity-monitor, triad-deliberation-protocol |
| **Governance** | 3 | governance-modules, quorum-enforcement, failover-vote |
| **Operations** | 6 | healthcheck, deployment-health-check, deployment-smoke-test, backup-ledger, fleet-backup, config-validator |
| **Memory** | 4 | memory-consolidation, knowledge-ingest, knowledge-retrieval, workspace-consolidation |
| **Autonomy** | 8 | thought-loop, self-model, curiosity-engine, opportunity-scanner, gap-detector, auto-deliberation-trigger, autonomous-pulse, detect-corruption |
| **User Management** | 2 | user-context-resolve, user-rolodex |
| **Agent-Specific** | 5 | steward-orchestrator, dreamer-agent, examiner, explorer, sentinel |
| **LiteLLM Operations** | 2 | litellm-ops, matrix-triad |
| **Utilities** | 14 | a2a-agent-register, audit-triad-files, autonomy-audit, curiosity-auto-trigger, day-dream, goal-arbitration, heretek-theme, lib, tabula-backup, triad-cron-manager, triad-resilience, triad-signal-filter |

### By Agent

| Agent | Primary Skills |
|-------|----------------|
| **steward** | steward-orchestrator, healthcheck, fleet-backup |
| **alpha** | triad-sync-protocol, triad-heartbeat, triad-unity-monitor |
| **beta** | triad-sync-protocol, triad-heartbeat, triad-unity-monitor |
| **charlie** | triad-sync-protocol, triad-heartbeat, triad-unity-monitor |
| **examiner** | examiner, governance-modules, quorum-enforcement |
| **explorer** | explorer, opportunity-scanner, gap-detector, curiosity-engine |
| **sentinel** | sentinel, healthcheck, detect-corruption |
| **coder** | deployment-health-check, deployment-smoke-test |
| **dreamer** | dreamer-agent, day-dream, memory-consolidation |
| **empath** | user-context-resolve, user-rolodex |
| **historian** | knowledge-retrieval, backup-ledger, fleet-backup, memory-consolidation |

---

## Skill Development

### Creating a New Skill

1. Create skill directory:
```bash
mkdir -p skills/my-new-skill
```

2. Create SKILL.md with frontmatter:
```markdown
---
name: my-new-skill
description: Description of what the skill does
---

# My New Skill

**Purpose:** What the skill does

**Usage:** How to execute

**Parameters:** Input parameters

**Returns:** Output format
```

3. Create implementation:
```bash
# For shell-based skills
touch skills/my-new-skill/my-new-skill.sh
chmod +x skills/my-new-skill/my-new-skill.sh

# For Node.js skills
touch skills/my-new-skill/index.js
```

4. Test the skill:
```bash
./skills/my-new-skill/my-new-skill.sh --test
```

---

## References

- [`plugins/README.md`](plugins/README.md) - Plugin documentation
- [`architecture/GATEWAY_ARCHITECTURE.md`](architecture/GATEWAY_ARCHITECTURE.md) - Gateway architecture
- [`AGENTS.md`](AGENTS.md) - Agent documentation

---

🦞 *The thought that never ends.*
