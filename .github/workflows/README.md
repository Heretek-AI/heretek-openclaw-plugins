# ClawHub GitHub Actions Workflows

This directory contains GitHub Actions workflows for publishing skills and plugins to ClawHub.

## Setup

### Required Secrets

Add the following secret to your repository settings:

- `CLAWHUB_TOKEN` - Your ClawHub API token (starts with `clh_...`)

To get your token:

```bash
clawhub login
# Token is stored in ~/.clawhub/config.json
```

Or generate a new token:

```bash
clawhub login --token clh_your_token_here
```

## Workflows

### 1. ClawHub CI (`clawhub-ci.yml`)

**Purpose:** Validates skills and plugins on every push/PR

**Triggers:**
- Push to `main` (skills/plugins paths)
- Pull requests (skills/plugins paths)
- Manual workflow dispatch

**Jobs:**
- `validate-skills` - Checks SKILL.md frontmatter and format
- `validate-plugins` - Validates package.json and openclaw.plugin.json
- `security-scan` - Scans for hardcoded secrets
- `report` - Generates validation summary

### 2. Skill Publish (`skill-publish.yml`)

**Purpose:** Publishes skills to ClawHub registry

**Triggers:**
- Tag push: `skills/{skill-path}/v{version}` (e.g., `skills/todoist/v1.2.3`)
- Manual workflow dispatch

**Tag Format:**
```
skills/{skill-path}/v{semver}
```

Examples:
- `skills/matrix-triad/v1.0.0`
- `skills/github-tools/v2.1.3`

**Manual Dispatch Inputs:**
- `skill_path` - Path to skill directory (required)
- `version` - Semver version (required)
- `dry_run` - Preview without uploading (optional)

**Example Usage:**
```bash
# Tag-based publish
git tag skills/matrix-triad/v1.0.0
git push origin skills/matrix-triad/v1.0.0

# Or use workflow dispatch from GitHub UI
```

### 3. Package Publish (`package-publish.yml`)

**Purpose:** Publishes OpenClaw plugins to ClawHub registry

**Triggers:**
- Pull requests (dry-run only)
- Tag push: `plugins/{plugin-path}/v{version}`
- Manual workflow dispatch

**Tag Format:**
```
plugins/{plugin-path}/v{semver}
```

Examples:
- `plugins/openclaw-consciousness-plugin/v1.0.0`
- `plugins/openclaw-hybrid-search-plugin/v1.1.0`

**Manual Dispatch Inputs:**
- `plugin_path` - Path to plugin directory (required)
- `dry_run` - Preview without uploading (optional)
- `owner` - Publisher handle for admin publishing (optional)

**PR Dry-Run:**
When a PR is opened, the workflow automatically runs in dry-run mode to validate the plugin before merging.

**Example Usage:**
```bash
# Tag-based publish
git tag plugins/openclaw-consciousness-plugin/v1.0.0
git push origin plugins/openclaw-consciousness-plugin/v1.0.0

# Or use workflow dispatch from GitHub UI
```

## Publishing Checklist

### For Skills

1. Ensure `SKILL.md` has valid YAML frontmatter:
   ```yaml
   ---
   name: my-skill
   description: What this skill does
   version: 1.0.0
   metadata:
     openclaw:
       requires:
         env:
           - API_KEY
       bins:
           - curl
   ---
   ```

2. Test locally:
   ```bash
   clawhub skill publish skills/my-skill --version 1.0.0 --dry-run
   ```

3. Create tag and push:
   ```bash
   git tag skills/my-skill/v1.0.0
   git push origin skills/my-skill/v1.0.0
   ```

### For Plugins

1. Ensure `package.json` has `openclaw.extensions`:
   ```json
   {
     "name": "@heretek-ai/my-plugin",
     "openclaw": {
       "extensions": ["./src/index.js"]
     }
   }
   ```

2. Ensure `openclaw.plugin.json` exists with valid schema:
   ```json
   {
     "id": "my-plugin",
     "name": "My Plugin",
     "configSchema": {
       "type": "object",
       "additionalProperties": false
     }
   }
   ```

3. Test locally:
   ```bash
   clawhub package publish plugins/my-plugin --dry-run
   ```

4. Create tag and push:
   ```bash
   git tag plugins/my-plugin/v1.0.0
   git push origin plugins/my-plugin/v1.0.0
   ```

## Troubleshooting

### Common Issues

**"Missing CLAWHUB_TOKEN"**
- Ensure the secret is set in repository settings
- Token must start with `clh_`

**"Invalid skill format"**
- Check SKILL.md frontmatter has required fields
- Ensure folder name matches skill name

**"Plugin validation failed"**
- Verify openclaw.plugin.json has valid JSON
- Check for required `id` and `configSchema` fields

**"Rate limit exceeded"**
- Wait and retry (rate limits: 180/min read, 45/min write)
- Use `--dry-run` for testing

### Manual Publishing

If workflows fail, you can publish manually:

```bash
# Install CLI
bun install -g clawhub

# Login
clawhub login

# Publish skill
clawhub skill publish skills/my-skill --version 1.0.0 --yes

# Publish plugin
clawhub package publish plugins/my-plugin --yes
```

## Reusable Workflow

The `package-publish.yml` workflow can be reused from other repositories:

```yaml
jobs:
  publish:
    uses: heretek/heretek-openclaw-plugins/.github/workflows/package-publish.yml@main
    with:
      plugin_path: plugins/my-plugin
      dry_run: false
    secrets:
      CLAWHUB_TOKEN: ${{ secrets.CLAWHUB_TOKEN }}
```

## Links

- [ClawHub CLI Documentation](https://github.com/openclaw/clawhub/blob/main/docs/cli.md)
- [Skill Format Reference](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md)
- [HTTP API Reference](https://github.com/openclaw/clawhub/blob/main/docs/http-api.md)
