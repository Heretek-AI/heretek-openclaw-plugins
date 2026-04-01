---
name: {{skillName}}
description: {{skillDescription}}
version: 1.0.0
---

# {{pluginDisplayName}}

**Package:** `@heretek-ai/openclaw-{{pluginName}}`  
**Version:** 1.0.0  
**Type:** Skill Plugin  
**License:** MIT

## Purpose

{{skillDescription}}

## Installation

```bash
npm install @heretek-ai/openclaw-{{pluginName}}
openclaw plugins install @heretek-ai/openclaw-{{pluginName}}
```

## Skills

### {{skillName}}

{{skillDescription}}

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Query to process |
| `options` | object | No | Additional options |

**Example:**
```javascript
const result = await gateway.skills.execute('{{skillName}}', {
  query: 'what is the status?'
});
```

## License

MIT
