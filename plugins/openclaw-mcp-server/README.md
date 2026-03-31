# OpenClaw MCP Server

**Model Context Protocol (MCP) server for Heretek OpenClaw skills and memory exposure**

## Overview

The OpenClaw MCP Server provides standardized access to Heretek OpenClaw capabilities through the Model Context Protocol. It exposes:

- **Resources**: Agent memories, knowledge base, skill definitions
- **Tools**: Skill execution endpoints, memory operations, knowledge search
- **Prompts**: Common agent interaction templates

This implementation supersedes the basic MCP client in [`openclaw-mcp-connectors`](../openclaw-mcp-connectors/) by providing a full MCP server that external clients can connect to.

## Installation

```bash
npm install @heretek-ai/openclaw-mcp-server
```

## Usage

### As a Standalone Server

```bash
# Using npx
npx openclaw-mcp-server

# Or directly
node src/index.js
```

### With Environment Variables

```bash
OPENCLAW_SKILLS_PATH=./skills \
OPENCLAW_MEMORY_PATH=./memory \
OPENCLAW_KNOWLEDGE_PATH=./knowledge \
npx openclaw-mcp-server
```

### Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `OPENCLAW_SKILLS_PATH` | `./skills` | Path to OpenClaw skills directory |
| `OPENCLAW_MEMORY_PATH` | `./memory` | Path to memory storage directory |
| `OPENCLAW_KNOWLEDGE_PATH` | `./knowledge` | Path to knowledge base directory |

## Exposed Resources

### Memory Resources

| URI | Description |
|-----|-------------|
| `memory://episodic/list` | List all episodic memories |
| `memory://episodic/{id}` | Get specific episodic memory |
| `memory://semantic/list` | List all semantic schemas |
| `memory://semantic/{schemaId}` | Get specific semantic schema |
| `memory://session/list` | List all agent sessions |
| `memory://session/{agentId}` | Get agent session memory |
| `memory://swarm/stats` | Get swarm memory statistics |

### Knowledge Resources

| URI | Description |
|-----|-------------|
| `knowledge://docs/list` | List all documents |
| `knowledge://docs/{path}` | Get specific document |
| `knowledge://schemas/list` | List knowledge schemas |
| `knowledge://schemas/{id}` | Get specific schema |
| `knowledge://graph/stats` | Get knowledge graph statistics |
| `knowledge://ingest/status` | Get ingestion status |

### Skill Resources

| URI | Description |
|-----|-------------|
| `skill://list` | List all available skills |
| `skill://{name}` | Get specific skill definition |
| `skill://categories` | List skill categories |
| `skill://category/{category}` | List skills in category |

## Exposed Tools

### Skill Tools

| Tool | Description |
|------|-------------|
| `skill-execute` | Execute any OpenClaw skill by name |
| `skill-list` | List all available skills |
| `skill-info` | Get information about a skill |
| `skill-{name}` | Quick access to specific skills |

### Memory Tools

| Tool | Description |
|------|-------------|
| `memory-search` | Search across memory using natural language |
| `memory-read` | Read specific memory by ID |
| `memory-stats` | Get swarm memory statistics |
| `memory-consolidate` | Trigger memory consolidation |

### Knowledge Tools

| Tool | Description |
|------|-------------|
| `knowledge-search` | Hybrid search (vector + keyword) |
| `knowledge-read` | Read specific document |
| `knowledge-ingest` | Ingest new document |
| `knowledge-graph-query` | Query knowledge graph |

## Exposed Prompts

| Prompt | Description |
|--------|-------------|
| `agent-deliberation` | Triad deliberation template |
| `agent-proposal` | Create new proposal |
| `agent-safety-review` | Sentinel safety review |
| `agent-memory-query` | Memory query template |
| `agent-knowledge-search` | Knowledge search template |
| `agent-skill-execution` | Skill execution request |
| `agent-explorer-intel` | Explorer intelligence request |
| `agent-historian-retrieval` | Historian retrieval request |
| `agent-coder-implementation` | Coder implementation request |
| `agent-dreamer-synthesis` | Dreamer synthesis request |
| `agent-empath-user-context` | Empath user context query |
| `agent-steward-orchestrate` | Steward orchestration request |

