---
name: {{pluginName}}
description: {{pluginDescription}}
version: 1.0.0
---

# {{pluginDisplayName}}

**Package:** `@heretek-ai/openclaw-{{pluginName}}`  
**Version:** 1.0.0  
**Type:** Basic Plugin  
**License:** MIT

## Purpose

{{pluginDescription}}

This plugin provides basic functionality for the Heretek OpenClaw system and serves as a template for creating new plugins.

## Installation

```bash
# Install from npm
npm install @heretek-ai/openclaw-{{pluginName}}

# Or install via CLI
openclaw plugins install @heretek-ai/openclaw-{{pluginName}}
```

## Configuration

### Environment Variables

```bash
# Plugin settings
PLUGIN_ENABLED=true
PLUGIN_DEBUG=false
PLUGIN_TIMEOUT=30000
```

### openclaw.json Configuration

```json
{
  "plugins": {
    "{{pluginName}}": {
      "enabled": true,
      "config": {
        "timeout": 30000,
        "debug": false
      }
    }
  }
}
```

## Usage

### Basic Usage

```javascript
import { createPlugin } from '@heretek-ai/openclaw-{{pluginName}}';

// Initialize plugin
const plugin = await createPlugin({
  enabled: true,
  timeout: 30000
});

// Start plugin
await plugin.start();

// Get status
const status = plugin.getStatus();
console.log(status);
```

### Tool Usage

```javascript
// Get available tools
const tools = await plugin.getTools();

// Execute tool
const result = await plugin.executeTool({
  message: 'Hello, World!'
}, {
  agentId: 'alpha'
});

console.log(result);
// { success: true, data: { message: 'Hello, World!' }, ... }
```

## API Reference

### Class: {{pluginDisplayName}}Plugin

#### Methods

##### `initialize(gateway, options)`

Initialize the plugin with Gateway instance.

**Parameters:**
- `gateway` (Object) - Gateway instance
- `options` (Object) - Plugin options

**Returns:** `Promise<{{pluginDisplayName}}Plugin>`

##### `start()`

Start the plugin.

**Returns:** `Promise<void>`

##### `stop()`

Stop the plugin.

**Returns:** `Promise<void>`

##### `getTools()`

Get plugin tools.

**Returns:** `Promise<Array>`

##### `getSkills()`

Get plugin skills.

**Returns:** `Promise<Array>`

##### `getStatus()`

Get plugin status.

**Returns:** `Object`

##### `shutdown()`

Shutdown the plugin.

**Returns:** `Promise<void>`

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `initialized` | `{ name, version }` | Plugin initialized |
| `started` | `{ name }` | Plugin started |
| `stopped` | `{ name }` | Plugin stopped |
| `disabled` | `{ reason }` | Plugin disabled |
| `error` | `{ error }` | Plugin error |
| `shutdown` | - | Plugin shutdown |

## Tools

### {{pluginName}}-tool

A basic tool for processing messages.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Message to process |

**Returns:**
```javascript
{
  success: true,
  data: { message: '...' },
  plugin: '{{pluginName}}',
  timestamp: 1234567890
}
```

## Troubleshooting

### Plugin Not Loading

1. Check that package.json exists and is valid
2. Verify the main field points to the correct entry point
3. Ensure dependencies are installed: `npm install`
4. Check Gateway logs: `openclaw logs --plugin {{pluginName}}`

### Configuration Not Applied

1. Verify configuration in openclaw.json
2. Check environment variables are set
3. Restart Gateway after configuration changes

## License

MIT License

## Repository

https://github.com/your-org/openclaw-{{pluginName}}

## References

- [OpenClaw Plugin Documentation](../../docs/plugins/README.md)
- [Installation Guide](../../docs/plugins/INSTALLATION_GUIDE.md)
- [Development Guide](../../docs/plugins/DEVELOPMENT_GUIDE.md)
