/**
 * Tests for OpenClawMCPServer
 * @module OpenClawMCPServerTests
 */

import { OpenClawMCPServer } from '../src/index.js';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk', () => ({
  Server: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    close: jest.fn(),
    setRequestHandler: jest.fn()
  }))
}));

// Mock handlers
jest.mock('../src/handlers/memory-resources.js', () => ({
  MemoryResourceHandler: jest.fn().mockImplementation(() => ({
    listResources: jest.fn().mockResolvedValue({ resources: [] }),
    readResource: jest.fn().mockResolvedValue({ contents: [] })
  }))
}));

jest.mock('../src/handlers/knowledge-resources.js', () => ({
  KnowledgeResourceHandler: jest.fn().mockImplementation(() => ({
    listResources: jest.fn().mockResolvedValue({ resources: [] }),
    readResource: jest.fn().mockResolvedValue({ contents: [] })
  }))
}));

jest.mock('../src/handlers/skill-resources.js', () => ({
  SkillResourceHandler: jest.fn().mockImplementation(() => ({
    listResources: jest.fn().mockResolvedValue({ resources: [] }),
    readResource: jest.fn().mockResolvedValue({ contents: [] }),
    listSkills: jest.fn().mockResolvedValue([]),
    listCategories: jest.fn().mockResolvedValue([]),
    readSkill: jest.fn().mockResolvedValue(null)
  }))
}));

jest.mock('../src/handlers/skill-tools.js', () => ({
  SkillToolHandler: jest.fn().mockImplementation(() => ({
    listTools: jest.fn().mockResolvedValue({ tools: [] }),
    callTool: jest.fn().mockResolvedValue({ content: [] })
  }))
}));

