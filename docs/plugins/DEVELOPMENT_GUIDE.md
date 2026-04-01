# OpenClaw Plugin Development Guide

**Version:** 1.0.0  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28+

---

## Table of Contents

1. [Overview](#overview)
2. [Plugin Architecture](#plugin-architecture)
3. [Plugin Structure](#plugin-structure)
4. [Creating a Plugin](#creating-a-plugin)
5. [Plugin API](#plugin-api)
6. [Plugin Types](#plugin-types)
7. [Testing Plugins](#testing-plugins)
8. [Publishing Plugins](#publishing-plugins)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Overview

This guide covers the development of plugins for the Heretek OpenClaw system. Plugins are NPM-based modules that extend the Gateway functionality by providing additional capabilities to agents in the collective.

### Development Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.0.0+ | Runtime environment |
| npm | 9.0.0+ | Package management |
| OpenClaw CLI | Latest | Development tools |
| Jest | 29.0.0+ | Testing framework |
| ESLint | 9.0.0+ | Code linting |

### Quick Start

```bash
# Create a new plugin using the CLI
openclaw plugins create my-plugin

# Or manually create the structure
mkdir -p my-plugin/src
cd my-plugin
npm init -y
```

---

## Plugin Architecture

### Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      Plugin Lifecycle                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Discovery ──→ 2. Load ──→ 3. Initialize                     │
│         ▲                                      │                │
│         │                                      ▼                │
│         │                               4. Start                │
│         │                                      │                │
│         │                                      ▼                │
│         │                               5. Running              │
│         │                                      │                │
│         │                                      ▼                │
│         └────── 7. Reload ←── 6. Stop ←───────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Integration Points

| Integration Point | Description | Example |
|-------------------|-------------|---------|
| **Gateway Hooks** | Hook into Gateway events | `onMessage`, `onAgentStart` |
| **Agent Tools** | Provide tools to agents | `getTools()` |
| **Skills** | Extend skill capabilities | `getSkills()` |
| **API Endpoints** | Expose REST endpoints | `getEndpoints()` |
| **Event Emitters** | Emit custom events | `emit('custom:event')` |
| **Configuration** | Custom configuration schema | `getConfigSchema()` |

---

## Plugin Structure

### Standard Plugin Layout

```
my-plugin/
├── package.json              # Package configuration
├── openclaw.plugin.json      # OpenClaw plugin manifest
├── README.md                 # Plugin documentation
├── SKILL.md                  # OpenClaw skill definition
├── LICENSE                   # License file
├── .env.example              # Environment variables template
├── src/
│   ├── index.js              # Main entry point
│   ├── plugin.js             # Plugin implementation
│   ├── config.js             # Configuration handler
│   └── utils/                # Utility functions
├── config/
│   └── default.json          # Default configuration
├── scripts/
│   ├── healthcheck.js        # Health check script
│   └── migrate.js            # Database migrations
├── tests/
│   ├── plugin.test.js        # Unit tests
│   └── integration.test.js   # Integration tests
└── assets/                   # Static assets (icons, etc.)
```

### Package.json

```json
{
  "name": "@heretek-ai/openclaw-my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "main": "src/index.js",
  "types": "src/index.d.ts",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "lint": "eslint src/",
    "healthcheck": "node scripts/healthcheck.js"
  },
  "keywords": [
    "openclaw",
    "plugin",
    "heretek"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "eventemitter3": "^5.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^9.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "openclaw": ">=2026.3.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/openclaw-my-plugin"
  }
}
```

### OpenClaw Plugin Manifest

```json
{
  "id": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "A comprehensive plugin description",
  "kind": "utility",
  "keywords": ["utility", "enhancement", "tool"],
  "author": {
    "name": "Your Name",
    "email": "your@email.com",
    "url": "https://your-website.com"
  },
  "repository": "https://github.com/your-org/openclaw-my-plugin",
  "homepage": "https://github.com/your-org/openclaw-my-plugin#readme",
  "license": "MIT",
  "main": "src/index.js",
  "credentials": {
    "API_KEY": {
      "description": "API key for external service",
      "required": false,
      "source": "environment"
    }
  },
  "configSchema": {
    "type": "object",
    "properties": {
      "enabled": {
        "type": "boolean",
        "default": true
      },
      "timeout": {
        "type": "integer",
        "default": 30000
      }
    }
  }
}
```

---

## Creating a Plugin

### Step 1: Initialize the Project

```bash
mkdir my-plugin
cd my-plugin
npm init -y
```

### Step 2: Create the Plugin Entry Point

Create `src/index.js`:

```javascript
/**
 * My OpenClaw Plugin
 * @module my-plugin
 */

import EventEmitter from 'eventemitter3';

/**
 * Plugin class
 */
export class MyPlugin extends EventEmitter {
  /**
   * Plugin name
   * @type {string}
   */
  name = 'my-plugin';

  /**
   * Plugin version
   * @type {string}
   */
  version = '1.0.0';

  /**
   * Gateway instance
   * @type {Object}
   */
  gateway = null;

  /**
   * Plugin configuration
   * @type {Object}
   */
  config = {};

  /**
   * Initialize the plugin
   * @param {Object} gateway - Gateway instance
   * @param {Object} options - Plugin options
   * @returns {Promise<MyPlugin>}
   */
  async initialize(gateway, options = {}) {
    this.gateway = gateway;
    this.config = { ...this.defaultConfig, ...options };
    
    // Register with Gateway
    await this.registerWithGateway();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.emit('initialized', { name: this.name, version: this.version });
    
    return this;
  }

  /**
   * Default configuration
   * @type {Object}
   */
  defaultConfig = {
    enabled: true,
    timeout: 30000,
    debug: false
  };

  /**
   * Register with Gateway
   * @private
   */
  async registerWithGateway() {
    // Register plugin tools
    if (this.gateway.tools) {
      const tools = await this.getTools();
      for (const tool of tools) {
        this.gateway.tools.register(tool);
      }
    }
    
    // Register plugin skills
    if (this.gateway.skills) {
      const skills = await this.getSkills();
      for (const skill of skills) {
        this.gateway.skills.register(skill);
      }
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for Gateway events
    this.gateway?.on('agent:message', this.handleMessage.bind(this));
    this.gateway?.on('agent:started', this.handleAgentStarted.bind(this));
  }

  /**
   * Start the plugin
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.config.enabled) {
      this.emit('disabled', { reason: 'Plugin disabled in configuration' });
      return;
    }
    
    this.emit('started', { name: this.name });
  }

  /**
   * Stop the plugin
   * @returns {Promise<void>}
   */
  async stop() {
    this.emit('stopped', { name: this.name });
  }

  /**
   * Get plugin tools
   * @returns {Promise<Array>}
   */
  async getTools() {
    return [
      {
        name: 'my-tool',
        description: 'A useful tool',
        handler: async (params, context) => {
          return this.executeTool(params, context);
        }
      }
    ];
  }

  /**
   * Get plugin skills
   * @returns {Promise<Array>}
   */
  async getSkills() {
    return [];
  }

  /**
   * Handle agent messages
   * @param {Object} message - Message object
   */
  async handleMessage(message) {
    // Process message
  }

  /**
   * Handle agent started event
   * @param {Object} agent - Agent object
   */
  async handleAgentStarted(agent) {
    // Handle agent start
  }

  /**
   * Execute tool
   * @param {Object} params - Tool parameters
   * @param {Object} context - Execution context
   * @returns {Promise<Object>}
   */
  async executeTool(params, context) {
    // Tool implementation
    return { success: true, data: params };
  }

  /**
   * Get plugin status
   * @returns {Object}
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      enabled: this.config.enabled,
      running: true
    };
  }

  /**
   * Shutdown the plugin
   * @returns {Promise<void>}
   */
  async shutdown() {
    await this.stop();
    this.removeAllListeners();
    this.emit('shutdown');
  }
}

/**
 * Create plugin instance
 * @param {Object} options - Plugin options
 * @returns {Promise<MyPlugin>}
 */
export async function createPlugin(options = {}) {
  const plugin = new MyPlugin();
  return plugin;
}

export default MyPlugin;
```

### Step 3: Add Configuration Handler

Create `src/config.js`:

```javascript
/**
 * Configuration handler for my-plugin
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load configuration from file
 * @param {string} configPath - Path to config file
 * @returns {Object}
 */
export function loadConfig(configPath) {
  try {
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn(`[my-plugin] Could not load config from ${configPath}: ${error.message}`);
    return {};
  }
}

/**
 * Merge configurations with defaults
 * @param {Object} defaults - Default configuration
 * @param {Object} overrides - Override configuration
 * @returns {Object}
 */
export function mergeConfig(defaults, overrides = {}) {
  return { ...defaults, ...overrides };
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object}
 */
export function validateConfig(config) {
  const errors = [];
  
  if (typeof config.timeout !== 'number' || config.timeout < 0) {
    errors.push('timeout must be a positive number');
  }
  
  if (typeof config.enabled !== 'boolean') {
    errors.push('enabled must be a boolean');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get environment variable with default
 * @param {string} name - Environment variable name
 * @param {any} defaultValue - Default value
 * @returns {string}
 */
export function getEnv(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}
```

### Step 4: Create Health Check Script

Create `scripts/healthcheck.js`:

```javascript
#!/usr/bin/env node

/**
 * Health check script for my-plugin
 */

import { createPlugin } from '../src/index.js';

async function healthCheck() {
  try {
    const plugin = await createPlugin();
    await plugin.initialize({ enabled: true });
    await plugin.start();
    
    const status = plugin.getStatus();
    
    if (status.running) {
      console.log('✓ Plugin is healthy');
      await plugin.shutdown();
      process.exit(0);
    } else {
      console.error('✗ Plugin is not running');
      await plugin.shutdown();
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
```

---

## Plugin API

### Gateway Interface

The Gateway provides the following interface to plugins:

```javascript
/**
 * Gateway interface available to plugins
 */
interface Gateway {
  // Event handling
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data: any): void;
  
  // Agent management
  agents: {
    get(id: string): Agent;
    list(): Agent[];
    register(agent: Agent): void;
  };
  
  // Tool registry
  tools: {
    register(tool: Tool): void;
    unregister(name: string): void;
    get(name: string): Tool;
    list(): Tool[];
  };
  
  // Skill registry
  skills: {
    register(skill: Skill): void;
    unregister(name: string): void;
    get(name: string): Skill;
    list(): Skill[];
  };
  
  // Configuration
  config: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
  
  // Logging
  logger: {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  };
  
  // Database
  db: {
    query(sql: string, params?: any[]): Promise<any[]>;
    insert(table: string, data: Object): Promise<number>;
    update(table: string, data: Object, where: Object): Promise<void>;
    delete(table: string, where: Object): Promise<void>;
  };
  
  // Cache
  cache: {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
  };
  
  // Events
  events: {
    publish(channel: string, data: any): Promise<void>;
    subscribe(channel: string, handler: Function): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
  };
}
```

### Plugin Events

| Event | Description | Payload |
|-------|-------------|---------|
| `plugin:initialized` | Plugin initialized | `{ name, version }` |
| `plugin:started` | Plugin started | `{ name }` |
| `plugin:stopped` | Plugin stopped | `{ name }` |
| `plugin:error` | Plugin error | `{ name, error }` |
| `plugin:tool:called` | Tool called | `{ toolName, params, context }` |
| `plugin:skill:executed` | Skill executed | `{ skillName, result }` |

---

## Plugin Types

### Tool Plugins

Tool plugins provide specific capabilities that agents can invoke:

```javascript
export class ToolPlugin extends EventEmitter {
  async getTools() {
    return [
      {
        name: 'search-web',
        description: 'Search the web for information',
        parameters: {
          query: { type: 'string', required: true },
          limit: { type: 'number', default: 10 }
        },
        handler: async (params) => {
          return this.webSearch(params.query, params.limit);
        }
      }
    ];
  }
}
```

### Skill Plugins

Skill plugins extend the skill system:

```javascript
export class SkillPlugin extends EventEmitter {
  async getSkills() {
    return [
      {
        name: 'knowledge-retrieval',
        description: 'Retrieve knowledge from memory',
        handler: async (params, context) => {
          return this.retrieveKnowledge(params.query);
        }
      }
    ];
  }
}
```

### Integration Plugins

Integration plugins connect to external services:

```javascript
export class IntegrationPlugin extends EventEmitter {
  async initialize(gateway, options) {
    await super.initialize(gateway, options);
    await this.connectToExternalService();
  }
  
  async connectToExternalService() {
    // Connection logic
  }
}
```

### Cognitive Plugins

Cognitive plugins enhance agent cognition:

```javascript
export class CognitivePlugin extends EventEmitter {
  async processThought(thought, context) {
    // Enhance or modify thought
    return {
      ...thought,
      enhanced: true,
      plugins: ['my-cognitive-plugin']
    };
  }
}
```

---

## Testing Plugins

### Unit Tests

Create `tests/plugin.test.js`:

```javascript
/**
 * Unit tests for my-plugin
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MyPlugin } from '../src/index.js';

describe('MyPlugin', () => {
  let plugin;
  let mockGateway;

  beforeEach(async () => {
    mockGateway = {
      on: jest.fn(),
      tools: { register: jest.fn() },
      skills: { register: jest.fn() },
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }
    };

    plugin = new MyPlugin();
    await plugin.initialize(mockGateway, { enabled: true });
  });

  afterEach(async () => {
    await plugin.shutdown();
  });

  describe('initialize', () => {
    it('should initialize with gateway', async () => {
      expect(plugin.gateway).toBe(mockGateway);
      expect(plugin.config.enabled).toBe(true);
    });

    it('should emit initialized event', (done) => {
      plugin.on('initialized', (data) => {
        expect(data.name).toBe('my-plugin');
        expect(data.version).toBe('1.0.0');
        done();
      });
    });
  });

  describe('start', () => {
    it('should start the plugin', async () => {
      const startedPromise = new Promise((resolve) => {
        plugin.on('started', resolve);
      });
      
      await plugin.start();
      const data = await startedPromise;
      
      expect(data.name).toBe('my-plugin');
    });

    it('should not start if disabled', async () => {
      plugin.config.enabled = false;
      const disabledPromise = new Promise((resolve) => {
        plugin.on('disabled', resolve);
      });
      
      await plugin.start();
      const data = await disabledPromise;
      
      expect(data.reason).toBe('Plugin disabled in configuration');
    });
  });

  describe('getTools', () => {
    it('should return tools array', async () => {
      const tools = await plugin.getTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should have valid tool structure', async () => {
      const tools = await plugin.getTools();
      const tool = tools[0];
      
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('handler');
    });
  });

  describe('getStatus', () => {
    it('should return status object', () => {
      const status = plugin.getStatus();
      
      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('running');
    });
  });
});
```

### Integration Tests

Create `tests/integration.test.js`:

```javascript
/**
 * Integration tests for my-plugin
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createPlugin } from '../src/index.js';

describe('MyPlugin Integration', () => {
  let plugin;

  beforeAll(async () => {
    plugin = await createPlugin({ enabled: true });
  });

  afterAll(async () => {
    await plugin?.shutdown();
  });

  it('should execute tool successfully', async () => {
    const tools = await plugin.getTools();
    const tool = tools[0];
    
    const result = await tool.handler(
      { testParam: 'value' },
      { agentId: 'test-agent' }
    );
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const tools = await plugin.getTools();
    const tool = tools[0];
    
    // Test with invalid input
    await expect(tool.handler({ invalid: true }, {}))
      .resolves.toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- plugin.test.js

# Run in watch mode
npm test -- --watch
```

---

## Publishing Plugins

### Prepare for Publishing

1. Update version in `package.json`
2. Update changelog
3. Run tests
4. Build if using TypeScript

### Publish to npm

```bash
# Login to npm
npm login

# Dry run
npm publish --dry-run

# Publish
npm publish

# Publish scoped package
npm publish --access public
```

### Publish to ClawHub

```bash
# Register with ClawHub
openclaw clawhub register

# Publish plugin
openclaw clawhub publish ./my-plugin

# Verify publication
openclaw clawhub verify my-plugin
```

### Tagging Releases

```bash
# Create git tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes"
```

---

## Best Practices

### Code Style

```javascript
// Use ES modules
import { EventEmitter } from 'eventemitter3';

// Use async/await
async function initialize() {
  await this.setup();
}

// Handle errors gracefully
try {
  await this.process();
} catch (error) {
  this.emit('error', { error: error.message });
}

// Use JSDoc comments
/**
 * Process data
 * @param {Object} data - Data to process
 * @returns {Promise<Object>}
 */
async function process(data) {
  // Implementation
}
```

### Security

```javascript
// Validate all inputs
function validateInput(input) {
  if (typeof input !== 'string') {
    throw new Error('Invalid input type');
  }
  if (input.length > 1000) {
    throw new Error('Input too long');
  }
}

// Sanitize user input
function sanitize(input) {
  return input.replace(/[<>]/g, '');
}

// Use environment variables for secrets
const apiKey = process.env.API_KEY;

// Implement rate limiting
const rateLimiter = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(t => now - t < 60000);
  
  if (recentRequests.length > 10) {
    return false;
  }
  
  rateLimiter.set(userId, [...recentRequests, now]);
  return true;
}
```

### Performance

```javascript
// Use caching
const cache = new Map();
async function getCached(key, fetchFn, ttl = 60000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Batch operations
async function batchProcess(items, batchSize = 10) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(process));
    results.push(...batchResults);
  }
  return results;
}

// Clean up resources
async function shutdown() {
  await this.closeConnections();
  await this.clearCache();
  this.removeAllListeners();
}
```

### Documentation

```markdown
# My Plugin

## Overview
Brief description of what the plugin does.

## Installation
```bash
npm install @heretek-ai/openclaw-my-plugin
```

## Usage
```javascript
const plugin = await createPlugin();
await plugin.initialize(gateway);
```

## Configuration
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enabled | boolean | true | Enable plugin |
| timeout | number | 30000 | Request timeout |

## API
### Methods
- `initialize(gateway, options)` - Initialize plugin
- `start()` - Start plugin
- `stop()` - Stop plugin

## License
MIT
```

---

## Examples

### Example 1: Simple Logger Plugin

```javascript
import EventEmitter from 'eventemitter3';

export class LoggerPlugin extends EventEmitter {
  name = 'logger-plugin';
  version = '1.0.0';
  
  async initialize(gateway) {
    this.gateway = gateway;
    
    gateway.on('agent:message', (msg) => {
      this.log('message', msg);
    });
    
    gateway.on('agent:thought', (thought) => {
      this.log('thought', thought);
    });
    
    this.emit('initialized');
    return this;
  }
  
  log(type, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}]`, JSON.stringify(data, null, 2));
  }
}
```

### Example 2: Rate Limiter Plugin

```javascript
import EventEmitter from 'eventemitter3';

export class RateLimiterPlugin extends EventEmitter {
  name = 'rate-limiter';
  version = '1.0.0';
  
  limits = new Map();
  
  async initialize(gateway, options = {}) {
    this.gateway = gateway;
    this.config = {
      maxRequests: 100,
      windowMs: 60000,
      ...options
    };
    
    gateway.tools.register({
      name: 'check-rate-limit',
      description: 'Check if rate limit is exceeded',
      handler: (params) => this.checkLimit(params.agentId)
    });
    
    this.emit('initialized');
    return this;
  }
  
  checkLimit(agentId) {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const requests = this.limits.get(agentId) || [];
    const recentRequests = requests.filter(t => t > windowStart);
    
    if (recentRequests.length >= this.config.maxRequests) {
      return { allowed: false, retryAfter: this.config.windowMs };
    }
    
    recentRequests.push(now);
    this.limits.set(agentId, recentRequests);
    
    return { allowed: true, remaining: this.config.maxRequests - recentRequests.length };
  }
}
```

### Example 3: Metrics Plugin

```javascript
import EventEmitter from 'eventemitter3';

export class MetricsPlugin extends EventEmitter {
  name = 'metrics-plugin';
  version = '1.0.0';
  
  metrics = {
    messagesProcessed: 0,
    thoughtsGenerated: 0,
    errorsEncountered: 0,
    uptime: Date.now()
  };
  
  async initialize(gateway) {
    this.gateway = gateway;
    
    gateway.on('agent:message', () => {
      this.metrics.messagesProcessed++;
    });
    
    gateway.on('agent:thought', () => {
      this.metrics.thoughtsGenerated++;
    });
    
    gateway.on('error', () => {
      this.metrics.errorsEncountered++;
    });
    
    // Expose metrics endpoint
    gateway.api?.register({
      path: '/plugins/metrics/stats',
      method: 'GET',
      handler: () => this.getStats()
    });
    
    this.emit('initialized');
    return this;
  }
  
  getStats() {
    return {
      ...this.metrics,
      uptimeSeconds: Math.floor((Date.now() - this.metrics.uptime) / 1000)
    };
  }
  
  async start() {
    // Start periodic reporting
    this.reportInterval = setInterval(() => {
      this.emit('metrics', this.getStats());
    }, 60000);
    
    this.emit('started');
  }
  
  async stop() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    this.emit('stopped');
  }
}
```

---

## References

- [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md) - Installation guide
- [`PLUGIN_CLI.md`](./PLUGIN_CLI.md) - CLI reference
- [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) - Security guidelines
- [`../PLUGINS.md`](../PLUGINS.md) - Main plugins documentation
- [`../SKILLS.md`](../SKILLS.md) - Skills documentation

---

🦞 *The thought that never ends.*
