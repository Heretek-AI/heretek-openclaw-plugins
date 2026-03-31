/**
 * Skill Versioner Module
 * Manages skill versioning and updates
 */

const semver = require('semver');

class SkillVersioner {
  constructor(config = {}) {
    this.config = {
      maxVersionsPerSkill: config.maxVersionsPerSkill || 10,
      enableAutoVersion: config.enableAutoVersion ?? true,
      versionStrategy: config.versionStrategy || 'semver', // 'semver' | 'timestamp' | 'custom'
      ...config
    };

    this.versions = new Map(); // skillId -> [version objects]
    this.activeVersions = new Map(); // skillId -> current active version
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Register a new skill version
   * @param {string} skillId - Skill identifier
   * @param {string} version - Version string
   * @param {object} definition - Skill definition
   * @returns {Promise<object>} Registration result
   */
  async register(skillId, version, definition) {
    // Validate version format
    if (this.config.versionStrategy === 'semver' && !semver.valid(version)) {
      throw new Error(`Invalid semver version: ${version}`);
    }

    // Get or create version list
    let skillVersions = this.versions.get(skillId) || [];

    // Check if version already exists
    const existingIndex = skillVersions.findIndex(v => v.version === version);
    if (existingIndex >= 0) {
      // Update existing version
      skillVersions[existingIndex] = {
        ...skillVersions[existingIndex],
        definition,
        updatedAt: Date.now()
      };
    } else {
      // Add new version
      skillVersions.push({
        version,
        definition,
        createdAt: Date.now(),
        deprecated: false
      });

      // Sort by version (descending)
      if (this.config.versionStrategy === 'semver') {
        skillVersions.sort((a, b) => semver.rcompare(a.version, b.version));
      } else {
        skillVersions.sort((a, b) => b.createdAt - a.createdAt);
      }

      // Limit versions
      if (skillVersions.length > this.config.maxVersionsPerSkill) {
        skillVersions = skillVersions.slice(0, this.config.maxVersionsPerSkill);
      }
    }

    this.versions.set(skillId, skillVersions);

    // Set as active version if first or explicitly marked
    if (!this.activeVersions.has(skillId) || definition.active) {
      this.activeVersions.set(skillId, version);
    }

    return {
      skillId,
      version,
      isLatest: skillVersions[0]?.version === version,
      totalVersions: skillVersions.length
    };
  }

  /**
   * Get all versions of a skill
   * @param {string} skillId - Skill identifier
   * @returns {Promise<Array>} Version list
   */
  async getVersions(skillId) {
    const skillVersions = this.versions.get(skillId) || [];
    return skillVersions.map(v => ({
      version: v.version,
      createdAt: v.createdAt,
      deprecated: v.deprecated,
      isLatest: v.version === skillVersions[0]?.version
    }));
  }

  /**
   * Load a specific version of a skill
   * @param {string} skillId - Skill identifier
   * @param {string} version - Version to load
   * @returns {Promise<object|null>} Skill definition
   */
  async load(skillId, version) {
    const skillVersions = this.versions.get(skillId) || [];
    const versionObj = skillVersions.find(v => v.version === version);
    
    if (!versionObj) {
      return null;
    }

    return {
      ...versionObj.definition,
      version,
      loadedAt: Date.now()
    };
  }

  /**
   * Get the latest version of a skill
   * @param {string} skillId - Skill identifier
   * @returns {Promise<object|null>} Latest skill definition
   */
  async getLatest(skillId) {
    const skillVersions = this.versions.get(skillId) || [];
    if (skillVersions.length === 0) return null;

    const latest = skillVersions[0];
    return {
      ...latest.definition,
      version: latest.version
    };
  }

  /**
   * Get the active version of a skill
   * @param {string} skillId - Skill identifier
   * @returns {Promise<object|null>} Active skill definition
   */
  async getActive(skillId) {
    const activeVersion = this.activeVersions.get(skillId);
    if (!activeVersion) return null;

    return await this.load(skillId, activeVersion);
  }

  /**
   * Set the active version of a skill
   * @param {string} skillId - Skill identifier
   * @param {string} version - Version to activate
   * @returns {Promise<boolean>} Success status
   */
  async setActive(skillId, version) {
    const skillVersions = this.versions.get(skillId) || [];
    const versionExists = skillVersions.some(v => v.version === version);

    if (!versionExists) {
      return false;
    }

    this.activeVersions.set(skillId, version);
    return true;
  }

  /**
   * Deprecate a skill version
   * @param {string} skillId - Skill identifier
   * @param {string} version - Version to deprecate
   * @returns {Promise<boolean>} Success status
   */
  async deprecate(skillId, version) {
    const skillVersions = this.versions.get(skillId) || [];
    const versionObj = skillVersions.find(v => v.version === version);

    if (!versionObj) {
      return false;
    }

    versionObj.deprecated = true;
    versionObj.deprecatedAt = Date.now();

    // If active version is deprecated, switch to latest non-deprecated
    if (this.activeVersions.get(skillId) === version) {
      const nextActive = skillVersions.find(v => !v.deprecated);
      if (nextActive) {
        this.activeVersions.set(skillId, nextActive.version);
      }
    }

    return true;
  }

  /**
   * Generate next version based on strategy
   * @param {string} skillId - Skill identifier
   * @param {string} bumpType - Version bump type (major, minor, patch)
   * @returns {Promise<string>} Next version
   */
  async nextVersion(skillId, bumpType = 'patch') {
    const skillVersions = this.versions.get(skillId) || [];
    
    if (skillVersions.length === 0) {
      return '1.0.0';
    }

    const latest = skillVersions[0].version;

    if (this.config.versionStrategy === 'semver') {
      return semver.inc(latest, bumpType);
    } else if (this.config.versionStrategy === 'timestamp') {
      return Date.now().toString();
    }

    return latest;
  }

  /**
   * Unregister a skill (all versions)
   * @param {string} skillId - Skill identifier
   * @returns {Promise<boolean>} Success status
   */
  async unregister(skillId) {
    this.versions.delete(skillId);
    this.activeVersions.delete(skillId);
    return true;
  }

  /**
   * Get versioner statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    let totalVersions = 0;
    let deprecatedVersions = 0;

    for (const versions of this.versions.values()) {
      totalVersions += versions.length;
      deprecatedVersions += versions.filter(v => v.deprecated).length;
    }

    return {
      type: 'skill-versioner',
      totalSkills: this.versions.size,
      totalVersions,
      deprecatedVersions,
      activeSkills: this.activeVersions.size,
      maxVersionsPerSkill: this.config.maxVersionsPerSkill,
      versionStrategy: this.config.versionStrategy
    };
  }

  /**
   * Clear versioner
   * @returns {Promise<void>}
   */
  async clear() {
    this.versions.clear();
    this.activeVersions.clear();
  }
}

module.exports = SkillVersioner;
