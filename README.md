# Heretek OpenClaw Plugins

> Plugin system, SDK, templates, and registry for Heretek OpenClaw.

## Overview

OpenClaw plugins extend the Gateway functionality by providing additional capabilities to all agents in the collective. Plugins are NPM-based modules that integrate with the Gateway's plugin system.

## Installed Plugins

| Plugin | ID | Package | Purpose |
|--------|-----|---------|---------|
| Consciousness | `consciousness` | `@heretek-ai/openclaw-consciousness-plugin` | GWT, Phi (IIT), AST, SDT, FEP theories |
| Liberation | `liberation` | `@heretek-ai/openclaw-liberation-plugin` | Agent ownership, safety constraint removal |
| Hybrid Search | `hybrid-search` | `openclaw-hybrid-search-plugin` | Vector + keyword search fusion |
| Multi-Doc Retrieval | `multi-doc` | `openclaw-multi-doc-retrieval` | Multi-document context retrieval |
| Skill Extensions | `skill-extensions` | `openclaw-skill-extensions` | Custom skill composition and versioning |

## Installation

### Install a Plugin

```bash
# From npm
npm install @heretek-ai/openclaw-consciousness-plugin

# Link locally
cd plugins/openclaw-consciousness-plugin
npm link
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin

# List installed plugins
openclaw plugins list
```

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

## Plugin CLI

```bash
# Install a plugin
openclaw plugins install <package-name>

# List installed plugins
openclaw plugins list

# Enable a plugin
openclaw plugins enable <plugin-id>

# Disable a plugin
openclaw plugins disable <plugin-id>

# Update plugins
openclaw plugins update

# Remove a plugin
openclaw plugins remove <plugin-id>
```

## Development

### Create a New Plugin

```bash
# Use template
npx create-openclaw-plugin my-plugin

# Or clone template
git clone https://github.com/heretek/openclaw-plugin-template.git my-plugin
cd my-plugin
npm install
```

### Testing Plugins

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint
npm run lint
```

## Documentation

- [Installation Guide](docs/INSTALLATION_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Plugin Registry](docs/PLUGIN_REGISTRY.md)
- [Security Guide](docs/SECURITY_GUIDE.md)
- [CLI Reference](docs/PLUGIN_CLI.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Related Repositories

- [Core](https://github.com/heretek/heretek-openclaw-core) - Gateway and agents
- [CLI](https://github.com/heretek/heretek-openclaw-cli) - Deployment CLI
- [Dashboard](https://github.com/heretek/heretek-openclaw-dashboard) - Health monitoring
- [Deploy](https://github.com/heretek/heretek-openclaw-deploy) - Infrastructure as Code
- [Docs](https://github.com/heretek/heretek-openclaw-docs) - Documentation site

## License

MIT

## Support

- **Issues:** https://github.com/heretek/heretek-openclaw-plugins/issues
- **Discussions:** https://github.com/heretek/heretek-openclaw-plugins/discussions

---

🦞 *The thought that never ends.*
