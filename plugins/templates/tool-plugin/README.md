# {{pluginDisplayName}}

**Version:** 1.0.0  
**Type:** Tool Plugin Template  
**License:** MIT

## Overview

{{pluginDescription}}

This is a tool plugin template for the Heretek OpenClaw system. Use this template when creating plugins that primarily provide tools to agents.

## Features

- Tool-focused plugin architecture
- Multiple tool support with parameter validation
- Context-aware tool execution
- Tool usage analytics
- Error handling and recovery

## Installation

```bash
# Clone or copy this template
git clone https://github.com/your-org/openclaw-{{pluginName}}.git

# Navigate to plugin directory
cd openclaw-{{pluginName}}

# Install dependencies
npm install

# Link for development
openclaw plugins link .

# Or install directly
openclaw plugins install .
```

## Tools

### {{toolName}}

{{toolDescription}}

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `input` | string | Yes | - | Input to process |
| `options` | object | No | `{}` | Additional options |

**Returns:**
```javascript
{
  success: true,
  result: { ... },
  metadata: {
    executionTime: 123,
    toolVersion: '1.0.0'
  }
}
```

**Example:**
```javascript
const result = await gateway.tools.execute('{{toolName}}', {
  input: 'data to process',
  options: { verbose: true }
});
```

## Configuration

### Environment Variables

```bash
# Plugin settings
PLUGIN_ENABLED=true
PLUGIN_DEBUG=false
PLUGIN_TIMEOUT=30000

# Tool-specific settings
{{toolName | upper}}_MAX_INPUT_LENGTH=10000
{{toolName | upper}}_CACHE_ENABLED=true
```

### OpenClaw Configuration

```json
{
  "plugins": {
    "{{pluginName}}": {
      "enabled": true,
      "config": {
        "timeout": 30000,
        "debug": false,
        "tools": {
          "{{toolName}}": {
            "maxInputLength": 10000,
            "cacheEnabled": true,
            "cacheTTL": 300000
          }
        }
      }
    }
  }
}
```

## Usage

### Using Tools via Gateway

```javascript
// Get available tools
const tools = gateway.tools.list();

// Execute a tool
const result = await gateway.tools.execute('{{toolName}}', {
  input: 'data',
  options: {}
}, {
  agentId: 'alpha',
  timeout: 30000
});
```

### Using Tools via Agent

```javascript
// In agent code
const result = await agent.useTool('{{toolName}}', {
  input: 'data'
});
```

## Development

### Adding New Tools

1. Create tool file in `src/tools/`:

```javascript
// src/tools/my-new-tool.js
export async function myNewTool(params, context) {
  // Validate input
  if (!params.input) {
    throw new Error('Input is required');
  }
  
  // Process
  const result = await process(params.input);
  
  return {
    success: true,
    result,
    metadata: {
      executionTime: Date.now() - startTime,
      toolVersion: '1.0.0'
    }
  };
}
```

2. Register tool in `src/index.js`:

```javascript
async getTools() {
  return [
    {
      name: 'my-new-tool',
      description: 'Tool description',
      parameters: {
        input: { type: 'string', required: true }
      },
      handler: myNewTool
    }
  ];
}
```

### Tool Testing

```javascript
import { {{toolName}} } from '../src/tools/{{toolName}}.js';

describe('{{toolName}}', () => {
  it('should process input correctly', async () => {
    const result = await {{toolName}}(
      { input: 'test data' },
      { agentId: 'test' }
    );
    
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
  });
});
```

## Project Structure

```
{{pluginName}}/
├── package.json
├── openclaw.plugin.json
├── README.md
├── SKILL.md
├── src/
│   ├── index.js          # Plugin entry point
│   └── tools/            # Tool implementations
│       ├── {{toolName}}.js
│       └── index.js      # Tools index
├── config/
│   └── default.json
├── scripts/
│   └── healthcheck.js
└── tests/
    ├── index.test.js
    └── tools/
        └── {{toolName}}.test.js
```

## Troubleshooting

### Tool Not Found

1. Check tool is registered in `getTools()`
2. Verify tool name matches exactly
3. Check plugin is loaded: `openclaw plugins status`

### Tool Execution Fails

1. Check input parameters match schema
2. Review tool logs: `openclaw logs --plugin {{pluginName}}`
3. Verify tool dependencies are installed

## License

MIT License

## References

- [OpenClaw Plugin Documentation](../../docs/plugins/README.md)
- [Development Guide](../../docs/plugins/DEVELOPMENT_GUIDE.md)

---

🦞 *The thought that never ends.*
