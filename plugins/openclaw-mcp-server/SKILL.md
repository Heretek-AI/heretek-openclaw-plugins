---
name: openclaw-mcp-server
description: MCP server exposing OpenClaw skills, memory, and knowledge through Model Context Protocol
---

# OpenClaw MCP Server

**Purpose:** Provide standardized MCP (Model Context Protocol) access to Heretek OpenClaw capabilities including skills, memory systems, and knowledge base.

**Location:** `plugins/openclaw-mcp-server/`

**Type:** MCP Server Plugin

**Version:** 1.0.0

---

## Overview

The OpenClaw MCP Server implements the Model Context Protocol to expose OpenClaw capabilities to external MCP clients. This enables:

- **IDE Integration**: Connect MCP-enabled IDEs to OpenClaw skills
- **Agent Interoperability**: Allow external AI agents to access OpenClaw capabilities
- **Standardized Access**: Use industry-standard MCP protocol for all interactions

## Capabilities

### Resources Exposed

| Category | Count | Examples |
|----------|-------|----------|
| **Memory Resources** | 7 | episodic memories, semantic schemas, session data |
| **Knowledge Resources** | 6 | documents, schemas, graph queries |
| **Skill Resources** | 48+ | All OpenClaw skills with SKILL.md definitions |

### Tools Exposed

| Category | Tools | Description |
|----------|-------|-------------|
| **Skill Tools** | 3 + N | skill-execute, skill-list, skill-info, plus quick-access tools |
| **Memory Tools** | 4 | memory-search, memory-read, memory-stats, memory-consolidate |
| **Knowledge Tools** | 4 | knowledge-search, knowledge-read, knowledge-ingest, knowledge-graph-query |

### Prompts Exposed

| Category | Count | Examples |
|----------|-------|----------|
| **Agent Protocols** | 12 | deliberation, proposal, safety-review, orchestration |
| **Memory Operations** | 2 | memory-query, historian-retrieval |
| **Skill Operations** | 2 | skill-execution, knowledge-search |
| **Agent-Specific** | 6 | explorer-intel, coder-implementation, dreamer-synthesis, etc. |

## Usage

### Starting the Server

```bash
# Using npx
npx openclaw-mcp-server

# With custom paths
OPENCLAW_SKILLS_PATH=/path/to/skills \
OPENCLAW_MEMORY_PATH=/path/to/memory \
OPENCLAW_KNOWLEDGE_PATH=/path/to/knowledge \
npx openclaw-mcp-server
```

### Connecting from MCP Client

```javascript
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['openclaw-mcp-server'],
});

const client = new Client({ name: 'my-client', version: '1.0.0' });
await client.connect(transport);

// List resources
const resources = await client.request({ method: 'resources/list' });

// List tools  
const tools = await client.request({ method: 'tools/list' });

// List prompts
const prompts = await client.request({ method: 'prompts/list' });
```

### Executing Skills via MCP

```javascript
// Execute a skill
const result = await client.request({
  method: 'tools/call',
  params: {
    name: 'skill-execute',
    arguments: {
      skillName: 'healthcheck',
      arguments: ['--verbose'],
    },
  },
});

console.log(result.content[0].text);
```

### Accessing Memory Resources

```javascript
// Read episodic memory list
const episodicList = await client.request({
  method: 'resources/read',
  params: { uri: 'memory://episodic/list' },
});

// Read specific memory
const memory = await client.request({
  method: 'resources/read',
  params: { uri: 'memory://episodic/mem-123' },
});
```

### Using Prompt Templates

```javascript
// Get deliberation prompt
const prompt = await client.request({
  method: 'prompts/get',
  params: {
    name: 'agent-deliberation',
    arguments: {
      proposal: 'Implement new caching layer',
      priority: 'high',
      proposer: 'steward',
    },
  },
});

console.log(prompt.messages[0].content.text);
```

## Integration with OpenClaw Skills

### Skill Discovery

The MCP Server automatically discovers skills from the `skills/` directory by parsing `SKILL.md` files:

