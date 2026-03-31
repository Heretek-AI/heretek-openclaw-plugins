/**
 * Skill Resource Handler
 * Exposes OpenClaw skills through MCP protocol
 *
 * Resources exposed:
 * - skill://list - List all available skills
 * - skill://{name} - Get specific skill definition (SKILL.md)
 * - skill://category/{category} - List skills by category
 */

import fs from 'fs/promises';
import path from 'path';

class SkillResourceHandler {
  constructor(skillsPath = './skills') {
    this.skillsPath = skillsPath;
    this.skillCache = new Map();
  }

  async listResources() {
    const skills = await this.listSkills();
    
    const resources = [
      {
        uri: 'skill://list',
        name: 'All Skills',
        description: 'List all available OpenClaw skills',
        mimeType: 'application/json',
      },
      {
        uri: 'skill://categories',
        name: 'Skill Categories',
        description: 'List all skill categories',
        mimeType: 'application/json',
      },
    ];

    // Add individual skill resources
    for (const skill of skills) {
      resources.push({
        uri: `skill://${skill.name}`,
        name: skill.name,
        description: skill.description || `Skill: ${skill.name}`,
        mimeType: 'text/markdown',
      });
    }

    // Add category resources
    const categories = await this.listCategories();
    for (const category of categories) {
      resources.push({
        uri: `skill://category/${category}`,
        name: `${category} Skills`,
        description: `List all skills in the ${category} category`,
        mimeType: 'application/json',
      });
    }

    return resources;
  }

  async readResource(uri) {
    // Parse skill:// URIs - handle both skill://list and skill://category/operations formats
    const skillUri = uri.replace('skill://', '');
    const parts = skillUri.split('/');
    
    const category = parts[0];
    const identifier = parts[1];

    switch (category) {
      case 'list':
        return await this.listSkills();
      case 'categories':
        return await this.listCategories();
      case 'category':
        return await this.listSkillsByCategory(identifier);
      default:
        // Treat as skill name
        return await this.readSkill(category);
    }
  }

  async listSkills() {
    const skills = [];
    
    try {
      const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillInfo = await this._readSkillInfo(entry.name);
          if (skillInfo) {
            skills.push(skillInfo);
          }
        }
      }
    } catch (error) {
      console.error('Error listing skills:', error);
    }

    return skills;
  }

  async listCategories() {
    const categories = new Set();
    
    try {
      const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillInfo = await this._readSkillInfo(entry.name);
          if (skillInfo && skillInfo.category) {
            categories.add(skillInfo.category);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    // Default categories based on SKILLS.md
    const defaultCategories = [
      'triad-protocols',
      'governance',
      'operations',
      'memory',
      'autonomy',
      'user-management',
      'agent-specific',
      'litellm-operations',
      'utilities',
    ];

    return Array.from(categories).length > 0 
      ? Array.from(categories)
      : defaultCategories;
  }

  async listSkillsByCategory(category) {
    const allSkills = await this.listSkills();
    
    // If category doesn't match, use default mapping
    const categoryMapping = {
      'triad-protocols': ['triad-sync-protocol', 'triad-heartbeat', 'triad-unity-monitor', 'triad-deliberation-protocol'],
      'governance': ['governance-modules', 'quorum-enforcement', 'failover-vote'],
      'operations': ['healthcheck', 'deployment-health-check', 'deployment-smoke-test', 'backup-ledger', 'fleet-backup', 'config-validator'],
      'memory': ['memory-consolidation', 'knowledge-ingest', 'knowledge-retrieval', 'workspace-consolidation'],
      'autonomy': ['thought-loop', 'self-model', 'curiosity-engine', 'opportunity-scanner', 'gap-detector', 'auto-deliberation-trigger', 'autonomous-pulse', 'detect-corruption'],
      'user-management': ['user-context-resolve', 'user-rolodex'],
      'agent-specific': ['steward-orchestrator', 'dreamer-agent', 'examiner', 'explorer', 'sentinel'],
      'litellm-operations': ['litellm-ops', 'matrix-triad'],
      'utilities': ['a2a-agent-register', 'audit-triad-files', 'autonomy-audit', 'curiosity-auto-trigger', 'day-dream', 'goal-arbitration', 'heretek-theme', 'lib', 'tabula-backup', 'triad-cron-manager', 'triad-resilience', 'triad-signal-filter'],
    };

    const categorySkills = categoryMapping[category] || [];
    
    return allSkills.filter(skill => 
      skill.category === category || categorySkills.includes(skill.name)
    );
  }

  async readSkill(skillName) {
    const skillDir = path.join(this.skillsPath, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(skillFile, 'utf-8');
      return content;
    } catch (error) {
      return this._mockSkillMarkdown(skillName);
    }
  }

  async _readSkillInfo(skillName) {
    const skillDir = path.join(this.skillsPath, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(skillFile, 'utf-8');
      
      // Parse YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const nameMatch = frontmatter.match(/name:\s*(.+)/);
        const descMatch = frontmatter.match(/description:\s*(.+)/);
        const categoryMatch = frontmatter.match(/category:\s*(.+)/);
        
        return {
          name: nameMatch ? nameMatch[1].trim() : skillName,
          description: descMatch ? descMatch[1].trim() : '',
          category: categoryMatch ? categoryMatch[1].trim() : this._inferCategory(skillName),
        };
      }
      
      return {
        name: skillName,
        description: '',
        category: this._inferCategory(skillName),
      };
    } catch (error) {
      return null;
    }
  }

  _inferCategory(skillName) {
    const categoryMapping = {
      'triad': 'triad-protocols',
      'governance': 'governance',
      'quorum': 'governance',
      'failover': 'governance',
      'healthcheck': 'operations',
      'deployment': 'operations',
      'backup': 'operations',
      'fleet': 'operations',
      'config': 'operations',
      'memory': 'memory',
      'knowledge': 'memory',
      'consolidation': 'memory',
      'workspace': 'memory',
      'thought': 'autonomy',
      'self-model': 'autonomy',
      'curiosity': 'autonomy',
      'opportunity': 'autonomy',
      'gap': 'autonomy',
      'deliberation': 'autonomy',
      'pulse': 'autonomy',
      'corruption': 'autonomy',
      'user': 'user-management',
      'rolodex': 'user-management',
      'steward': 'agent-specific',
      'dreamer': 'agent-specific',
      'examiner': 'agent-specific',
      'explorer': 'agent-specific',
      'sentinel': 'agent-specific',
      'litellm': 'litellm-operations',
      'matrix': 'litellm-operations',
    };

    for (const [key, category] of Object.entries(categoryMapping)) {
      if (skillName.toLowerCase().includes(key)) {
        return category;
      }
    }

    return 'utilities';
  }

  _mockSkillMarkdown(skillName) {
    return `---
name: ${skillName}
description: ${skillName} skill for OpenClaw
---

# ${skillName}

**Purpose:** This is a demonstration skill definition for ${skillName}

**Usage:** 
\`\`\`
/${skillName} [options]
\`\`\`

**Parameters:**
- \`--help\` - Show help information

**Returns:**
Skill execution result

**Example:**
\`\`\`
/${skillName} --param value
\`\`\`

---

*This is a mock skill definition. The actual SKILL.md content would appear here.*
`;
  }
}

export { SkillResourceHandler };
