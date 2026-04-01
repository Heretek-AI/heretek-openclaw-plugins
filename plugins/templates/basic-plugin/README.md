# {{pluginDisplayName}}

**Version:** 1.0.0  
**Type:** Basic Plugin Template  
**License:** MIT

## Overview

{{pluginDescription}}

This is a basic plugin template for the Heretek OpenClaw system. Use this template as a starting point for creating your own plugins.

## Features

- Basic plugin structure following OpenClaw conventions
- Event-driven architecture using EventEmitter
- Gateway integration for tools and skills
- Configuration management
- Health check script
- Test setup with Jest

## Installation

```bash
# Clone or copy this template
git clone https://github.com/your-org/openclaw-basic-plugin.git

# Navigate to plugin directory
cd openclaw-basic-plugin

# Install dependencies
npm install

# Link for development (optional)
openclaw plugins link .

# Or install directly
openclaw plugins install .
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Plugin settings
PLUGIN_ENABLED=true
PLUGIN_DEBUG=false
PLUGIN_TIMEOUT=30000
```

### OpenClaw Configuration

Add to `openclaw.json`:

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

### Gateway Integration

The plugin automatically integrates with the OpenClaw Gateway:

```javascript
// Plugin receives gateway instance during initialization
async initialize(gateway, options) {
  this.gateway = gateway;
  
  // Register tools
  const tools = await this.getTools();
  for (const tool of tools) {
    gateway.tools.register(tool);
  }
  
  // Setup event listeners
  gateway.on('agent:message', this.handleMessage.bind(this));
}
```

## API Reference

### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize(gateway, options)` | Initialize the plugin | `Promise<Plugin>` |
| `start()` | Start the plugin | `Promise<void>` |
| `stop()` | Stop the plugin | `Promise<void>` |
| `getStatus()` | Get plugin status | `Object` |
| `getTools()` | Get plugin tools | `Promise<Array>` |
| `shutdown()` | Shutdown plugin | `Promise<void>` |

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `initialized` | Plugin initialized | `{ name, version }` |
| `started` | Plugin started | `{ name }` |
| `stopped` | Plugin stopped | `{ name }` |
| `error` | Plugin error | `{ error }` |

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Linting

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Health Check

```bash
# Run health check
npm run healthcheck
```

## Project Structure

```
{{pluginName}}/
├── package.json          # Package configuration
├── openclaw.plugin.json  # OpenClaw plugin manifest
├── README.md             # This file
├── SKILL.md              # OpenClaw skill definition
├── .env.example          # Environment variables template
├── src/
│   └── index.js          # Main plugin entry point
├── config/
│   └── default.json      # Default configuration
├── scripts/
│   └── healthcheck.js    # Health check script
└── tests/
    └── index.test.js     # Unit tests
```

## Extending the Template

### Adding Tools

```javascript
async getTools() {
  return [
    {
      name: 'my-tool',
      description: 'Tool description',
      parameters: {
        param1: { type: 'string', required: true }
      },
      handler: async (params, context) => {
        // Tool implementation
        return { result: 'success' };
      }
    }
  ];
}
```

### Adding Skills

```javascript
async getSkills() {
  return [
    {
      name: 'my-skill',
      description: 'Skill description',
      handler: async (params, context) => {
        // Skill implementation
        return { result: 'success' };
      }
    }
  ];
}
```

### Handling Events

```javascript
setupEventListeners() {
  this.gateway.on('agent:message', (message) => {
    console.log('Message received:', message);
  });
  
  this.gateway.on('agent:thought', (thought) => {
    console.log('Thought generated:', thought);
  });
}
```

## Troubleshooting

### Plugin Not Loading

1. Check that `package.json` exists and is valid
2. Verify the `main` field points to the correct entry point
3. Ensure dependencies are installed: `npm install`
4. Check Gateway logs: `openclaw logs --plugin {{pluginName}}`

### Configuration Not Applied

1. Verify configuration in `openclaw.json`
2. Check environment variables are set
3. Restart Gateway after configuration changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - See LICENSE file for details.

## References

- [OpenClaw Plugin Documentation](../../docs/plugins/README.md)
- [Installation Guide](../../docs/plugins/INSTALLATION_GUIDE.md)
- [Development Guide](../../docs/plugins/DEVELOPMENT_GUIDE.md)

---

🦞 *The thought that never ends.*
