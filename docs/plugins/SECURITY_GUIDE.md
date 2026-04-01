# OpenClaw Plugin Security Guide

**Version:** 1.0.0  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28+

---

## Table of Contents

1. [Overview](#overview)
2. [Security Principles](#security-principles)
3. [Plugin Verification](#plugin-verification)
4. [Permission Model](#permission-model)
5. [Sandboxing](#sandboxing)
6. [API Key Management](#api-key-management)
7. [Secure Development](#secure-development)
8. [Security Auditing](#security-auditing)
9. [Incident Response](#incident-response)
10. [Security Checklist](#security-checklist)

---

## Overview

This guide outlines security considerations, best practices, and requirements for developing, installing, and managing plugins in the Heretek OpenClaw system. Security is paramount when extending the collective's capabilities through plugins.

### Security Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| **Trusted** | Full system access | Internal plugins, verified community plugins |
| **Restricted** | Limited access with sandboxing | Community plugins, external plugins |
| **Isolated** | Maximum isolation, minimal permissions | Unverified plugins, experimental plugins |

---

## Security Principles

### Principle 1: Least Privilege

Plugins should only have access to the minimum resources necessary for their function.

```javascript
// ❌ Bad: Requesting excessive permissions
{
  "permissions": ["filesystem:full", "network:full", "database:full"]
}

// ✅ Good: Requesting specific permissions
{
  "permissions": [
    "filesystem:read:./data/*",
    "network:https:api.example.com",
    "database:read:plugin_data"
  ]
}
```

### Principle 2: Defense in Depth

Multiple security layers should be implemented:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Plugin Verification (signature, hash)                  │
│  Layer 2: Permission Enforcement (capability-based)              │
│  Layer 3: Sandboxing (isolation, resource limits)                │
│  Layer 4: Runtime Monitoring (behavior analysis)                 │
│  Layer 5: Audit Logging (forensics)                              │
└─────────────────────────────────────────────────────────────────┘
```

### Principle 3: Zero Trust

Never trust plugin input or behavior implicitly:

```javascript
// Always validate input
function validateInput(input, schema) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new SecurityError('Invalid input', result.error);
  }
  return result.data;
}

// Always sanitize output
function sanitizeOutput(output) {
  return output.replace(/[<>]/g, '');
}

// Always verify state
function verifyState(state, expectedHash) {
  const actualHash = crypto.hash(state);
  if (actualHash !== expectedHash) {
    throw new SecurityError('State tampering detected');
  }
}
```

### Principle 4: Secure by Default

Plugins should be secure out of the box:

```javascript
// Default to secure settings
const defaultConfig = {
  enabled: false,           // Disabled by default
  debug: false,             // Debug disabled
  allowNetwork: false,      // Network disabled
  allowFilesystem: false,   // Filesystem disabled
  maxMemory: 256 * 1024 * 1024,  // Memory limit
  timeout: 30000            // Request timeout
};
```

---

## Plugin Verification

### Signature Verification

Plugins should be cryptographically signed:

```bash
# Sign a plugin
openclaw plugins sign ./my-plugin --key ./private-key.pem

# Verify a plugin signature
openclaw plugins verify ./my-plugin

# View signature details
openclaw plugins inspect ./my-plugin
```

### Signature Format

```json
{
  "plugin": "my-plugin",
  "version": "1.0.0",
  "hash": "sha256:abc123...",
  "signature": "MEUCIQD...",
  "signer": {
    "name": "OpenClaw Team",
    "keyId": "key-2026-001",
    "certificate": "..."
  },
  "timestamp": "2026-03-31T00:00:00Z"
}
```

### Hash Verification

```bash
# Generate plugin hash
openclaw plugins hash ./my-plugin

# Verify hash matches registry
openclaw plugins verify-hash ./my-plugin --expected abc123...
```

### Trust Levels

| Trust Level | Verification Required | Auto-Update |
|-------------|----------------------|-------------|
| **Trusted** | Signature + Hash + Review | ✅ Yes |
| **Verified** | Signature + Hash | ⚠️ Manual |
| **Unknown** | None | ❌ No |

---

## Permission Model

### Permission Categories

| Category | Permissions | Description |
|----------|-------------|-------------|
| **filesystem** | `read`, `write`, `execute` | File system access |
| **network** | `http`, `https`, `tcp`, `udp` | Network access |
| **database** | `read`, `write`, `admin` | Database access |
| **process** | `spawn`, `kill`, `signal` | Process control |
| **environment** | `read`, `write` | Environment variables |
| **agent** | `read`, `write`, `execute` | Agent access |
| **gateway** | `read`, `write`, `admin` | Gateway access |

### Permission Syntax

```
<category>:<action>:<resource>

Examples:
- filesystem:read:/app/data/*
- filesystem:write:/app/plugins/my-plugin/*
- network:https:api.example.com:443
- database:read:plugin_data.*
- agent:read:alpha,beta,charlie
```

### Permission Declaration

```json
{
  "permissions": {
    "filesystem": {
      "read": ["./data/*", "./config/*"],
      "write": ["./plugins/my-plugin/state/*"]
    },
    "network": {
      "https": ["api.example.com"]
    },
    "database": {
      "read": ["plugin_data"],
      "write": ["plugin_data"]
    },
    "agent": {
      "read": ["*"],
      "execute": ["healthcheck", "status"]
    }
  }
}
```

### Permission Enforcement

```javascript
class PermissionManager {
  constructor(permissions) {
    this.permissions = this.parsePermissions(permissions);
  }

  async check(permission, resource) {
    const [category, action] = permission.split(':');
    
    if (!this.permissions[category]) {
      throw new SecurityError(`Category ${category} not permitted`);
    }
    
    if (!this.permissions[category][action]) {
      throw new SecurityError(`Action ${action} not permitted for ${category}`);
    }
    
    const allowed = this.permissions[category][action];
    if (!this.matchResource(allowed, resource)) {
      throw new SecurityError(`Resource ${resource} not permitted`);
    }
    
    return true;
  }

  matchResource(patterns, resource) {
    for (const pattern of patterns) {
      if (this.match(pattern, resource)) {
        return true;
      }
    }
    return false;
  }

  match(pattern, resource) {
    // Simple glob matching
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(resource);
  }
}

// Usage
const pm = new PermissionManager(plugin.permissions);
await pm.check('filesystem:read', '/app/data/config.json');
```

### Permission Requests

```javascript
// Request additional permissions at runtime
async requestPermission(permission, reason) {
  const request = {
    plugin: this.name,
    permission,
    reason,
    timestamp: Date.now()
  };
  
  // Emit request event for user approval
  this.gateway.emit('plugin:permission-request', request);
  
  // Wait for approval
  return new Promise((resolve, reject) => {
    const handler = (response) => {
      if (response.plugin === this.name && response.permission === permission) {
        if (response.approved) {
          this.grantedPermissions.push(permission);
          resolve(true);
        } else {
          reject(new SecurityError('Permission denied'));
        }
      }
    };
    
    this.gateway.on('plugin:permission-response', handler);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      this.gateway.off('plugin:permission-response', handler);
      reject(new SecurityError('Permission request timeout'));
    }, 30000);
  });
}
```

---

## Sandboxing

### Sandbox Levels

| Level | Isolation | Resource Limits | Use Case |
|-------|-----------|-----------------|----------|
| **Full** | Complete isolation | Strict | Untrusted plugins |
| **Moderate** | Process isolation | Moderate | Community plugins |
| **Minimal** | Thread isolation | Lenient | Trusted plugins |
| **None** | No isolation | None | Internal plugins |

### Resource Limits

```json
{
  "sandbox": {
    "level": "moderate",
    "limits": {
      "memory": "512MB",
      "cpu": "50%",
      "disk": "1GB",
      "network": {
        "bandwidth": "10MB/s",
        "connections": 100
      },
      "processes": 5,
      "fileDescriptors": 100
    },
    "timeout": {
      "startup": 30000,
      "request": 10000,
      "shutdown": 5000
    }
  }
}
```

### Node.js Sandbox

```javascript
import { Worker, isMainThread, parentPort } from 'worker_threads';

class PluginSandbox {
  constructor(pluginPath, options) {
    this.pluginPath = pluginPath;
    this.options = options;
    this.worker = null;
  }

  async start() {
    this.worker = new Worker(this.pluginPath, {
      env: this.sanitizeEnv(),
      resourceLimits: {
        maxYoungGenerationSizeMb: 256,
        maxOldGenerationSizeMb: 512,
        codeRangeSizeMb: 64,
        stackSizeMb: 10
      },
      execArgv: ['--max-old-space-size=512']
    });

    this.setupWorkerListeners();
    
    return new Promise((resolve, reject) => {
      this.worker.once('online', () => resolve(this));
      this.worker.once('error', reject);
    });
  }

  sanitizeEnv() {
    // Only pass necessary environment variables
    const allowed = ['NODE_ENV', 'PLUGIN_CONFIG'];
    const env = {};
    for (const key of allowed) {
      if (process.env[key]) {
        env[key] = process.env[key];
      }
    }
    return env;
  }

  setupWorkerListeners() {
    this.worker.on('message', (msg) => {
      this.handleMessage(msg);
    });

    this.worker.on('error', (err) => {
      console.error('[Sandbox] Worker error:', err);
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[Sandbox] Worker exited with code ${code}`);
      }
    });
  }

  async execute(method, params) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new SecurityError('Execution timeout'));
        this.worker.terminate();
      }, this.options.timeout || 10000);

      this.worker.once('message', (result) => {
        clearTimeout(timeout);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.data);
        }
      });

      this.worker.postMessage({ method, params });
    });
  }

  async shutdown() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
```

### Docker Sandbox

For maximum isolation, run plugins in Docker containers:

```dockerfile
# plugins/sandbox/Dockerfile
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 plugin && \
    adduser -D -u 1001 -G plugin plugin

# Set working directory
WORKDIR /plugin

# Copy plugin files
COPY --chown=plugin:plugin . .

# Install dependencies
RUN npm ci --only=production

# Switch to non-root user
USER plugin

# Resource limits are enforced at Docker level
CMD ["node", "src/index.js"]
```

```yaml
# docker-compose.sandbox.yml
services:
  plugin-sandbox:
    build: ./plugins/my-plugin
    container_name: plugin-my-plugin
    read_only: true
    tmpfs:
      - /tmp:size=100M
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    networks:
      - plugin-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M
```

---

## API Key Management

### Secure Storage

Never store API keys in code or version control:

```javascript
// ❌ Bad: Hardcoded API key
const API_KEY = 'sk-abc123...';

// ✅ Good: Environment variable
const API_KEY = process.env.PLUGIN_API_KEY;

// ✅ Better: Secrets manager
import { SecretsManager } from '@openclaw/secrets';

const secrets = new SecretsManager();
const API_KEY = await secrets.get('plugin-api-key');
```

### Environment Variables

```bash
# .env.example (commit this)
PLUGIN_API_KEY=your-api-key-here
PLUGIN_SECRET=your-secret-here

# .env (never commit this)
PLUGIN_API_KEY=sk-actual-key-123
PLUGIN_SECRET=actual-secret-456
```

### Key Rotation

```javascript
class KeyManager {
  constructor() {
    this.currentKey = null;
    this.previousKey = null;
    this.rotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days
  }

  async rotate() {
    const newKey = await this.generateKey();
    this.previousKey = this.currentKey;
    this.currentKey = newKey;
    
    // Store with timestamp
    await this.storeKey(newKey, Date.now());
    
    // Schedule next rotation
    setTimeout(() => this.rotate(), this.rotationInterval);
  }

  async generateKey() {
    const bytes = crypto.randomBytes(32);
    return `sk_${bytes.toString('base64url')}`;
  }

  async storeKey(key, timestamp) {
    // Store in secure location
    await secrets.set(`plugin-key-${timestamp}`, key);
  }

  async validate(key) {
    const current = await secrets.get(`plugin-key-${this.currentKey}`);
    const previous = await secrets.get(`plugin-key-${this.previousKey}`);
    
    return key === current || key === previous;
  }
}
```

### Key Scoping

Limit API keys to specific permissions:

```json
{
  "apiKeys": {
    "read-only": {
      "key": "sk_read_...",
      "permissions": ["read"],
      "resources": ["public/*"]
    },
    "plugin-specific": {
      "key": "sk_plugin_...",
      "permissions": ["read", "write"],
      "resources": ["plugin-data/*"]
    },
    "admin": {
      "key": "sk_admin_...",
      "permissions": ["read", "write", "admin"],
      "resources": ["*"],
      "ipWhitelist": ["10.0.0.0/8"]
    }
  }
}
```

---

## Secure Development

### Input Validation

```javascript
import { z } from 'zod';

// Define schema
const pluginInputSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(100).default(10),
  filters: z.record(z.string()).optional()
});

// Validate input
function validateInput(input) {
  try {
    return pluginInputSchema.parse(input);
  } catch (error) {
    throw new SecurityError('Invalid input', { errors: error.errors });
  }
}
```

### Output Sanitization

```javascript
// Sanitize HTML output
function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/g, '');
}

// Sanitize file paths
function sanitizePath(path) {
  const normalized = path.replace(/\\/g, '/');
  const clean = normalized.replace(/\.\.\//g, '');
  return clean;
}

// Sanitize SQL input
function sanitizeSql(input) {
  return input.replace(/['";\\]/g, '');
}
```

### Error Handling

```javascript
class PluginError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }
}

class SecurityError extends PluginError {
  constructor(message, details = {}) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

// Safe error handling
async function safeExecute(fn, context) {
  try {
    return await fn();
  } catch (error) {
    // Log full error internally
    logger.error('Plugin error', {
      error: error.message,
      stack: error.stack,
      context
    });
    
    // Return sanitized error to user
    throw new PluginError(
      'An error occurred',
      'PLUGIN_ERROR',
      { code: error.code }
    );
  }
}
```

### Secure Dependencies

```javascript
// package.json - Pin dependency versions
{
  "dependencies": {
    "eventemitter3": "5.0.1",
    "zod": "3.22.4"
  },
  "overrides": {
    "dependency-with-vuln": "patched-version"
  }
}
```

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Use lockfile
npm ci  # Uses package-lock.json
```

---

## Security Auditing

### Automated Auditing

```bash
# Run security audit
openclaw plugins audit ./my-plugin

# Generate security report
openclaw plugins audit ./my-plugin --report security-report.json

# Check for vulnerabilities
openclaw plugins scan ./my-plugin

# Continuous monitoring
openclaw plugins monitor ./plugins --interval 3600
```

### Audit Checklist

| Check | Description | Tool |
|-------|-------------|------|
| **Dependency Scan** | Check for vulnerable dependencies | `npm audit`, `snyk` |
| **Code Analysis** | Static code analysis for security issues | `eslint-plugin-security` |
| **Secret Detection** | Find exposed secrets in code | `gitleaks`, `trufflehog` |
| **Permission Review** | Verify permissions are minimal | Manual review |
| **Network Analysis** | Check network connections | `wireshark`, manual |
| **File Access** | Verify file access patterns | Manual review |

### Security Report Format

```json
{
  "plugin": "my-plugin",
  "version": "1.0.0",
  "auditDate": "2026-03-31T00:00:00Z",
  "auditor": "security-team",
  "findings": [
    {
      "id": "SEC-001",
      "severity": "medium",
      "category": "dependency",
      "description": "Outdated dependency with known vulnerability",
      "recommendation": "Update dependency to latest version",
      "status": "open"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 1,
    "low": 2,
    "total": 3
  },
  "approved": false
}
```

---

## Incident Response

### Incident Types

| Type | Description | Response Time |
|------|-------------|---------------|
| **Critical** | Active exploitation, data breach | Immediate (<1 hour) |
| **High** | Vulnerability with known exploit | <24 hours |
| **Medium** | Potential vulnerability | <7 days |
| **Low** | Security best practice violation | <30 days |

### Response Procedure

```
1. Detection ──→ 2. Containment ──→ 3. Eradication
                                          │
     6. Lessons Learned ←── 5. Recovery ←─┘
```

### Incident Reporting

```javascript
async function reportIncident(incident) {
  const report = {
    id: generateIncidentId(),
    type: incident.type,
    severity: incident.severity,
    plugin: incident.plugin,
    description: incident.description,
    timestamp: Date.now(),
    reporter: incident.reporter,
    evidence: incident.evidence,
    affectedUsers: incident.affectedUsers,
    mitigationSteps: incident.mitigationSteps
  };
  
  // Notify security team
  await notifySecurityTeam(report);
  
  // Log incident
  await logIncident(report);
  
  // Create ticket
  await createTicket(report);
  
  return report.id;
}
```

### Revocation Procedure

```bash
# Revoke plugin access
openclaw plugins revoke my-plugin --reason "security violation"

# Block plugin
openclaw plugins block my-plugin --permanent

# Remove plugin
openclaw plugins uninstall my-plugin --force

# Audit affected systems
openclaw audit --since 2026-03-01 --plugin my-plugin
```

---

## Security Checklist

### Development Checklist

- [ ] Input validation implemented
- [ ] Output sanitization implemented
- [ ] Error handling does not expose sensitive data
- [ ] No hardcoded secrets
- [ ] Dependencies are pinned and audited
- [ ] Code follows security best practices
- [ ] Security tests included in test suite

### Pre-Release Checklist

- [ ] Security audit completed
- [ ] Vulnerability scan passed
- [ ] Permissions are minimal
- [ ] Documentation includes security notes
- [ ] Changelog documents security changes
- [ ] Plugin is signed

### Installation Checklist

- [ ] Plugin source is verified
- [ ] Signature is valid
- [ ] Hash matches expected value
- [ ] Permissions are reviewed and acceptable
- [ ] Security notes are understood
- [ ] Plugin is from trusted source

### Runtime Checklist

- [ ] Plugin is running in appropriate sandbox
- [ ] Resource limits are enforced
- [ ] Network access is monitored
- [ ] File access is logged
- [ ] Anomaly detection is enabled
- [ ] Incident response procedure is documented

---

## References

- [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md) - Installation guide
- [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) - Development guide
- [`PLUGIN_CLI.md`](./PLUGIN_CLI.md) - CLI reference
- [`../PLUGINS.md`](../PLUGINS.md) - Main plugins documentation

---

🦞 *The thought that never ends.*
