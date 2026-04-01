/**
 * OpenClaw Skill Extensions Plugin
 * Custom skills with composition, versioning, and discovery
 */

const SkillRegistry = require('./skill-registry');
const SkillComposer = require('./skill-composer');
const SkillVersioner = require('./skill-versioner');
const WorkflowSkills = require('./workflow-skills');

class SkillExtensionsPlugin {
  constructor(config = {}) {
    this.config = {
      enableComposition: config.enableComposition ?? true,
      enableVersioning: config.enableVersioning ?? true,
      autoDiscover: config.autoDiscover ?? true,
      discoveryPaths: config.discoveryPaths || ['./skills', './custom-skills'],
      ...config
    };

    this.registry = new SkillRegistry(config.registry);
    this.composer = new SkillComposer(config.composer);
    this.versioner = new SkillVersioner(config.versioning);
    this.workflows = new WorkflowSkills(config.workflows);

    this.initialized = false;
    this.skillLoadCount = 0;
  }

  async initialize() {
    await this.registry.initialize();
    await this.composer.initialize();
    await this.versioner.initialize();
    await this.workflows.initialize();

    // Auto-discover skills if enabled
    if (this.config.autoDiscover) {
      await this.discoverSkills();
    }

    this.initialized = true;
    console.log('[SkillExtensions] Plugin initialized');
  }

  /**
   * Register a custom skill
   * @param {string} skillId - Skill identifier
   * @param {object} definition - Skill definition
   * @returns {Promise<object>} Registration result
   */
  async registerSkill(skillId, definition) {
    if (!this.initialized) {
      await this.initialize();
    }

    const version = definition.version || '1.0.0';
    
    // Register with versioning
    await this.versioner.register(skillId, version, definition);
    
    // Add to registry
    const result = await this.registry.register(skillId, {
      ...definition,
      version
    });

    return result;
  }

  /**
   * Load and execute a skill
   * @param {string} skillId - Skill identifier
   * @param {object} params - Skill parameters
   * @returns {Promise<object>} Skill result
   */
  async executeSkill(skillId, params = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const skill = await this.registry.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    this.skillLoadCount++;

    // Execute skill handler
    if (typeof skill.handler === 'function') {
      return await skill.handler(params, {
        registry: this.registry,
        composer: this.composer,
        versioner: this.versioner
      });
    }

    // Execute workflow if defined
    if (skill.workflow) {
      return await this.workflows.execute(skill.workflow, params);
    }

    throw new Error(`Skill ${skillId} has no executable handler or workflow`);
  }

  /**
   * Create a composed skill from multiple skills
   * @param {string} composedId - New skill identifier
   * @param {Array} skills - Skills to compose
   * @param {object} options - Composition options
   * @returns {Promise<object>} Composed skill
   */
  async composeSkill(composedId, skills, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const composed = await this.composer.compose(composedId, skills, options);
    
    // Register the composed skill
    await this.registerSkill(composedId, {
      ...composed,
      type: 'composed',
      composedFrom: skills.map(s => s.skillId || s)
    });

    return composed;
  }

  /**
   * Get available versions of a skill
   * @param {string} skillId - Skill identifier
   * @returns {Promise<Array>} Available versions
   */
  async getSkillVersions(skillId) {
    return await this.versioner.getVersions(skillId);
  }

  /**
   * Load a specific version of a skill
   * @param {string} skillId - Skill identifier
   * @param {string} version - Version to load
   * @returns {Promise<object>} Skill definition
   */
  async loadSkillVersion(skillId, version) {
    return await this.versioner.load(skillId, version);
  }

  /**
   * Discover skills in configured paths
   * @returns {Promise<Array>} Discovered skills
   */
  async discoverSkills() {
    const discovered = [];

    for (const path of this.config.discoveryPaths) {
      try {
        const skills = await this.registry.discover(path);
        discovered.push(...skills);
      } catch (error) {
        console.warn(`[SkillExtensions] Discovery failed for ${path}:`, error.message);
      }
    }

    return discovered;
  }

  /**
   * List all registered skills
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} Skill list
   */
  async listSkills(filters = {}) {
    return await this.registry.list(filters);
  }

  /**
   * Get skill details
   * @param {string} skillId - Skill identifier
   * @returns {Promise<object|null>} Skill details
   */
  async getSkill(skillId) {
    return await this.registry.get(skillId);
  }

  /**
   * Execute a workflow skill
   * @param {string} workflowName - Workflow name
   * @param {object} params - Workflow parameters
   * @returns {Promise<object>} Workflow result
   */
  async executeWorkflow(workflowName, params = {}) {
    return await this.workflows.execute(workflowName, params);
  }

  /**
   * Get plugin statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const [registryStats, composerStats, versionerStats, workflowStats] = await Promise.all([
      this.registry.getStats(),
      this.composer.getStats(),
      this.versioner.getStats(),
      this.workflows.getStats()
    ]);

    return {
      registry: registryStats,
      composer: composerStats,
      versioning: versionerStats,
      workflows: workflowStats,
      totalSkillLoads: this.skillLoadCount
    };
  }

  /**
   * Unregister a skill
   * @param {string} skillId - Skill identifier
   * @returns {Promise<void>}
   */
  async unregisterSkill(skillId) {
    await Promise.all([
      this.registry.unregister(skillId),
      this.versioner.unregister(skillId)
    ]);
  }

  /**
   * Clear all skills
   * @returns {Promise<void>}
   */
  async clear() {
    await Promise.all([
      this.registry.clear(),
      this.composer.clear(),
      this.versioner.clear(),
      this.workflows.clear()
    ]);
  }
}

module.exports = SkillExtensionsPlugin;
