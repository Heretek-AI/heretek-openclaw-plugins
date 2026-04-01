# OpenClaw Plugin Templates

**Version:** 1.0.0  
**Last Updated:** 2026-03-31

This directory contains templates for creating new OpenClaw plugins. Each template provides a starting point for different types of plugins.

## Available Templates

### 1. Basic Plugin Template (`basic-plugin/`)

A general-purpose plugin template suitable for most use cases.

**Best for:**
- General plugins that don't fit specific categories
- Learning plugin development
- Quick prototyping

**Features:**
- Basic plugin structure
- Event-driven architecture
- Gateway integration
- Configuration management
- Health check script
- Test setup

**Usage:**
```bash
# Copy the template
cp -r plugins/templates/basic-plugin plugins/my-new-plugin

# Update template variables
# Replace {{pluginName}}, {{pluginDisplayName}}, etc.

# Install dependencies
cd plugins/my-new-plugin
npm install

# Link for development
openclaw plugins link .
```

**Template Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `{{pluginName}}` | Plugin name (kebab-case) | `my-plugin` |
| `{{pluginDisplayName}}` | Human-readable name | `My Plugin` |
| `{{pluginDescription}}` | Plugin description | `A useful plugin` |
| `{{authorName}}` | Author name | `John Doe` |
| `{{authorEmail}}` | Author email | `john@example.com` |

---

### 2. Tool Plugin Template (`tool-plugin/`)

A plugin template focused on providing tools to agents.

**Best for:**
- Plugins that primarily expose tools
- Utility plugins
- API wrapper plugins

**Features:**
- Tool-focused architecture
- Multiple tool support
- Parameter validation
- Tool usage analytics
- Error handling

**Structure:**
```
tool-plugin/
├── src/
│   ├── index.js          # Plugin entry
│   └── tools/            # Tool implementations
│       ├── {{toolName}}.js
│       └── index.js
├── config/
├── scripts/
└── tests/
```

**Template Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `{{pluginName}}` | Plugin name | `web-search` |
| `{{pluginDisplayName}}` | Display name | `Web Search` |
| `{{pluginDescription}}` | Description | `Search the web` |
| `{{toolName}}` | Primary tool name | `search-web` |
| `{{toolDescription}}` | Tool description | `Search web for info` |
| `{{authorName}}` | Author name | `Jane Doe` |

---

### 3. Skill Plugin Template (`skill-plugin/`)

A plugin template focused on providing skills to agents.

**Best for:**
- Plugins that primarily expose skills
- Cognitive enhancement plugins
- Knowledge/skill libraries

**Features:**
- Skill-focused architecture
- Multiple skill support
- Skill composition support
- Context-aware execution
- Skill versioning

**Structure:**
```
skill-plugin/
├── src/
│   ├── index.js          # Plugin entry
│   └── skills/           # Skill implementations
│       ├── {{skillName}}.js
│       └── index.js
├── config/
├── scripts/
└── tests/
```

**Template Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `{{pluginName}}` | Plugin name | `knowledge-base` |
| `{{pluginDisplayName}}` | Display name | `Knowledge Base` |
| `{{pluginDescription}}` | Description | `Access knowledge base` |
| `{{skillName}}` | Primary skill name | `retrieve-knowledge` |
| `{{skillDescription}}` | Skill description | `Retrieve knowledge` |
| `{{authorName}}` | Author name | `Bob Smith` |

---

## Using Templates

### Manual Method

1. **Copy Template:**
   ```bash
   cp -r plugins/templates/<template-name> plugins/my-plugin
   ```

2. **Replace Variables:**
   Use a text editor or sed to replace template variables:
   ```bash
   cd plugins/my-plugin
   find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" | \
     xargs sed -i 's/{{pluginName}}/my-plugin/g'
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Link Plugin:**
   ```bash
   openclaw plugins link .
   ```

### Using CLI (Recommended)

```bash
# Create plugin from template
openclaw plugins create my-plugin --template basic
openclaw plugins create my-plugin --template tool
openclaw plugins create my-plugin --template skill

# The CLI will prompt for variable values
```

---

## Template Best Practices

### Naming Conventions

- **Plugin names:** kebab-case (e.g., `my-plugin`)
- **Display names:** Title Case (e.g., `My Plugin`)
- **Tool/Skill names:** kebab-case (e.g., `search-web`)
- **File names:** kebab-case for files, PascalCase for classes

### Code Style

- Use ES modules (`import`/`export`)
- Use async/await for async operations
- Add JSDoc comments
- Follow existing plugin patterns

### Testing

- Include unit tests for all tools/skills
- Test error conditions
- Include integration tests where applicable
- Maintain >80% code coverage

### Documentation

- Update README.md with actual values
- Document all tools/skills with examples
- Include configuration options
- Add troubleshooting section

---

## Extending Templates

### Adding Configuration

```javascript
// In src/index.js
defaultConfig = {
  ...this.defaultConfig,
  customSetting: 'default value'
};
```

### Adding Event Handlers

```javascript
setupEventListeners() {
  this.gateway.on('custom:event', this.handleCustom.bind(this));
}

async handleCustom(data) {
  // Handle event
}
```

### Adding Database Support

```javascript
async initialize(gateway, options) {
  await super.initialize(gateway, options);
  
  // Initialize database
  this.db = gateway.db;
  await this.migrate();
}
```

---

## Troubleshooting

### Template Variables Not Replaced

Ensure all `{{variable}}` placeholders are replaced with actual values before using the plugin.

### Module Not Found

Check that the `main` field in `package.json` points to the correct entry file.

### Dependencies Missing

Run `npm install` in the plugin directory.

---

## References

- [Installation Guide](../../docs/plugins/INSTALLATION_GUIDE.md)
- [Development Guide](../../docs/plugins/DEVELOPMENT_GUIDE.md)
- [Plugin CLI Reference](../../docs/plugins/PLUGIN_CLI.md)

---

🦞 *The thought that never ends.*
