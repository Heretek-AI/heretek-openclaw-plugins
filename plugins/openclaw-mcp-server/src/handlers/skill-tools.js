/**
 * Skill Tool Handler
 * Exposes OpenClaw skills as executable MCP tools
 * 
 * Tools exposed:
 * - skill-execute: Execute any OpenClaw skill by name
 * - skill-list: List available skills
 * - skill-info: Get information about a specific skill
 */

const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SkillToolHandler {
  constructor(skillsPath = './skills') {
    this.skillsPath = skillsPath;
    this.skillRegistry = new Map();
    this.executionHistory = [];
  }

  async initialize() {
    await this._discoverSkills();
  }

  async _discoverSkills() {
    try {
      const entries = await fs.readdir(this.skillsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillInfo = await this._parseSkill(entry.name);
          if (skillInfo) {
            this.skillRegistry.set(entry.name, skillInfo);
          }
        }
      }
    } catch (error) {
      console.error('Error discovering skills:', error);
    }
  }

  async _parseSkill(skillName) {
    const skillDir = path.join(this.skillsPath, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(skillFile, 'utf-8');
      
      // Parse YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let frontmatter = {};
      
      if (frontmatterMatch) {
        const lines = frontmatterMatch[1].split('\n');
        for (const line of lines) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) {
            frontmatter[key] = value;
          }
        }
      }

      // Find executable files
      const executables = await this._findExecutables(skillDir);

      return {
        name: frontmatter.name || skillName,
        description: frontmatter.description || '',
        executables,
        category: this._inferCategory(skillName),
      };
    } catch (error) {
      return null;
    }
  }

  async _findExecutables(skillDir) {
    const executables = [];
    
    try {
      const entries = await fs.readdir(skillDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const isExecutable = ['.sh', '.js', '.mjs', '.ts', '.py'].includes(ext);
          if (isExecutable) {
            executables.push({
              name: entry.name,
              path: path.join(skillDir, entry.name),
              type: ext.slice(1),
            });
          }
        }
      }
    } catch (error) {
      // Ignore
    }

    return executables;
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

  async listTools() {
    // Refresh skill registry
    await this._discoverSkills();

    const tools = [
      {
        name: 'skill-execute',
        description: 'Execute an OpenClaw skill by name with provided arguments',
        inputSchema: {
          type: 'object',
          properties: {
            skillName: {
              type: 'string',
              description: 'Name of the skill to execute',
            },
            arguments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Command line arguments for the skill',
            },
            options: {
              type: 'object',
              description: 'Execution options',
              properties: {
                timeout: { type: 'number', description: 'Execution timeout in ms', default: 30000 },
                workingDir: { type: 'string', description: 'Working directory for execution' },
              },
            },
          },
          required: ['skillName'],
        },
      },
      {
        name: 'skill-list',
        description: 'List all available OpenClaw skills',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category',
            },
          },
        },
      },
      {
        name: 'skill-info',
        description: 'Get detailed information about a specific skill',
        inputSchema: {
          type: 'object',
          properties: {
            skillName: {
              type: 'string',
              description: 'Name of the skill',
            },
          },
          required: ['skillName'],
        },
      },
    ];

    // Add individual skill tools for frequently used skills
    const quickAccessSkills = [
      'healthcheck',
      'gap-detector',
      'opportunity-scanner',
      'self-model',
      'knowledge-ingest',
      'knowledge-retrieval',
      'user-rolodex',
      'steward-orchestrator',
    ];

    for (const skillName of quickAccessSkills) {
      const skillInfo = this.skillRegistry.get(skillName);
      if (skillInfo) {
        tools.push({
          name: `skill-${skillName}`,
          description: skillInfo.description || `Execute the ${skillName} skill`,
          inputSchema: {
            type: 'object',
            properties: {
              arguments: {
                type: 'array',
                items: { type: 'string' },
                description: 'Command line arguments',
              },
            },
          },
        });
      }
    }

    return tools;
  }

  async callTool(name, args) {
    switch (name) {
      case 'skill-execute':
        return await this.executeSkill(args);
      case 'skill-list':
        return await this.listSkills(args);
      case 'skill-info':
        return await this.getSkillInfo(args);
      default:
        // Check if it's a quick access skill
        if (name.startsWith('skill-')) {
          const skillName = name.slice(6); // Remove 'skill-' prefix
          return await this.executeSkill({ skillName, ...args });
        }
        return null;
    }
  }

  async executeSkill(args) {
    const { skillName, arguments: skillArgs = [], options = {} } = args;
    const { timeout = 30000, workingDir } = options;

    const skillInfo = this.skillRegistry.get(skillName);
    if (!skillInfo) {
      // Try to discover the skill if not in registry
      await this._discoverSkills();
      const refreshedInfo = this.skillRegistry.get(skillName);
      if (!refreshedInfo) {
        return {
          error: `Skill not found: ${skillName}`,
          availableSkills: Array.from(this.skillRegistry.keys()),
        };
      }
    }

    const skill = skillInfo || this.skillRegistry.get(skillName);
    const executable = skill.executables[0];
    
    if (!executable) {
      return {
        error: `No executable found for skill: ${skillName}`,
      };
    }

    const executionStart = Date.now();
    let result;

    try {
      // Determine command based on file type
      let command;
      const ext = path.extname(executable.name);
      
      if (ext === '.sh') {
        command = `bash ${executable.path} ${skillArgs.join(' ')}`;
      } else if (ext === '.js' || ext === '.mjs') {
        command = `node ${executable.path} ${skillArgs.join(' ')}`;
      } else if (ext === '.ts') {
        command = `npx ts-node ${executable.path} ${skillArgs.join(' ')}`;
      } else if (ext === '.py') {
        command = `python3 ${executable.path} ${skillArgs.join(' ')}`;
      } else {
        command = `${executable.path} ${skillArgs.join(' ')}`;
      }

      const execOptions = {
        timeout,
        cwd: workingDir || path.dirname(executable.path),
        env: { ...process.env, OPENCLAW_SKILL: skillName },
      };

      const { stdout, stderr } = await execAsync(command, execOptions);

      result = {
        success: true,
        skillName,
        executable: executable.name,
        stdout: stdout || '',
        stderr: stderr || '',
        executionTime: Date.now() - executionStart,
      };
    } catch (error) {
      result = {
        success: false,
        skillName,
        executable: executable.name,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        executionTime: Date.now() - executionStart,
      };
    }

    // Record execution history
    this.executionHistory.push({
      skillName,
      timestamp: executionStart,
      result: result.success ? 'success' : 'error',
    });

    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }

    return result;
  }

  async listSkills(args = {}) {
    const { category } = args;
    
    await this._discoverSkills();

    let skills = Array.from(this.skillRegistry.values());
    
    if (category) {
      skills = skills.filter(s => s.category === category);
    }

    return {
      skills: skills.map(s => ({
        name: s.name,
        description: s.description,
        category: s.category,
        executables: s.executables.map(e => e.name),
      })),
      total: skills.length,
      category: category || 'all',
    };
  }

  async getSkillInfo(args) {
    const { skillName } = args;
    
    await this._discoverSkills();
    const skillInfo = this.skillRegistry.get(skillName);

    if (!skillInfo) {
      return {
        error: `Skill not found: ${skillName}`,
        availableSkills: Array.from(this.skillRegistry.keys()),
      };
    }

    // Read full SKILL.md content
    const skillDir = path.join(this.skillsPath, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    
    let content = '';
    try {
      content = await fs.readFile(skillFile, 'utf-8');
    } catch (error) {
      content = 'SKILL.md not found';
    }

    return {
      ...skillInfo,
      skillDir,
      content,
      executionHistory: this.executionHistory.filter(h => h.skillName === skillName).slice(-10),
    };
  }
}

module.exports = { SkillToolHandler };
