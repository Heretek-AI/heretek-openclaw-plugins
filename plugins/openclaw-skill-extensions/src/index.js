/**
 * OpenClaw Skill Extensions Plugin - Main Entry Point
 *
 * This plugin provides custom skill composition and versioning:
 * 1. Workflow skills
 * 2. Skill composition
 * 3. Skill versioning
 * 4. Skill discovery and registry
 *
 * @module @heretek-ai/openclaw-skill-extensions
 */

const { definePluginEntry } = require('openclaw/plugin-sdk/plugin-entry');
const SkillExtensionsPlugin = require('./original-index.js');

module.exports = definePluginEntry({
  id: 'skill-extensions',
  name: 'Skill Extensions',
  description: 'Custom skill composition and versioning plugin',
  register(api) {
    try {
      const plugin = new SkillExtensionsPlugin(api.pluginConfig || {});

      // Initialize the plugin
      if (plugin.initialize) {
        plugin.initialize().catch(err => api.logger.error('Skill extensions init error:', err));
      }

      // Register skill-extensions-status tool
      api.registerTool((ctx) => ({
        name: 'skill-extensions-status',
        description: 'Get the status of skill extensions including registry and version info',
        parameters: {
          type: 'object',
          properties: {
            skillName: { type: 'string', description: 'Optional skill name to get specific status' }
          }
        },
        execute: async (_toolCallId, params) => {
          try {
            const status = plugin.getStatus
              ? plugin.getStatus(params?.skillName)
              : {
                  initialized: plugin.initialized,
                  running: plugin.running,
                  registeredSkills: plugin.getRegisteredSkills?.() || []
                };
            return {
              content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error getting skill extensions status: ${err.message}` }]
            };
          }
        }
      }));

      // Register compose-skill tool
      api.registerTool((ctx) => ({
        name: 'compose-skill',
        description: 'Compose a new skill from existing skills or workflows',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name for the new composed skill' },
            skills: { type: 'array', description: 'Array of skill names to compose', items: { type: 'string' } },
            version: { type: 'string', description: 'Version for the new skill (default 1.0.0)', default: '1.0.0' }
          },
          required: ['name', 'skills']
        },
        execute: async (_toolCallId, params) => {
          try {
            const { name, skills, version = '1.0.0' } = params || {};
            if (!name || !skills) {
              return {
                content: [{ type: 'text', text: 'Error: name and skills are required' }]
              };
            }

            if (!plugin.composeSkill) {
              return {
                content: [{ type: 'text', text: 'Skill composition not available' }]
              };
            }

            const result = await plugin.composeSkill(name, skills, version);

            return {
              content: [{ type: 'text', text: `Skill "${name}" composed successfully: ${JSON.stringify(result)}` }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Skill composition error: ${err.message}` }]
            };
          }
        }
      }));

      api.logger.info('Skill extensions plugin loaded with tools: skill-extensions-status, compose-skill');
    } catch (err) {
      api.logger.error('Skill extensions plugin failed:', err);
      throw err;
    }
  }
});
