/**
 * Skill Registry Module
 * Manages skill registration and discovery
 */

const fs = require('fs').promises;
const path = require('path');

class SkillRegistry {
  constructor(config = {}) {
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheSize: config.cacheSize || 100,
      ...config
    };

    this.skills = new Map();
    this.tags = new Map(); // tag -> [skillIds]
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Register a skill
   * @param {string} skillId - Skill identifier
   * @param {object} definition - Skill definition
   * @returns {Promise<object>} Registration result
   */
  async register(skillId, definition) {
    const { name, description, tags, version, handler, workflow } = definition;

    const skill = {
      id: skillId,
      name: name || skillId,
      description,
      version,
      tags: tags || [],
      handler: handler || null,
      workflow: workflow || null,
      metadata: definition.metadata || {},
      registeredAt: Date.now()
    };

    this.skills.set(skillId, skill);

    // Index by tags
    for (const tag of skill.tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(skillId);
    }

    return { success: true, skillId };
  }

  /**
   * Unregister a skill
   * @param {string} skillId - Skill identifier
   * @returns {Promise<boolean>} True if unregistered
   */
  async unregister(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Remove from tag indexes
    for (const tag of skill.tags) {
      const tagSet = this.tags.get(tag);
      if (tagSet) {
        tagSet.delete(skillId);
      }
    }

    return this.skills.delete(skillId);
  }

  /**
   * Get a skill by ID
   * @param {string} skillId - Skill identifier
   * @returns {Promise<object|null>} Skill definition
   */
  async get(skillId) {
    return this.skills.get(skillId) || null;
  }

  /**
   * List skills with optional filters
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} Skill list
   */
  async list(filters = {}) {
    const { tag, search, type } = filters;
    let results = Array.from(this.skills.values());

    // Filter by tag
    if (tag) {
      const taggedSkills = this.tags.get(tag) || new Set();
      results = results.filter(s => taggedSkills.has(s.id));
    }

    // Filter by type
    if (type) {
      results = results.filter(s => {
        if (type === 'handler') return !!s.handler;
        if (type === 'workflow') return !!s.workflow;
        if (type === 'composed') return s.type === 'composed';
        return true;
      });
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    return results.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      version: s.version,
      tags: s.tags
    }));
  }

  /**
   * Discover skills in a directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} Discovered skills
   */
  async discover(dirPath) {
    const discovered = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(dirPath, entry.name);
          const skillFile = path.join(skillPath, 'SKILL.md');
          const indexFile = path.join(skillPath, 'index.js');

          // Check for SKILL.md or index.js
          try {
            await fs.access(skillFile);
            const skillDef = await this._parseSkillMarkdown(skillFile);
            if (skillDef) {
              await this.register(entry.name, skillDef);
              discovered.push({ id: entry.name, ...skillDef });
            }
          } catch {
            // No SKILL.md, try index.js
            try {
              await fs.access(indexFile);
              const skillDef = await this._loadSkillFromIndex(indexFile);
              if (skillDef) {
                await this.register(entry.name, skillDef);
                discovered.push({ id: entry.name, ...skillDef });
              }
            } catch {
              // Skip this directory
            }
          }
        }
      }
    } catch (error) {
      console.warn(`[SkillRegistry] Discovery error for ${dirPath}:`, error.message);
    }

    return discovered;
  }

  /**
   * Parse SKILL.md file
   */
  async _parseSkillMarkdown(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const yaml = match[1];
    const definition = {};

    for (const line of yaml.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim().replace(/['"]/g, '');
        if (key.trim() === 'tags') {
          definition.tags = value.split(',').map(t => t.trim());
        } else if (key.trim() === 'version') {
          definition.version = value;
        } else if (key.trim() === 'description') {
          definition.description = value;
        }
      }
    }

    return definition;
  }

  /**
   * Load skill from index.js
   */
  async _loadSkillFromIndex(filePath) {
    const module = require(filePath);
    
    if (module.default) {
      return {
        handler: module.default,
        version: module.version || '1.0.0',
        description: module.description || ''
      };
    }
    
    return null;
  }

  /**
   * Get skills by tag
   * @param {string} tag - Tag to filter by
   * @returns {Promise<Array>} Skills with tag
   */
  async getByTag(tag) {
    const skillIds = this.tags.get(tag) || new Set();
    const skills = [];

    for (const id of skillIds) {
      const skill = this.skills.get(id);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * Get registry statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const skillsByType = {
      handler: 0,
      workflow: 0,
      composed: 0
    };

    for (const skill of this.skills.values()) {
      if (skill.type === 'composed') skillsByType.composed++;
      else if (skill.workflow) skillsByType.workflow++;
      else if (skill.handler) skillsByType.handler++;
    }

    return {
      type: 'skill-registry',
      totalSkills: this.skills.size,
      totalTags: this.tags.size,
      skillsByType,
      tags: Array.from(this.tags.keys())
    };
  }

  /**
   * Clear registry
   * @returns {Promise<void>}
   */
  async clear() {
    this.skills.clear();
    this.tags.clear();
  }
}

module.exports = SkillRegistry;
