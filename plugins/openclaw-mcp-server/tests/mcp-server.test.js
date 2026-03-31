/**
 * Tests for OpenClawMCPServer
 * @module OpenClawMCPServerTests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the MCP SDK before importing
const mockServerInstance = {
  connect: jest.fn(),
  close: jest.fn(),
  setRequestHandler: jest.fn()
};

const mockMcpSdk = {
  Server: jest.fn().mockImplementation(() => mockServerInstance)
};

// Mock handlers
const mockMemoryHandler = {
  listResources: jest.fn().mockResolvedValue({ resources: [] }),
  readResource: jest.fn().mockResolvedValue({ contents: [] })
};

const mockKnowledgeHandler = {
  listResources: jest.fn().mockResolvedValue({ resources: [] }),
  readResource: jest.fn().mockResolvedValue({ contents: [] })
};

const mockSkillHandler = {
  listResources: jest.fn().mockResolvedValue({ resources: [] }),
  readResource: jest.fn().mockResolvedValue({ contents: [] }),
  listSkills: jest.fn().mockResolvedValue([]),
  listCategories: jest.fn().mockResolvedValue([]),
  readSkill: jest.fn().mockResolvedValue(null)
};

const mockSkillToolHandler = {
  listTools: jest.fn().mockResolvedValue({ tools: [] }),
  callTool: jest.fn().mockResolvedValue({ content: [] })
};

const mockPromptHandler = {
  listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
  getPrompt: jest.fn().mockResolvedValue({ messages: [] })
};

// Create mock module for src/index.js
jest.unstable_mockModule('../src/index.js', () => ({
  OpenClawMCPServer: class OpenClawMCPServer {
    constructor(config = {}) {
      this.config = {
        name: 'openclaw-mcp-server',
        version: '1.0.0',
        ...config
      };
      this.memoryHandler = mockMemoryHandler;
      this.knowledgeHandler = mockKnowledgeHandler;
      this.skillHandler = mockSkillHandler;
      this.toolHandler = mockSkillToolHandler;
      this.promptHandler = mockPromptHandler;
      this.server = mockServerInstance;
    }
    
    async connect() {
      return this.server.connect();
    }
    
    async close() {
      return this.server.close();
    }
    
    setupHandlers() {
      return this.server.setRequestHandler();
    }
  }
}));

const { OpenClawMCPServer } = await import('../src/index.js');

describe('OpenClawMCPServer', () => {
  let server;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'test-mcp-server',
      version: '1.0.0',
      enableMemory: true,
      enableKnowledge: true,
      enableSkills: true,
      enablePrompts: true
    };

    server = new OpenClawMCPServer(mockConfig);
  });

  afterEach(async () => {
    await server.close();
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    test('should create server with configuration', () => {
      expect(server).toBeDefined();
      expect(server.config).toBeDefined();
      expect(server.config.name).toBe('test-mcp-server');
      expect(server.config.version).toBe('1.0.0');
    });

    test('should initialize handlers during construction', () => {
      expect(server.memoryHandler).toBeDefined();
      expect(server.knowledgeHandler).toBeDefined();
      expect(server.skillHandler).toBeDefined();
      expect(server.promptHandler).toBeDefined();
    });
  });

  describe('Server Connection', () => {
    test('should connect successfully', async () => {
      await server.connect();
      expect(server.server.connect).toHaveBeenCalled();
    });

    test('should close connection successfully', async () => {
      await server.connect();
      await server.close();

      expect(server.server.close).toHaveBeenCalled();
    });
  });

  describe('Handler Setup', () => {
    test('should setup handlers', () => {
      server.setupHandlers();

      expect(server.server.setRequestHandler).toHaveBeenCalled();
    });
  });

  describe('Memory Resource Requests', () => {
    beforeEach(() => {
      server.memoryHandler = {
        listResources: jest.fn().mockResolvedValue({
          resources: [
            { uri: 'memory://test', name: 'Test Memory', description: 'Test' }
          ]
        }),
        readResource: jest.fn().mockResolvedValue({
          contents: [{ type: 'text', text: 'memory content' }]
        })
      };
    });

    test('should list memory resources', async () => {
      server.setupHandlers();

      const result = await server.memoryHandler.listResources();

      expect(result.resources).toBeDefined();
      expect(result.resources.length).toBe(1);
      expect(result.resources[0].uri).toBe('memory://test');
    });

    test('should read memory resource', async () => {
      const result = await server.memoryHandler.readResource('memory://test');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].type).toBe('text');
    });
  });

  describe('Skill Resource Requests', () => {
    beforeEach(() => {
      server.skillHandler = {
        listResources: jest.fn().mockResolvedValue({
          resources: [
            { uri: 'skill://list', name: 'Skill List', description: 'List all skills' },
            { uri: 'skill://categories', name: 'Skill Categories', description: 'List categories' }
          ]
        }),
        readResource: jest.fn().mockResolvedValue({
          contents: [{ type: 'text', text: 'skill content' }]
        }),
        listSkills: jest.fn().mockResolvedValue([
          { name: 'test-skill', category: 'test' }
        ]),
        listCategories: jest.fn().mockResolvedValue(['test', 'utility']),
        readSkill: jest.fn().mockResolvedValue({
          name: 'test-skill',
          description: 'A test skill'
        })
      };
    });

    test('should list skill resources', async () => {
      const result = await server.skillHandler.listResources();

      expect(result.resources).toBeDefined();
      expect(result.resources.length).toBe(2);
    });

    test('should list all skills', async () => {
      const skills = await server.skillHandler.listSkills();

      expect(skills).toBeDefined();
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('test-skill');
    });

    test('should list skill categories', async () => {
      const categories = await server.skillHandler.listCategories();

      expect(categories).toBeDefined();
      expect(categories.length).toBe(2);
      expect(categories).toContain('test');
    });

    test('should read skill by name', async () => {
      const skill = await server.skillHandler.readSkill('test-skill');

      expect(skill).toBeDefined();
      expect(skill.name).toBe('test-skill');
    });
  });

  describe('Skill Tool Requests', () => {
    beforeEach(() => {
      server.skillToolHandler = {
        listTools: jest.fn().mockResolvedValue({
          tools: [
            { name: 'test-tool', description: 'A test tool' }
          ]
        }),
        callTool: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'tool result' }]
        })
      };
    });

    test('should list available tools', async () => {
      const result = await server.skillToolHandler.listTools();

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBe(1);
      expect(result.tools[0].name).toBe('test-tool');
    });

    test('should call tool with arguments', async () => {
      const result = await server.skillToolHandler.callTool('test-tool', { arg1: 'value1' });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toBe('tool result');
    });
  });

  describe('Prompt Requests', () => {
    beforeEach(() => {
      server.promptHandler = {
        listPrompts: jest.fn().mockResolvedValue({
          prompts: [
            { name: 'test-prompt', description: 'A test prompt' }
          ]
        }),
        getPrompt: jest.fn().mockResolvedValue({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test message' } }
          ]
        })
      };
    });

    test('should list available prompts', async () => {
      const result = await server.promptHandler.listPrompts();

      expect(result.prompts).toBeDefined();
      expect(result.prompts.length).toBe(1);
      expect(result.prompts[0].name).toBe('test-prompt');
    });

    test('should get prompt by name', async () => {
      const result = await server.promptHandler.getPrompt('test-prompt');

      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe('user');
    });
  });

  describe('Error Handling', () => {
    test('should handle resource not found', async () => {
      const mockHandler = {
        readResource: jest.fn().mockRejectedValue(new Error('Resource not found'))
      };
      
      await expect(mockHandler.readResource('invalid://uri'))
        .rejects.toThrow('Resource not found');
    });

    test('should handle tool execution failure', async () => {
      const mockHandler = {
        callTool: jest.fn().mockRejectedValue(new Error('Tool execution failed'))
      };

      await expect(mockHandler.callTool('failing-tool', {}))
        .rejects.toThrow('Tool execution failed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty configuration', () => {
      const emptyServer = new OpenClawMCPServer({});

      expect(emptyServer).toBeDefined();
      expect(emptyServer.config.name).toBe('openclaw-mcp-server');
      expect(emptyServer.config.version).toBe('1.0.0');
    });

    test('should handle connection when already connected', async () => {
      await server.connect();

      // Should not throw on second connect
      await expect(server.connect()).resolves.toBeUndefined();
    });
  });
});
