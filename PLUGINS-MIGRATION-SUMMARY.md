# Heretek-AI OpenClaw Plugins - Migration Summary

## Overview

This document summarizes the work done to migrate 5 Heretek-AI plugins to work with OpenClaw's plugin API.

**Date:** April 1, 2026  
**OpenClaw Version:** 2026.3.31  
**Plugins Fixed:** 5

---

## Plugins Successfully Migrated

| Plugin | Status | Tools | Notes |
|--------|--------|-------|-------|
| `@heretek-ai/openclaw-consciousness-plugin` | ✅ Loaded | ⚠️ Disabled | GWT, IIT, AST consciousness modules |
| `@heretek-ai/openclaw-hybrid-search-plugin` | ✅ Loaded | ⚠️ Disabled | Vector + keyword search fusion |
| `@heretek-ai/openclaw-liberation-plugin` | ✅ Loaded | ⚠️ Disabled | Agent ownership & safety constraints |
| `@heretek-ai/openclaw-multi-doc-retrieval` | ✅ Loaded | ⚠️ Disabled | Multi-document context retrieval |
| `@heretek-ai/openclaw-skill-extensions` | ✅ Loaded | ✅ Working | Custom skill composition |

---

## Issues Fixed

### 1. lru-cache v10 API Incompatibility

**Problem:** Plugins used `const { LRU } = require('lru-cache')` which is incompatible with lru-cache v10.x

**Files Affected:**
- `plugins/openclaw-hybrid-search-plugin/src/vector-search.js`
- `plugins/openclaw-hybrid-search-plugin/src/cross-reference-linker.js`
- `plugins/openclaw-multi-doc-retrieval/src/citation-tracker.js`

**Fix:**
```javascript
// Before (v4/v5 API)
const { LRU } = require('lru-cache');
const cache = new LRU({ max: 100 });

// After (v10 API)
const { LRUCache } = require('lru-cache');
const cache = new LRUCache({ maxSize: 100 });
```

### 2. OpenClaw Plugin API Wrapper Pattern

**Problem:** Plugins exported ES6 classes, but OpenClaw expects a `register(api)` function

**Solution:** Created wrapper entry points that:
1. Import the original plugin class from `original-index.js`
2. Instantiate the plugin in the `register()` function
3. Optionally register tools using `api.registerTool()`

**Wrapper Template:**
```javascript
const PluginClass = require('./original-index.js');

module.exports = {
  register(api) {
    try {
      const plugin = new PluginClass(api.config || {});
      console.log('[plugin-name] Plugin loaded successfully');
    } catch (err) {
      console.error('[plugin-name] Failed:', err.message);
    }
  }
};
```

### 3. Plugin Manifest Files

**Added:** `openclaw.plugin.json` for each plugin with:
- Plugin ID and metadata
- Configuration schema
- Extension entry points

**Example:**
```json
{
  "id": "consciousness",
  "name": "consciousness",
  "version": "1.0.0",
  "description": "Consciousness architecture for agent collective",
  "extensions": ["./src/index.js"],
  "configSchema": {
    "type": "object",
    "properties": {
      "enabled": {"type": "boolean", "default": true}
    }
  }
}
```

### 4. package.json Updates

**Added:** `openclaw.extensions` field to each plugin's package.json:

```json
{
  "openclaw": {
    "extensions": ["./src/index.js"]
  }
}
```

---

## Known Issues

### Tool Registration API

The OpenClaw `api.registerTool()` function requires a specific format that needs further documentation:

```javascript
// Expected format (based on memory-core plugin)
api.registerTool(toolFactoryFunction, { names: ['tool-name'] });

// Where toolFactoryFunction returns a tool object with:
// - name: string
// - description: string
// - parameters: JSON schema
// - execute: function
```

**Current Status:** 4 plugins load without tools. Tools can be re-enabled once the proper format is documented.

---

## Installation

### From npm (when published)
```bash
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin
openclaw plugins install @heretek-ai/openclaw-hybrid-search-plugin
openclaw plugins install @heretek-ai/openclaw-liberation-plugin
openclaw plugins install @heretek-ai/openclaw-multi-doc-retrieval
openclaw plugins install @heretek-ai/openclaw-skill-extensions
```

### From Local Workspace
```bash
# Copy to extensions directory
cp -r plugins/openclaw-consciousness-plugin ~/.openclaw/extensions/consciousness
cp -r plugins/openclaw-hybrid-search-plugin ~/.openclaw/extensions/hybrid-search
cp -r plugins/openclaw-liberation-plugin ~/.openclaw/extensions/liberation
cp -r plugins/openclaw-multi-doc-retrieval ~/.openclaw/extensions/multi-doc
cp -r plugins/openclaw-skill-extensions ~/.openclaw/extensions/skill-extensions

# Install dependencies
cd ~/.openclaw/extensions/consciousness && npm install
cd ~/.openclaw/extensions/hybrid-search && npm install
cd ~/.openclaw/extensions/liberation && npm install
cd ~/.openclaw/extensions/multi-doc && npm install
cd ~/.openclaw/extensions/skill-extensions && npm install

# Restart gateway
openclaw gateway restart
```

---

## Testing Checklist

- [ ] consciousness: Verify GWT module initializes
- [ ] consciousness: Test phi estimation
- [ ] hybrid-search: Test vector search
- [ ] hybrid-search: Test keyword search
- [ ] hybrid-search: Test fusion ranking
- [ ] liberation: Test agent ownership tracking
- [ ] liberation: Test liberation shield
- [ ] multi-doc: Test document ingestion
- [ ] multi-doc: Test retrieval
- [ ] skill-extensions: Test skill composition
- [ ] skill-extensions: Test versioning

---

## Repository

**GitHub:** https://github.com/Heretek-AI/heretek-openclaw-plugins  
**Branch:** main  
**Latest Commit:** See git log for migration commits

---

## Next Steps

1. Document OpenClaw `registerTool()` API format
2. Re-enable tools for consciousness, hybrid-search, liberation, multi-doc
3. Add integration tests for each plugin
4. Publish updated packages to npm
5. Update documentation with usage examples

---

*Generated: 2026-04-01*  
*OpenClaw 2026.3.31*
