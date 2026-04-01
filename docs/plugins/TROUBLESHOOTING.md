# OpenClaw Plugin Troubleshooting Guide

**Version:** 1.0.0  
**Last Updated:** 2026-03-31  
**OpenClaw Gateway:** v2026.3.28+

---

## Table of Contents

1. [Overview](#overview)
2. [Diagnostic Tools](#diagnostic-tools)
3. [Common Issues](#common-issues)
4. [Installation Issues](#installation-issues)
5. [Runtime Issues](#runtime-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)
8. [Integration Issues](#integration-issues)
9. [Getting Help](#getting-help)

---

## Overview

This guide provides systematic troubleshooting procedures for common plugin issues in the Heretek OpenClaw system. Use the diagnostic flowcharts and solutions to identify and resolve problems efficiently.

### Troubleshooting Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│                    Plugin Troubleshooting Flow                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Identify Symptom                                             │
│         │                                                        │
│         ▼                                                        │
│  2. Check Plugin Status (openclaw plugins status)               │
│         │                                                        │
│         ▼                                                        │
│  3. Review Logs (openclaw logs --plugin <name>)                 │
│         │                                                        │
│         ▼                                                        │
│  4. Run Diagnostics (openclaw plugins healthcheck)              │
│         │                                                        │
│         ▼                                                        │
│  5. Apply Solution (see Common Issues below)                    │
│         │                                                        │
│         ▼                                                        │
│  6. Verify Fix (openclaw plugins verify <name>)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Diagnostic Tools

### Status Check

```bash
# Check all plugins status
openclaw plugins status

# Check specific plugin
openclaw plugins status <plugin-name>

# JSON output for scripting
openclaw plugins status --json
```

### Log Analysis

```bash
# View plugin logs
openclaw logs --plugin <plugin-name>

# Follow logs in real-time
openclaw logs --plugin <plugin-name> --follow

# Filter by error level
openclaw logs --plugin <plugin-name> --level error

# Search logs
openclaw logs --plugin <plugin-name> --grep "error"
```

### Health Check

```bash
# Run health check
openclaw plugins healthcheck

# Continuous monitoring
openclaw plugins healthcheck --watch

# Generate report
openclaw plugins healthcheck --report > health-report.json
```

### Verification

```bash
# Verify plugin integrity
openclaw plugins verify <plugin-name>

# Verify with hash
openclaw plugins verify <plugin-name> --hash

# Verify signature
openclaw plugins verify <plugin-name> --signature
```

### Debug Mode

```bash
# Enable debug logging
export OPENCLAW_DEBUG=plugins:*
openclaw start

# Debug specific plugin
export OPENCLAW_DEBUG=plugins:<plugin-name>
openclaw start
```

---

## Common Issues

### Issue: Plugin Not Loading

**Symptoms:**
- Plugin not appearing in `openclaw plugins list`
- Gateway starts without plugin
- No error messages

**Diagnostic Steps:**

```bash
# 1. Check if plugin exists
ls -la plugins/<plugin-name>/

# 2. Check plugin manifest
cat plugins/<plugin-name>/package.json
cat plugins/<plugin-name>/openclaw.plugin.json

# 3. Check discovery
openclaw plugins discover

# 4. Check logs
openclaw logs --grep "<plugin-name>"
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Missing manifest | Ensure `package.json` or `openclaw.plugin.json` exists |
| Invalid manifest | Validate JSON syntax, check required fields |
| Wrong directory | Plugin must be in `plugins/` or configured path |
| Discovery disabled | Enable discovery in `openclaw.json` |
| Plugin blocked | Check `blocklist` in configuration |

---

### Issue: Plugin Fails to Initialize

**Symptoms:**
- Error during Gateway startup
- "Failed to initialize plugin" message
- Plugin shows as "failed" in status

**Diagnostic Steps:**

```bash
# 1. Check initialization error
openclaw logs --level error --grep "initialize"

# 2. Check dependencies
cd plugins/<plugin-name>
npm ls

# 3. Check entry point
cat plugins/<plugin-name>/package.json | grep main

# 4. Test manually
cd plugins/<plugin-name>
node -e "require('./src/index.js')"
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Missing dependencies | Run `npm install` in plugin directory |
| Invalid entry point | Check `main` field in `package.json` |
| Syntax error | Run `node --check src/index.js` |
| Missing environment | Set required environment variables |
| Version mismatch | Check OpenClaw version compatibility |

---

### Issue: Plugin Crashes During Runtime

**Symptoms:**
- Plugin stops unexpectedly
- "Plugin crashed" error in logs
- Functionality unavailable

**Diagnostic Steps:**

```bash
# 1. Check crash logs
openclaw logs --grep "crash" --plugin <plugin-name>

# 2. Check memory usage
openclaw plugins status <plugin-name> --metrics

# 3. Check for uncaught exceptions
openclaw logs --grep "uncaught" --plugin <plugin-name>

# 4. Review recent changes
git log --oneline -10 -- plugins/<plugin-name>/
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Memory leak | Restart plugin, check for memory issues in code |
| Unhandled exception | Add error handling, check logs for stack trace |
| Resource exhaustion | Increase resource limits, optimize code |
| External service failure | Check external dependencies, add retry logic |
| Race condition | Review async code, add synchronization |

---

### Issue: Plugin Not Responding

**Symptoms:**
- Plugin shows as "active" but not responding
- Timeout errors
- Slow response times

**Diagnostic Steps:**

```bash
# 1. Check response times
openclaw plugins status <plugin-name> --metrics

# 2. Test plugin endpoint
curl http://localhost:18789/api/plugins/<plugin-name>/health

# 3. Check event loop lag
openclaw logs --grep "lag" --plugin <plugin-name>

# 4. Monitor resource usage
top -p $(pgrep -f "<plugin-name>")
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Blocked event loop | Review async code, avoid synchronous operations |
| Database lock | Check database connections, add timeouts |
| Network timeout | Increase timeout settings, check network |
| Deadlock | Review locking logic, add deadlock detection |
| Resource contention | Optimize resource usage, add caching |

---

## Installation Issues

### Issue: NPM Installation Fails

**Error:** `npm ERR! Cannot install plugin`

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf plugins/<plugin-name>/node_modules
rm plugins/<plugin-name>/package-lock.json

# Reinstall
cd plugins/<plugin-name>
npm install

# Check npm version
npm --version  # Should be 9.0.0+

# Update npm
npm install -g npm@latest
```

---

### Issue: Dependency Conflicts

**Error:** `npm ERR! Could not resolve dependency`

**Solutions:**

```bash
# Check for conflicts
cd plugins/<plugin-name>
npm ls

# View dependency tree
npm ls --depth=0

# Force install (use with caution)
npm install --legacy-peer-deps

# Update conflicting dependency
npm update <dependency-name>

# Pin specific version
npm install <dependency-name>@1.0.0
```

---

### Issue: Permission Denied

**Error:** `EACCES: permission denied`

**Solutions:**

```bash
# Fix ownership
sudo chown -R $(whoami) plugins/<plugin-name>/

# Fix permissions
chmod -R 755 plugins/<plugin-name>/

# For global npm issues
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# For Docker volumes
docker volume prune  # Remove unused volumes
```

---

### Issue: Plugin Not Found After Installation

**Error:** `Plugin "<name>" not found`

**Solutions:**

```bash
# Force discovery
openclaw plugins discover

# Check installation path
ls -la plugins/

# Verify manifest exists
cat plugins/<plugin-name>/openclaw.plugin.json

# Restart Gateway
openclaw restart

# Check configuration
cat openclaw.json | grep -A 10 '"plugins"'
```

---

## Runtime Issues

### Issue: Configuration Not Loading

**Symptoms:**
- Plugin uses default settings
- Configuration changes ignored

**Solutions:**

```bash
# Check configuration file
cat openclaw.json | jq '.plugins.<plugin-name>'

# Validate JSON
cat openclaw.json | jq .

# Check environment variables
env | grep -i <plugin-name>

# Reload configuration
openclaw config reload

# Restart plugin
openclaw plugins restart <plugin-name>
```

---

### Issue: Environment Variables Not Set

**Symptoms:**
- Plugin fails with "missing environment variable"
- Features disabled due to missing config

**Solutions:**

```bash
# Check current environment
env | grep PLUGIN

# Load from .env file
source plugins/<plugin-name>/.env

# Set environment variable
export PLUGIN_API_KEY=your-key-here

# Verify in Node.js
node -e "console.log(process.env.PLUGIN_API_KEY)"

# Restart Gateway after setting
openclaw restart
```

---

### Issue: Plugin Conflicts with Another Plugin

**Symptoms:**
- Both plugins work individually but not together
- Resource conflicts
- Event handler conflicts

**Solutions:**

```bash
# Disable one plugin to test
openclaw plugins disable <plugin-a>

# Check if other plugin works
openclaw plugins status <plugin-b>

# Review plugin event handlers
openclaw logs --grep "event" --plugin <plugin-a>
openclaw logs --grep "event" --plugin <plugin-b>

# Check resource usage
openclaw plugins status --metrics

# Contact plugin developers for compatibility fix
```

---

### Issue: Database Connection Failed

**Symptoms:**
- Plugin cannot connect to database
- "Connection refused" errors
- Timeout on database operations

**Solutions:**

```bash
# Check database status
openclaw status database

# Test connection
psql -h localhost -U openclaw -d openclaw

# Check connection string
cat openclaw.json | jq '.database.connectionString'

# Verify credentials
cat .env | grep DATABASE

# Restart database
sudo systemctl restart postgresql

# Check connection pool
openclaw logs --grep "pool" --level warn
```

---

### Issue: Redis Connection Failed

**Symptoms:**
- Plugin cannot connect to Redis
- Cache operations fail
- Pub/sub not working

**Solutions:**

```bash
# Check Redis status
openclaw status redis

# Test connection
redis-cli ping  # Should return PONG

# Check Redis URL
cat openclaw.json | jq '.redis.url'

# Verify Redis is running
sudo systemctl status redis

# Restart Redis
sudo systemctl restart redis

# Check Redis memory
redis-cli info memory
```

---

## Performance Issues

### Issue: High Memory Usage

**Symptoms:**
- Plugin consuming excessive memory
- Out of memory errors
- System slowdown

**Diagnostic Steps:**

```bash
# Check memory usage
openclaw plugins status <plugin-name> --metrics

# Profile memory
node --inspect plugins/<plugin-name>/src/index.js

# Check for memory leaks
openclaw logs --grep "memory" --plugin <plugin-name>
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Memory leak | Review code for unclosed connections, add cleanup |
| Large cache | Reduce cache size, add TTL |
| Data accumulation | Add pagination, limit result sets |
| Event listener leak | Remove unused listeners, use `once()` |

---

### Issue: Slow Response Times

**Symptoms:**
- Plugin responses taking too long
- Timeout errors
- Degraded user experience

**Diagnostic Steps:**

```bash
# Check response times
openclaw plugins status <plugin-name> --metrics

# Profile execution
node --prof plugins/<plugin-name>/src/index.js

# Check database queries
openclaw logs --grep "query" --plugin <plugin-name>

# Monitor network
openclaw logs --grep "request" --plugin <plugin-name>
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Slow database queries | Add indexes, optimize queries, cache results |
| Network latency | Use connection pooling, add timeouts |
| CPU-intensive operations | Offload to worker threads, add caching |
| Blocking operations | Convert to async, use streams |

---

### Issue: High CPU Usage

**Symptoms:**
- Plugin consuming excessive CPU
- System fans running high
- Other processes affected

**Diagnostic Steps:**

```bash
# Check CPU usage
top -p $(pgrep -f "<plugin-name>")

# Profile CPU
node --prof plugins/<plugin-name>/src/index.js

# Check for infinite loops
openclaw logs --grep "loop" --plugin <plugin-name>
```

**Solutions:**

| Cause | Solution |
|-------|----------|
| Infinite loop | Review iteration logic, add termination conditions |
| Complex calculations | Optimize algorithms, add caching |
| Polling too frequently | Increase polling interval, use webhooks |
| Unoptimized code | Profile and optimize hot paths |

---

## Security Issues

### Issue: Plugin Signature Verification Failed

**Error:** `Signature verification failed`

**Solutions:**

```bash
# Re-verify signature
openclaw plugins verify <plugin-name> --signature

# Check signature file
cat plugins/<plugin-name>/signature.json

# Update plugin to latest version
openclaw plugins update <plugin-name>

# Contact plugin developer for new signature
```

---

### Issue: Permission Denied

**Error:** `Permission denied: <resource>`

**Solutions:**

```bash
# Check plugin permissions
openclaw plugins config <plugin-name> permissions

# Request additional permission
openclaw plugins permission-request <plugin-name> <permission>

# Update configuration
openclaw plugins config <plugin-name> set permissions "<new-permissions>"

# Review security policy
cat docs/plugins/SECURITY_GUIDE.md
```

---

### Issue: Suspicious Plugin Behavior

**Symptoms:**
- Unexpected network connections
- Unauthorized file access
- Unusual resource usage

**Actions:**

```bash
# Immediately disable plugin
openclaw plugins disable <plugin-name>

# Audit plugin activity
openclaw plugins audit <plugin-name>

# Review logs
openclaw logs --plugin <plugin-name> --since "1 hour ago"

# Check network connections
netstat -anp | grep <plugin-name>

# Report security incident
openclaw security report <plugin-name> --severity high
```

---

## Integration Issues

### Issue: Plugin Not Compatible with OpenClaw Version

**Error:** `Plugin requires OpenClaw >=2026.3.0`

**Solutions:**

```bash
# Check OpenClaw version
openclaw --version

# Check plugin compatibility
cat plugins/<plugin-name>/package.json | jq '.engines'

# Update OpenClaw
openclaw update

# Or downgrade plugin
openclaw plugins install <plugin-name>@compatible-version
```

---

### Issue: API Incompatibility

**Symptoms:**
- Plugin methods not working
- Missing API methods
- Changed API signatures

**Solutions:**

```bash
# Check API version
openclaw api version

# Check plugin API requirements
cat plugins/<plugin-name>/package.json | jq '.peerDependencies'

# Update plugin for API compatibility
openclaw plugins update <plugin-name>

# Check changelog for breaking changes
openclaw plugins changelog <plugin-name>
```

---

### Issue: External Service Integration Failed

**Symptoms:**
- Cannot connect to external API
- Authentication failures
- Rate limiting

**Solutions:**

```bash
# Check external service status
curl -I https://api.external-service.com

# Verify credentials
openclaw plugins config <plugin-name> get credentials

# Check rate limits
openclaw logs --grep "rate limit" --plugin <plugin-name>

# Test connection
openclaw plugins test-connection <plugin-name>

# Review API documentation
cat plugins/<plugin-name>/README.md
```

---

## Getting Help

### Diagnostic Information Collection

```bash
# Collect diagnostic information
openclaw plugins diagnostic-report > diagnostic-report.json

# Include system info
openclaw system info >> diagnostic-report.json

# Include logs
openclaw logs --since "24 hours ago" >> diagnostic-report.log
```

### Support Channels

| Channel | Use Case | Response Time |
|---------|----------|---------------|
| **GitHub Issues** | Bug reports, feature requests | 1-3 days |
| **Discord** | Quick questions, community help | Minutes-hours |
| **Email Support** | Enterprise support | 24 hours |
| **Security Reports** | Security vulnerabilities | Immediate |

### Bug Report Template

```markdown
## Plugin Issue Report

**Plugin:** <plugin-name>
**Version:** <version>
**OpenClaw Version:** <version>
**Node.js Version:** <version>

### Description
Brief description of the issue.

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen.

### Actual Behavior
What actually happens.

### Logs
```
<paste relevant logs here>
```

### Environment
- OS: <operating system>
- Node.js: <version>
- npm: <version>
- OpenClaw: <version>

### Additional Information
Any other relevant information.
```

---

## References

- [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md) - Installation guide
- [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) - Development guide
- [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) - Security guidelines
- [`PLUGIN_CLI.md`](./PLUGIN_CLI.md) - CLI reference
- [`../PLUGINS.md`](../PLUGINS.md) - Main plugins documentation

---

🦞 *The thought that never ends.*
