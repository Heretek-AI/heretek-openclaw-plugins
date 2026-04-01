# {{pluginDisplayName}}

**Version:** 1.0.0  
**Type:** Skill Plugin Template  
**License:** MIT

## Overview

{{pluginDescription}}

This is a skill plugin template for the Heretek OpenClaw system. Use this template when creating plugins that primarily provide skills to agents.

## Features

- Skill-focused plugin architecture
- Multiple skill support
- Skill composition support
- Context-aware skill execution
- Skill versioning

## Installation

```bash
# Clone or copy this template
git clone https://github.com/your-org/openclaw-{{pluginName}}.git

# Navigate to plugin directory
cd openclaw-{{pluginName}}

# Install dependencies
npm install

# Link for development
openclaw plugins link .

# Or install directly
openclaw plugins install .
```

## Skills

### {{skillName}}

{{skillDescription}}

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Query to process |
| `options` | object | No | `{}` | Additional options |

**Returns:**
```javascript
{
  success: true,
  result: { ... },
  context: { ... }
}
```

**Example:**
```javascript
const result = await gateway.skills.execute('{{skillName}}', {
  query: 'what is the status?',
  options: { verbose: true }
});
```

## Configuration

### Environment Variables

```bash
# Plugin settings
PLUGIN_ENABLED=true
PLUGIN_DEBUG=false
PLUGIN_TIMEOUT=30000
```

### OpenClaw Configuration

```json
{
  "plugins": {
    "{{pluginName}}": {
      "enabled": true,
      "config": {
        "timeout": 30000,
        "debug": false,
        "skills": {
          "{{skillName}}": {
            "maxQueryLength": 1000,
            "cacheEnabled": true
          }
        }
      }
    }
  }
}
```

## Usage

### Using Skills via Gateway

```javascript
// Get available skills
const skills = gateway.skills.list();

// Execute a skill
const result = await gateway.skills.execute('{{skillName}}', {
  query: 'data',
  options: {}
}, {
  agentId: 'alpha'
});
```

### Using Skills via Agent

```javascript
// In agent code
const result = await agent.useSkill('{{skillName}}', {
  query: 'what should I do?'
});
```

## Development

### Adding New Skills

1. Create skill file in `src/skills/`:

```javascript
// src/skills/my-new-skill.js
export async function myNewSkill(params, context) {
  // Validate input
  if (!params.query) {
    throw new Error('Query is required');
  }
  
  // Process
  const result = await process(params.query);
  
  return {
    success: true,
    result,
    context
  };
}
```

2. Register skill in `src/index.js`:

```javascript
async getSkills() {
  return [
    {
      name: 'my-new-skill',
      description: 'Skill description',
      handler: myNewSkill
    }
  ];
}
```

## Project Structure

```
{{pluginName}}/
├── package.json
├── openclaw.plugin.json
├── README.md
├── SKILL.md
├── src/
│   ├── index.js          # Plugin entry point
│   └── skills/           # Skill implementations
│       ├── {{skillName}}.js
│       └── index.js      # Skills index
├── config/
│   └── default.json
├── scripts/
│   └── healthcheck.js
└── tests/
    ├── index.test.js
    └── skills/
        └── {{skillName}}.test.js
```

## License

MIT License

## References

- [OpenClaw Plugin Documentation](../../docs/plugins/README.md)
- [Development Guide](../../docs/plugins/DEVELOPMENT_GUIDE.md)
- [Skills Documentation](../../docs/SKILLS.md)

---

🦞 *The thought that never ends.*