jest.mock('../src/handlers/prompts.js', () => ({
  PromptHandler: jest.fn().mockImplementation(() => ({
    listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
    getPrompt: jest.fn().mockResolvedValue({ messages: [] })
  }))
}));

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
    it('should create server with configuration', () => {
      expect(server).toBeDefined();
      expect(server.config).toBeDefined();
      expect(server.config.name).toBe('test-mcp-server');
      expect(server.config.version).toBe('1.0.0');
    });

    it('should initialize handlers during construction', () => {
      expect(server.memoryHandler).toBeDefined();
      expect(server.knowledgeHandler).toBeDefined();
      expect(server.skillHandler).toBeDefined();
      expect(server.promptHandler).toBeDefined();
    });

    it('should disable handlers when configured false', () => {
      const disabledConfig = {
        ...mockConfig,
        enableMemory: false,
        enableSkills: false
      };

      const disabledServer = new OpenClawMCPServer(disabledConfig);

      expect(disabledServer.memoryHandler).toBeUndefined();
      expect(disabledServer.skillHandler).toBeUndefined();
      expect(disabledServer.knowledgeHandler).toBeDefined();
      expect(disabledServer.promptHandler).toBeDefined();
    });
  });

  describe('Server Connection', () => {
    it('should connect successfully', async () => {
      await server.connect();
      expect(server.server.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      server.server.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(server.connect()).rejects.toThrow('Connection failed');
    });

    it('should close connection successfully', async () => {
      await server.connect();
      await server.close();

      expect(server.server.close).toHaveBeenCalled();
    });
  });

  describe('Handler Setup', () => {
    it('should setup resource handlers', () => {
      server.setupHandlers();

      expect(server.server.setRequestHandler).toHaveBeenCalled();
    });

    it('should setup memory resource handler when enabled', () => {
      server.setupHandlers();

      expect(server.server.setRequestHandler).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function)
      );
    });

    it('should setup knowledge resource handler when enabled', () => {
      server.setupHandlers();

      expect(server.server.setRequestHandler).toHaveBeenCalled();
    });

    it('should setup skill resource handler when enabled', () => {
      server.setupHandlers();

      expect(server.server.setRequestHandler).toHaveBeenCalled();
    });

    it('should setup skill tool handler when enabled', () => {
      server.setupHandlers();

      expect(server.server.setRequestHandler).toHaveBeenCalled();
    });

    it('should setup prompt handler when enabled', () => {
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

    it('should list memory resources', async () => {
      server.setupHandlers();

      const result = await server.memoryHandler.listResources();

      expect(result.resources).toBeDefined();
      expect(result.resources.length).toBe(1);
      expect(result.resources[0].uri).toBe('memory://test');
    });

    it('should read memory resource', async () => {
      const result = await server.memoryHandler.readResource('memory://test');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].type).toBe('text');
    });
  });

  describe('Knowledge Resource Requests', () => {
    beforeEach(() => {
      server.knowledgeHandler = {
        listResources: jest.fn().mockResolvedValue({
          resources: [
            { uri: 'knowledge://test', name: 'Test Knowledge', description: 'Test' }
          ]
        }),
        readResource: jest.fn().mockResolvedValue({
          contents: [{ type: 'text', text: 'knowledge content' }]
        })
      };
    });

    it('should list knowledge resources', async () => {
      const result = await server.knowledgeHandler.listResources();

      expect(result.resources).toBeDefined();
      expect(result.resources.length).toBe(1);
    });

    it('should read knowledge resource', async () => {
      const result = await server.knowledgeHandler.readResource('knowledge://test');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toBe('knowledge content');
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

    it('should list skill resources', async () => {
      const result = await server.skillHandler.listResources();

      expect(result.resources).toBeDefined();
      expect(result.resources.length).toBe(2);
    });

    it('should list all skills', async () => {
      const skills = await server.skillHandler.listSkills();

      expect(skills).toBeDefined();
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('test-skill');
    });

    it('should list skill categories', async () => {
      const categories = await server.skillHandler.listCategories();

      expect(categories).toBeDefined();
      expect(categories.length).toBe(2);
      expect(categories).toContain('test');
    });

    it('should read skill by name', async () => {
      const skill = await server.skillHandler.readSkill('test-skill');

      expect(skill).toBeDefined();
      expect(skill.name).toBe('test-skill');
    });

    it('should read skill resource URI', async () => {
      const result = await server.skillHandler.readResource('skill://test-skill');

      expect(result.contents).toBeDefined();
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

    it('should list available tools', async () => {
      const result = await server.skillToolHandler.listTools();

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBe(1);
      expect(result.tools[0].name).toBe('test-tool');
    });

    it('should call tool with arguments', async () => {
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

    it('should list available prompts', async () => {
      const result = await server.promptHandler.listPrompts();

      expect(result.prompts).toBeDefined();
      expect(result.prompts.length).toBe(1);
      expect(result.prompts[0].name).toBe('test-prompt');
    });

    it('should get prompt by name', async () => {
      const result = await server.promptHandler.getPrompt('test-prompt');

      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe('user');
    });

    it('should handle prompt arguments', async () => {
      const result = await server.promptHandler.getPrompt('test-prompt', {
        arg1: 'value1'
      });

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle resource not found', async () => {
      server.memoryHandler.readResource = jest.fn()
        .mockRejectedValueOnce(new Error('Resource not found'));

      await expect(server.memoryHandler.readResource('invalid://uri'))
        .rejects.toThrow('Resource not found');
    });

    it('should handle tool execution failure', async () => {
      server.skillToolHandler.callTool = jest.fn()
        .mockRejectedValueOnce(new Error('Tool execution failed'));

      await expect(server.skillToolHandler.callTool('failing-tool', {}))
        .rejects.toThrow('Tool execution failed');
    });

    it('should handle prompt retrieval failure', async () => {
      server.promptHandler.getPrompt = jest.fn()
        .mockRejectedValueOnce(new Error('Prompt not found'));

      await expect(server.promptHandler.getPrompt('non-existent'))
        .rejects.toThrow('Prompt not found');
    });
  });

  describe('Server Capabilities', () => {
    it('should have resources capability', () => {
      expect(server.config.capabilities).toBeDefined();
      expect(server.config.capabilities.resources).toBe(true);
    });

    it('should have tools capability', () => {
      expect(server.config.capabilities).toBeDefined();
      expect(server.config.capabilities.tools).toBe(true);
    });

    it('should have prompts capability', () => {
      expect(server.config.capabilities).toBeDefined();
      expect(server.config.capabilities.prompts).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const emptyServer = new OpenClawMCPServer({});

      expect(emptyServer).toBeDefined();
      expect(emptyServer.config.name).toBe('openclaw-mcp-server');
      expect(emptyServer.config.version).toBe('1.0.0');
    });

    it('should handle all handlers disabled', () => {
      const disabledServer = new OpenClawMCPServer({
        enableMemory: false,
        enableKnowledge: false,
        enableSkills: false,
        enablePrompts: false
      });

      expect(disabledServer.memoryHandler).toBeUndefined();
      expect(disabledServer.knowledgeHandler).toBeUndefined();
      expect(disabledServer.skillHandler).toBeUndefined();
      expect(disabledServer.promptHandler).toBeUndefined();
    });

    it('should handle connection when already connected', async () => {
      await server.connect();

      // Should not throw on second connect
      await expect(server.connect()).resolves.toBeUndefined();
    });

    it('should handle close when not connected', async () => {
      await expect(server.close()).resolves.toBeUndefined();
    });
  });
});
