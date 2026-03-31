# OpenClaw Skill Extensions Plugin

Custom skill extensions with composition, versioning, and workflow capabilities.

## Features

- **Skill Registry**: Central registration and discovery of skills
- **Skill Composition**: Combine multiple skills into complex operations
- **Skill Versioning**: Semantic versioning with rollback support
- **Workflow Skills**: Pre-built workflows for common operations
- **Skill Discovery**: Auto-discovery of skills in configured paths

## Installation

```bash
npm install @heretek-ai/openclaw-skill-extensions
```

## Usage

### Register a Skill

```javascript
const SkillExtensions = require('@heretek-ai/openclaw-skill-extensions');

const skills = new SkillExtensions();
await skills.initialize();

// Register a custom skill
await skills.registerSkill('my-skill', {
  name: 'My Custom Skill',
  description: 'A custom skill for specific tasks',
  version: '1.0.0',
  tags: ['custom', 'utility'],
  handler: async (params, context) => {
    // Skill implementation
    return { result: 'success', data: params };
  }
});
```

### Execute a Skill

```javascript
const result = await skills.executeSkill('my-skill', {
  input: 'data'
});
```

### Compose Skills

```javascript
// Create a composed skill from multiple skills
await skills.composeSkill('composed-skill', [
  { skillId: 'skill-a', params: { mode: 'fast' } },
  { skillId: 'skill-b', outputMapping: true },
  { skillId: 'skill-c' }
], {
  sequence: 'sequential', // 'parallel', 'sequential', 'pipeline'
  errorStrategy: 'continue'
});
```

### Use Workflows

```javascript
// Execute a built-in workflow
const result = await skills.executeWorkflow('document-processing', {
  document: {
    id: 'doc-1',
    content: 'Document text here'
  }
});

// Register a custom workflow
await skills.workflows.register('custom-workflow', {
  description: 'Custom workflow',
  steps: [
    { name: 'step1', type: 'skill', skillId: 'first-skill' },
    { name: 'step2', type: 'transform', transform: (ctx) => ctx },
    { name: 'step3', type: 'skill', skillId: 'second-skill' }
  ]
});
```

### Version Management

```javascript
// Register multiple versions
await skills.registerSkill('versioned-skill', {
  version: '1.0.0',
  handler: v1Handler
});

await skills.registerSkill('versioned-skill', {
  version: '2.0.0',
  handler: v2Handler
});

// Get available versions
const versions = await skills.getSkillVersions('versioned-skill');

// Load specific version
const v1 = await skills.loadSkillVersion('versioned-skill', '1.0.0');

// Deprecate a version
await skills.versioner.deprecate('versioned-skill', '1.0.0');
```

### Skill Discovery

```javascript
// Auto-discover skills in directories
const discovered = await skills.discoverSkills();

// List all skills
const allSkills = await skills.listSkills();

// Filter by tag
const utilitySkills = await skills.listSkills({ tag: 'utility' });

// Search skills
const searchResults = await skills.listSkills({ search: 'document' });
```

## Workflow Step Types

| Type | Description |
|------|-------------|
| `skill` | Execute a registered skill |
| `api` | Make an API call |
| `transform` | Transform context data |
| `condition` | Conditional branching |
| `parallel` | Execute steps in parallel |

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `enableComposition` | true | Enable skill composition |
| `enableVersioning` | true | Enable skill versioning |
| `autoDiscover` | true | Auto-discover skills on init |
| `discoveryPaths` | ['./skills'] | Paths to search for skills |
| `maxConcurrent` | 10 | Max concurrent workflows |
| `defaultTimeout` | 60000 | Default workflow timeout (ms) |

## API Reference

### `registerSkill(skillId, definition)`
Register a custom skill.

### `executeSkill(skillId, params)`
Execute a registered skill.

### `composeSkill(composedId, skills, options)`
Create a composed skill.

### `getSkillVersions(skillId)`
Get all versions of a skill.

### `loadSkillVersion(skillId, version)`
Load a specific skill version.

### `discoverSkills()`
Auto-discover skills in configured paths.

### `listSkills(filters)`
List registered skills with optional filters.

### `executeWorkflow(workflowName, params)`
Execute a workflow.

### `getStats()`
Get plugin statistics.

## License

MIT