```javascript
// Each skill directory is scanned for:
// - SKILL.md (definition)
// - Executable files (.sh, .js, .mjs, .ts, .py)

skills/
├── healthcheck/
│   ├── SKILL.md          ← Parsed for skill definition
│   └── check.js          ← Discovered as executable
├── gap-detector/
│   ├── SKILL.md
│   └── gap-detector.sh
└── ...
```

### Skill Execution Flow

```
MCP Client Request
       │
       ▼
┌─────────────────────────────────┐
│  skill-execute tool             │
│  - skillName: "healthcheck"     │
│  - arguments: ["--verbose"]     │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  SkillToolHandler               │
│  1. Locate skill directory      │
│  2. Find executable file        │
│  3. Spawn process with args     │
│  4. Capture stdout/stderr       │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Execution Result               │
│  {                              │
│    success: true,               │
│    stdout: "...",               │
│    executionTime: 234           │
│  }                              │
└─────────────────────────────────┘
```

## Integration with MCP Connectors Plugin

The MCP Server complements the existing [`openclaw-mcp-connectors`](../openclaw-mcp-connectors/) plugin:

| Feature | MCP Connectors | MCP Server |
|---------|---------------|------------|
| **Direction** | Client (outbound) | Server (inbound) |
| **Purpose** | Connect to external MCP servers | Allow external clients to connect |
| **Use Case** | OpenClaw accessing external APIs | External tools accessing OpenClaw |
| **Transport** | stdio, SSE | stdio, SSE |

### Combined Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Heretek OpenClaw                          │
│                                                               │
│  ┌─────────────────┐              ┌─────────────────────┐   │
│  │ MCP Connectors  │              │   MCP Server        │   │
│  │ (Client)        │              │   (Server)          │   │
│  │                 │              │                     │   │
│  │ → External APIs │              │ ← External Clients  │   │
│  │ → External MCP  │              │ ← IDE Integration   │   │
│  │   Servers       │              │ ← Agent Protocols   │   │
│  └─────────────────┘              └─────────────────────┘   │
│                                                               │
│              Both access OpenClaw Skills & Memory             │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_SKILLS_PATH` | `./skills` | Path to skills directory |
| `OPENCLAW_MEMORY_PATH` | `./memory` | Path to memory storage |
| `OPENCLAW_KNOWLEDGE_PATH` | `./knowledge` | Path to knowledge base |

### Programmatic Configuration

```javascript
const { OpenClawMCPServer } = require('@heretek-ai/openclaw-mcp-server');

const server = new OpenClawMCPServer({
  skillsPath: '/custom/path/to/skills',
  memoryPath: '/custom/path/to/memory',
  knowledgePath: '/custom/path/to/knowledge',
});

await server.connect();
```

## Security Considerations

### Access Control

- Skills execute with the permissions of the server process
- Memory access should be configured with appropriate file permissions
- Consider running the server with limited privileges

### Input Validation

- All tool arguments are validated before execution
- Skill execution paths are constrained to the skills directory
- Resource URIs are validated against allowed patterns

## Troubleshooting

### Server Won't Start

```bash
# Check Node.js version (requires >= 18.0.0)
node --version

# Check dependencies
npm install

# Check environment variables
echo $OPENCLAW_SKILLS_PATH
```

### Skills Not Found

```bash
# Verify skills path
ls -la $OPENCLAW_SKILLS_PATH

# Check SKILL.md files exist
find $OPENCLAW_SKILLS_PATH -name "SKILL.md"
```

### Memory Resources Empty

```bash
# Memory directories may not exist yet - this is normal
# Resources will populate as the system runs
mkdir -p $OPENCLAW_MEMORY_PATH/{episodic,semantic,sessions}
```

## References

- [`GAP_ANALYSIS_REPORT.md`](../../docs/GAP_ANALYSIS_REPORT.md) - P2-1 MCP Server initiative
- [`SWARM_MEMORY_ARCHITECTURE.md`](../../docs/memory/SWARM_MEMORY_ARCHITECTURE.md) - Memory system documentation
- [`SKILLS.md`](../../docs/SKILLS.md) - Skills registry
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

---

*OpenClaw MCP Server - Model Context Protocol implementation for Heretek OpenClaw*
