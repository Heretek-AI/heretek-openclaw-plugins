# OpenClaw Plugin CLI Reference

**Version:** 1.0.0  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28+

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Commands](#commands)
4. [Plugin Management](#plugin-management)
5. [Development Commands](#development-commands)
6. [Security Commands](#security-commands)
7. [Configuration](#configuration)
8. [Examples](#examples)

---

## Overview

The OpenClaw Plugin CLI provides command-line tools for managing plugins throughout their lifecycle - from creation and development to installation, configuration, and maintenance.

### CLI Structure

```
openclaw plugins <command> [options]

# Shorthand
openclaw p <command> [options]
```

---

## Installation

### Install OpenClaw CLI

```bash
# Global installation
npm install -g @heretek-ai/openclaw-cli

# Or use the bundled CLI
cd cli
npm link
```

### Verify Installation

```bash
# Check CLI version
openclaw --version

# Check plugin commands
openclaw plugins --help
```

---

## Commands

### Command Categories

| Category | Commands | Description |
|----------|----------|-------------|
| **Management** | `list`, `install`, `uninstall`, `update` | Plugin lifecycle |
| **Status** | `status`, `verify`, `healthcheck` | Plugin health |
| **Development** | `create`, `build`, `test`, `link` | Plugin development |
| **Security** | `sign`, `verify`, `audit`, `scan` | Security operations |
| **Configuration** | `config`, `enable`, `disable` | Plugin configuration |

---

## Plugin Management

### List Plugins

```bash
# List all installed plugins
openclaw plugins list

# List with details
openclaw plugins list --verbose

# List in JSON format
openclaw plugins list --json

# List by category
openclaw plugins list --category cognitive

# List by status
openclaw plugins list --status active
openclaw plugins list --status disabled
```

**Output:**
```
Installed Plugins (8):
┌─────────────────────────────┬─────────┬──────────┬──────────┐
│ Plugin                      │ Version │ Status   │ Category │
├─────────────────────────────┼─────────┼──────────┼──────────┤
│ consciousness               │ 1.0.0   │ active   │ cognitive│
│ liberation                  │ 1.0.0   │ active   │ autonomy │
│ hybrid-search               │ 1.0.0   │ active   │ rag      │
│ multi-doc                   │ 1.0.0   │ active   │ rag      │
│ skill-extensions            │ 1.0.0   │ active   │ extension│
│ mcp-connectors              │ 1.0.0   │ active   │ integration│
│ swarmclaw-integration       │ 1.0.0   │ active   │ integration│
│ conflict-monitor            │ 1.0.0   │ disabled │ cognitive│
└─────────────────────────────┴─────────┴──────────┴──────────┘
```

### Install Plugin

```bash
# Install from npm
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin

# Install from ClawHub
openclaw plugins install clawhub:episodic-claw

# Install from local directory
openclaw plugins install ./plugins/my-local-plugin

# Install specific version
openclaw plugins install @heretek-ai/openclaw-liberation-plugin@1.0.0

# Install with options
openclaw plugins install my-plugin --enabled --config ./config.json

# Install without dependencies
openclaw plugins install my-plugin --no-deps

# Force install (overwrite existing)
openclaw plugins install my-plugin --force
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--enabled` | `-e` | Enable plugin after install |
| `--config` | `-c` | Path to configuration file |
| `--no-deps` | `-n` | Skip dependency installation |
| `--force` | `-f` | Force installation |
| `--verbose` | `-v` | Verbose output |

### Uninstall Plugin

```bash
# Uninstall plugin
openclaw plugins uninstall consciousness

# Uninstall multiple plugins
openclaw plugins uninstall plugin-a plugin-b

# Uninstall and remove data
openclaw plugins uninstall my-plugin --purge

# Uninstall without confirmation
openclaw plugins uninstall my-plugin --yes
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--purge` | `-p` | Remove plugin data |
| `--yes` | `-y` | Skip confirmation |

### Update Plugins

```bash
# Update all plugins
openclaw plugins update

# Update specific plugin
openclaw plugins update consciousness

# Update to specific version
openclaw plugins update consciousness@1.1.0

# Check for updates without installing
openclaw plugins update --check

# Update with changelog
openclaw plugins update --changelog
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--check` | `-c` | Check only, don't update |
| `--changelog` | `-l` | Show changelog |
| `--dry-run` | `-d` | Show what would be updated |

---

## Status Commands

### Check Plugin Status

```bash
# Check status of all plugins
openclaw plugins status

# Check specific plugin status
openclaw plugins status consciousness

# Check status in JSON format
openclaw plugins status --json

# Check status with metrics
openclaw plugins status --metrics
```

**Output:**
```
Plugin Status Report
====================

consciousness (1.0.0)
├── Status: active
├── Health: healthy
├── Uptime: 72h 15m 32s
├── Memory: 128MB / 512MB
├── CPU: 2.5%
├── Events: 1,234 processed
└── Last Error: none

liberation (1.0.0)
├── Status: active
├── Health: healthy
├── Uptime: 72h 15m 32s
├── Memory: 96MB / 512MB
├── CPU: 1.8%
├── Events: 892 processed
└── Last Error: none
```

### Verify Plugin

```bash
# Verify plugin integrity
openclaw plugins verify consciousness

# Verify with hash check
openclaw plugins verify consciousness --hash

# Verify signature
openclaw plugins verify consciousness --signature

# Verify all plugins
openclaw plugins verify --all
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--hash` | `-h` | Verify hash |
| `--signature` | `-s` | Verify signature |
| `--all` | `-a` | Verify all plugins |

### Health Check

```bash
# Run health check
openclaw plugins healthcheck

# Check specific plugin
openclaw plugins healthcheck consciousness

# Continuous monitoring
openclaw plugins healthcheck --watch

# Health check with report
openclaw plugins healthcheck --report
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--watch` | `-w` | Continuous monitoring |
| `--report` | `-r` | Generate report |
| `--interval` | `-i` | Check interval (seconds) |

---

## Development Commands

### Create Plugin

```bash
# Create new plugin
openclaw plugins create my-plugin

# Create with template
openclaw plugins create my-plugin --template tool
openclaw plugins create my-plugin --template skill
openclaw plugins create my-plugin --template integration

# Create in specific directory
openclaw plugins create my-plugin --output ./plugins/

# Create with author info
openclaw plugins create my-plugin --author "Your Name" --email "your@email.com"
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--template` | `-t` | Template type (basic, tool, skill, integration) |
| `--output` | `-o` | Output directory |
| `--author` | `-a` | Author name |
| `--email` | `-e` | Author email |

### Build Plugin

```bash
# Build plugin
openclaw plugins build ./my-plugin

# Build with minification
openclaw plugins build ./my-plugin --minify

# Build TypeScript plugin
openclaw plugins build ./my-plugin --typescript

# Build and package
openclaw plugins build ./my-plugin --package
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--minify` | `-m` | Minify output |
| `--typescript` | `-t` | Compile TypeScript |
| `--package` | `-p` | Create package |
| `--watch` | `-w` | Watch mode |

### Test Plugin

```bash
# Run tests
openclaw plugins test ./my-plugin

# Run with coverage
openclaw plugins test ./my-plugin --coverage

# Run specific test file
openclaw plugins test ./my-plugin --test plugin.test.js

# Run in watch mode
openclaw plugins test ./my-plugin --watch

# Run with debug output
openclaw plugins test ./my-plugin --debug
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--coverage` | `-c` | Generate coverage report |
| `--watch` | `-w` | Watch mode |
| `--debug` | `-d` | Debug output |
| `--test` | `-t` | Specific test file |

### Link Plugin

```bash
# Link local plugin for development
openclaw plugins link ./my-plugin

# Link with alias
openclaw plugins link ./my-plugin --alias dev-plugin

# Unlink plugin
openclaw plugins unlink my-plugin
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--alias` | `-a` | Link alias |

---

## Security Commands

### Sign Plugin

```bash
# Sign plugin
openclaw plugins sign ./my-plugin

# Sign with specific key
openclaw plugins sign ./my-plugin --key ./private-key.pem

# Sign with metadata
openclaw plugins sign ./my-plugin --metadata version=1.0.0,author=team
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--key` | `-k` | Private key path |
| `--metadata` | `-m` | Additional metadata |
| `--output` | `-o` | Output signature file |

### Audit Plugin

```bash
# Run security audit
openclaw plugins audit ./my-plugin

# Audit with report
openclaw plugins audit ./my-plugin --report security-report.json

# Audit all plugins
openclaw plugins audit --all

# Audit dependencies only
openclaw plugins audit ./my-plugin --dependencies
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--report` | `-r` | Output report file |
| `--all` | `-a` | Audit all plugins |
| `--dependencies` | `-d` | Audit dependencies only |

### Scan Plugin

```bash
# Scan for vulnerabilities
openclaw plugins scan ./my-plugin

# Scan with severity filter
openclaw plugins scan ./my-plugin --severity high

# Scan and fix
openclaw plugins scan ./my-plugin --fix

# Scan all plugins
openclaw plugins scan --all
```

**Options:**
| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--severity` | `-s` | Minimum severity (low, medium, high, critical) |
| `--fix` | `-f` | Auto-fix vulnerabilities |
| `--all` | `-a` | Scan all plugins |

---

## Configuration Commands

### Configure Plugin

```bash
# View plugin configuration
openclaw plugins config consciousness

# Set configuration value
openclaw plugins config consciousness set enabled true

# Get configuration value
openclaw plugins config consciousness get timeout

# Reset to defaults
openclaw plugins config consciousness reset

# Export configuration
openclaw plugins config consciousness export > config.json

# Import configuration
openclaw plugins config consciousness import ./config.json
```

### Enable/Disable Plugin

```bash
# Enable plugin
openclaw plugins enable consciousness

# Disable plugin
openclaw plugins disable consciousness

# Toggle plugin state
openclaw plugins toggle consciousness

# Enable multiple plugins
openclaw plugins enable consciousness liberation hybrid-search
```

---

## Examples

### Quick Start

```bash
# Create a new plugin
openclaw plugins create my-awesome-plugin --template tool

# Navigate to plugin directory
cd my-awesome-plugin

# Install dependencies
npm install

# Link for development
openclaw plugins link .

# Run tests
openclaw plugins test .

# Build for production
openclaw plugins build . --minify

# Sign the plugin
openclaw plugins sign .

# Install in OpenClaw
openclaw plugins install . --enabled
```

### Daily Operations

```bash
# Morning health check
openclaw plugins healthcheck --report

# Check for updates
openclaw plugins update --check

# Update all plugins
openclaw plugins update

# Verify after update
openclaw plugins verify --all

# Check status
openclaw plugins status --metrics
```

### Security Workflow

```bash
# Audit before deployment
openclaw plugins audit ./my-plugin --report audit.json

# Scan for vulnerabilities
openclaw plugins scan ./my-plugin

# Sign after passing audits
openclaw plugins sign ./my-plugin --key ./secure-key.pem

# Verify signature
openclaw plugins verify ./my-plugin --signature
```

### Troubleshooting

```bash
# Plugin not loading - check status
openclaw plugins status my-plugin

# Verify plugin integrity
openclaw plugins verify my-plugin

# Run health check
openclaw plugins healthcheck my-plugin

# View plugin logs
openclaw logs --plugin my-plugin

# Check configuration
openclaw plugins config my-plugin
```

---

## Configuration

### CLI Configuration

Create `~/.openclaw/cli-config.json`:

```json
{
  "plugins": {
    "registry": "https://registry.openclaw.io",
    "clawhub": "https://clawhub.io",
    "npmRegistry": "https://registry.npmjs.org",
    "defaultTemplate": "basic",
    "autoUpdate": false,
    "autoVerify": true,
    "securityLevel": "standard",
    "sandbox": {
      "enabled": true,
      "level": "moderate"
    },
    "logging": {
      "level": "info",
      "format": "json"
    }
  }
}
```

### Environment Variables

```bash
# Plugin registry
export OPENCLAW_PLUGIN_REGISTRY=https://registry.openclaw.io

# ClawHub URL
export OPENCLAW_CLAWHUB_URL=https://clawhub.io

# NPM registry
export OPENCLAW_NPM_REGISTRY=https://registry.npmjs.org

# Security level
export OPENCLAW_PLUGIN_SECURITY_LEVEL=standard

# Sandbox settings
export OPENCLAW_PLUGIN_SANDBOX_ENABLED=true

# Logging
export OPENCLAW_PLUGIN_LOG_LEVEL=info
```

---

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Plugin not found |
| 3 | Permission denied |
| 4 | Network error |
| 5 | Verification failed |
| 6 | Security violation |
| 7 | Configuration error |

---

## References

- [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md) - Installation guide
- [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) - Development guide
- [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) - Security guidelines
- [`../PLUGINS.md`](../PLUGINS.md) - Main plugins documentation

---

🦞 *The thought that never ends.*