## Integration with MCP Connectors

The MCP Server works alongside the existing [`openclaw-mcp-connectors`](../openclaw-mcp-connectors/) plugin:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Integration Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │  External MCP        │         │  OpenClaw MCP        │     │
│  │  Clients             │         │  Connectors          │     │
│  │  (IDEs, Agents)      │         │  (Client-side)       │     │
│  └──────────┬───────────┘         └──────────┬───────────┘     │
│             │                                │                  │
│             │  MCP Protocol                  │  MCP Protocol    │
│             │  (stdio/sse)                   │  (stdio/sse)     │
│             ▼                                ▼                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              OpenClaw MCP Server                          │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │  Resources  │  │   Tools     │  │    Prompts      │   │   │
│  │  │  Handler    │  │  Handler    │  │    Handler      │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│             │                                │                  │
│             ▼                                ▼                  │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │  OpenClaw Skills     │         │  OpenClaw Memory     │     │
│  │  (48 skills)         │         │  (3-tier system)     │     │
│  └──────────────────────┘         └──────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Connection Example

```javascript
// External client connecting to OpenClaw MCP Server
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['openclaw-mcp-server'],
});

const client = new Client({
  name: 'my-agent',
  version: '1.0.0',
});

await client.connect(transport);

// List available resources
const resources = await client.request({ method: 'resources/list' });

// Read a resource
const memory = await client.request({
  method: 'resources/read',
  params: { uri: 'memory://episodic/list' },
});

// Execute a skill
const result = await client.request({
  method: 'tools/call',
  params: {
    name: 'skill-execute',
    arguments: {
      skillName: 'healthcheck',
      arguments: [],
    },
  },
});

// Get a prompt
const prompt = await client.request({
  method: 'prompts/get',
  params: {
    name: 'agent-deliberation',
    arguments: {
      proposal: 'Implement new feature X',
      priority: 'high',
    },
  },
});
```

## Architecture

### Handler Structure

```
src/
├── index.js                 # Main server entry point
└── handlers/
    ├── memory-resources.js  # Memory resource handler
    ├── knowledge-resources.js # Knowledge resource handler
    ├── skill-resources.js   # Skill resource handler
    ├── skill-tools.js       # Skill tool handler
    └── prompts.js           # Prompt template handler
```

### Data Flow

```
1. MCP Client Request
         │
         ▼
2. MCP Server (index.js)
         │
         ▼
3. Request Handler Routing
   ├── Resources → Memory/Knowledge/Skill handlers
   ├── Tools → Skill/Memory/Knowledge tool handlers
   └── Prompts → Prompt handler
         │
         ▼
4. OpenClaw Resources
   ├── Skills (48 skills)
   ├── Memory (3-tier system)
   └── Knowledge (documents, schemas, graph)
         │
         ▼
5. Response formatted as MCP result
```

## Development

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Adding New Resources

1. Create handler in `src/handlers/`
2. Implement `listResources()` and `readResource(uri)`
3. Register in main server `index.js`

### Adding New Tools

1. Implement tool in appropriate handler
2. Add to `listTools()` return array
3. Add handler in `callTool(name, args)`
4. Register in main server `index.js`

### Adding New Prompts

1. Add template definition in `prompts.js`
2. Implement `_generate{PromptName}Prompt()` method
3. Add case in `_generatePrompt()` switch

## License

MIT

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [OpenClaw MCP Connectors](../openclaw-mcp-connectors/)
- [OpenClaw Skills Documentation](../../docs/SKILLS.md)
- [Swarm Memory Architecture](../../docs/memory/SWARM_MEMORY_ARCHITECTURE.md)
