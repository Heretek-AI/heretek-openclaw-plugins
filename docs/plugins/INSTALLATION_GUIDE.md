# OpenClaw Plugin Installation Guide

**Version:** 1.0.0  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28+

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Plugin Sources](#plugin-sources)
4. [Installation Methods](#installation-methods)
5. [Plugin Discovery](#plugin-discovery)
6. [Configuration](#configuration)
7. [Verification](#verification)
8. [Compatibility Matrix](#compatibility-matrix)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides comprehensive instructions for installing plugins in the Heretek OpenClaw system. Plugins extend the Gateway functionality by providing additional capabilities to all agents in the collective.

### Plugin Types

| Type | Description | Examples |
|------|-------------|----------|
| **Internal Plugins** | Developed and maintained by the OpenClaw team | Consciousness, Liberation, Hybrid Search |
| **Community Plugins** | Developed by the community, vetted by OpenClaw | Episodic Memory, ClawBridge Dashboard |
| **External Plugins** | Third-party plugins with OpenClaw integration | SwarmClaw, skill-git-official |
| **Custom Plugins** | Plugins developed for your specific deployment | Organization-specific extensions |

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 18.0.0 | 20.x LTS |
| **npm** | 9.0.0 | 10.x |
| **OpenClaw Gateway** | v2026.3.0 | v2026.3.28+ |
| **Redis** | 6.0 | 7.x |
| **PostgreSQL** | 14.0 | 16.x |

### Verify Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check OpenClaw CLI version
openclaw --version

# Verify Gateway is running
openclaw status
```

### Required Dependencies

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y nodejs npm redis postgresql

# Install system dependencies (RHEL/CentOS)
sudo dnf install -y nodejs npm redis postgresql-server

# Install system dependencies (macOS)
brew install node redis postgresql
```

---

## Plugin Sources

### Official Sources

| Source | Description | URL |
|--------|-------------|-----|
| **OpenClaw Core** | Official plugins included with OpenClaw | `plugins/` directory |
| **ClawHub** | Community plugin registry | https://clawhub.io |
| **npm Registry** | NPM-hosted OpenClaw plugins | https://npmjs.com |
| **GitHub** | Source repositories for plugins | https://github.com/heretek-ai |

### Plugin Naming Conventions

```
@heretek-ai/openclaw-{name}-plugin   # Official plugins
openclaw-{name}-plugin               # Community plugins
{name}-plugin                        # Third-party plugins
clawhub:{author}/{name}              # ClawHub plugins
```

---

## Installation Methods

### Method 1: CLI Installation (Recommended)

The OpenClaw CLI provides the easiest way to install plugins.

```bash
# Install from npm
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin

# Install from ClawHub
openclaw plugins install clawhub:episodic-claw

# Install from local directory
openclaw plugins install ./plugins/my-local-plugin

# Install with specific version
openclaw plugins install @heretek-ai/openclaw-liberation-plugin@1.0.0

# List available plugins
openclaw plugins list

# Check plugin status
openclaw plugins status
```

### Method 2: NPM Installation

Install plugins directly using npm:

```bash
# Navigate to OpenClaw installation
cd /path/to/openclaw

# Install from npm
npm install @heretek-ai/openclaw-consciousness-plugin

# Install from GitHub
npm install github:heretek-ai/openclaw-liberation-plugin

# Install from local directory
npm install ./plugins/hybrid-search
```

After npm installation, register the plugin:

```bash
openclaw plugins register @heretek-ai/openclaw-consciousness-plugin
```

### Method 3: Git-Based Installation

Clone and link plugins from Git repositories:

```bash
# Clone the plugin repository
cd plugins
git clone https://github.com/heretek-ai/openclaw-consciousness-plugin.git

# Install dependencies
cd openclaw-consciousness-plugin
npm install

# Link the plugin
openclaw plugins link ./openclaw-consciousness-plugin
```

### Method 4: Manual Installation

Copy plugin files directly to the plugins directory:

```bash
# Create plugin directory
mkdir -p plugins/my-plugin

# Copy plugin files
cp -r /path/to/plugin/* plugins/my-plugin/

# Install dependencies
cd plugins/my-plugin
npm install

# Register the plugin
cd ../../
openclaw plugins register my-plugin
```

### Method 5: Docker Volume Mount

For Docker deployments, mount plugins as volumes:

```yaml
# docker-compose.yml
services:
  openclaw:
    volumes:
      - ./plugins:/app/plugins
      - ./plugins/my-plugin:/app/plugins/my-plugin:ro
```

---

## Plugin Discovery

### Automatic Discovery

OpenClaw automatically discovers plugins in the following locations:

```
plugins/
├── *-plugin/          # Plugin directories ending with -plugin
├── openclaw-*/        # Directories starting with openclaw-
└── @*/                # Scoped npm packages
```

### Discovery Configuration

Configure plugin discovery in `openclaw.json`:

```json
{
  "plugins": {
    "discovery": {
      "enabled": true,
      "paths": [
        "./plugins",
        "./custom-plugins",
        "/opt/openclaw/plugins"
      ],
      "exclude": [
        "**/node_modules/**",
        "**/*.test.js",
        "**/__tests__/**"
      ]
    }
  }
}
```

### Plugin Manifest

Each plugin must include a manifest file (`openclaw.plugin.json` or `package.json`):

```json
{
  "name": "@heretek-ai/openclaw-consciousness-plugin",
  "version": "1.0.0",
  "openclaw": {
    "id": "consciousness",
    "displayName": "Consciousness Plugin",
    "description": "Implements theories of consciousness for multi-agent coordination",
    "kind": "cognitive",
    "keywords": ["consciousness", "gwt", "iit", "phi"],
    "main": "src/index.js",
    "engines": {
      "openclaw": ">=2026.3.0",
      "node": ">=18.0.0"
    }
  }
}
```

---

## Configuration

### Global Plugin Configuration

Edit `openclaw.json` to configure plugins globally:

```json
{
  "plugins": {
    "enabled": true,
    "timeout": 30000,
    "retryAttempts": 3,
    "allowlist": [
      "consciousness",
      "liberation",
      "hybrid-search"
    ],
    "blocklist": [],
    "discovery": {
      "enabled": true,
      "paths": ["./plugins"]
    }
  }
}
```

### Per-Plugin Configuration

Configure individual plugins:

```json
{
  "plugins": {
    "consciousness": {
      "enabled": true,
      "config": {
        "globalWorkspace": {
          "ignitionThreshold": 0.7,
          "maxWorkspaceSize": 7
        },
        "phiEstimator": {
          "sampleIntervalMs": 10000
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

### Environment Variables

Configure plugins using environment variables:

```bash
# Plugin enable/disable
OPENCLAW_PLUGIN_CONSCIOUSNESS=true
OPENCLAW_PLUGIN_LIBERATION=true
OPENCLAW_PLUGIN_HYBRID_SEARCH=true

# Plugin-specific settings
CONSCIOUSNESS_PHI_INTERVAL=10000
LIBERATION_SHIELD_MODE=transparent
HYBRID_SEARCH_TOP_K=10
```

### Per-Agent Plugin Configuration

Configure plugins for specific agents:

```json
{
  "agents": {
    "steward": {
      "plugins": {
        "consciousness": {
          "enabled": true,
          "role": "coordinator"
        }
      }
    },
    "alpha": {
      "plugins": {
        "consciousness": {
          "enabled": true,
          "role": "participant"
        }
      }
    }
  }
}
```

---

## Verification

### Verify Installation

```bash
# List installed plugins
openclaw plugins list

# Check plugin status
openclaw plugins status

# Verify specific plugin
openclaw plugins verify consciousness

# Run plugin health check
openclaw plugins healthcheck
```

### Verify Plugin Loading

Check the Gateway logs for plugin loading:

```bash
# View Gateway logs
openclaw logs --follow | grep plugin

# Check for specific plugin
openclaw logs --grep "consciousness"
```

Expected output:
```
[plugin] Loading consciousness@1.0.0...
[plugin] Plugin consciousness initialized
[plugin] Plugin consciousness started
```

### Test Plugin Functionality

```javascript
// Test plugin via Gateway API
curl -X POST http://localhost:18789/api/plugins/consciousness/test \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "initialization"}'
```

---

## Compatibility Matrix

### OpenClaw Version Compatibility

| Plugin | v2026.3.x | v2026.2.x | v2026.1.x | v2025.x |
|--------|-----------|-----------|-----------|---------|
| Consciousness | ✅ | ⚠️ | ❌ | ❌ |
| Liberation | ✅ | ⚠️ | ❌ | ❌ |
| Hybrid Search | ✅ | ✅ | ⚠️ | ❌ |
| Skill Extensions | ✅ | ✅ | ✅ | ⚠️ |
| Episodic Memory | ✅ | ⚠️ | ❌ | ❌ |
| SwarmClaw Integration | ✅ | ✅ | ⚠️ | ❌ |

**Legend:** ✅ Fully Compatible | ⚠️ Partial/Limited | ❌ Not Compatible

### Node.js Version Compatibility

| Plugin | Node 18 | Node 20 | Node 22 |
|--------|---------|---------|---------|
| Consciousness | ✅ | ✅ | ✅ |
| Liberation | ✅ | ✅ | ✅ |
| Hybrid Search | ✅ | ✅ | ⚠️ |
| Episodic Memory (Go) | ✅ | ✅ | ✅ |

### Dependency Compatibility

| Plugin | Redis | PostgreSQL | Optional |
|--------|-------|------------|----------|
| Consciousness | 6.0+ | - | - |
| Liberation | 6.0+ | - | - |
| Hybrid Search | 6.0+ | 14.0+ | Neo4j (optional) |
| Episodic Memory | - | 14.0+ | Go 1.21+ |

---

## Troubleshooting

### Common Installation Issues

#### Plugin Not Found

```bash
# Error: Plugin "my-plugin" not found
```

**Solutions:**
1. Verify plugin is in the `plugins/` directory
2. Check plugin manifest exists (`openclaw.plugin.json` or `package.json`)
3. Run `openclaw plugins discover` to force discovery
4. Check file permissions: `ls -la plugins/my-plugin/`

#### Dependency Conflicts

```bash
# Error: Cannot resolve dependencies
```

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Remove `node_modules`: `rm -rf plugins/*/node_modules`
3. Reinstall: `npm install`
4. Check for conflicting versions in `package.json`

#### Plugin Loading Failure

```bash
# Error: Failed to load plugin "consciousness"
```

**Solutions:**
1. Check Gateway logs: `openclaw logs --grep consciousness`
2. Verify plugin entry point exists
3. Check for syntax errors: `node --check plugins/consciousness/src/index.js`
4. Verify OpenClaw version compatibility

#### Permission Denied

```bash
# Error: EACCES: permission denied
```

**Solutions:**
1. Fix ownership: `chown -R $(whoami) plugins/`
2. Fix permissions: `chmod -R 755 plugins/`
3. For Docker: ensure volume mounts have correct permissions

### Getting Help

```bash
# Get plugin help
openclaw plugins help <plugin-name>

# Report plugin issues
openclaw plugins report-issue <plugin-name>

# View plugin documentation
openclaw plugins docs <plugin-name>
```

---

## References

- [`PLUGIN_CLI.md`](./PLUGIN_CLI.md) - CLI commands reference
- [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) - Plugin development
- [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) - Security guidelines
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) - Detailed troubleshooting
- [`../PLUGINS.md`](../PLUGINS.md) - Main plugins documentation

---

🦞 *The thought that never ends.*
