/**
 * Unit tests for {{pluginDisplayName}}
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { {{pluginDisplayName}}Plugin, createPlugin } from '../src/index.js';

describe('{{pluginDisplayName}}Plugin', () => {
  let plugin;
  let mockGateway;

  beforeEach(async () => {
    mockGateway = {
      on: jest.fn(),
      tools: { register: jest.fn() },
      skills: { register: jest.fn() },
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }
    };

    plugin = new {{pluginDisplayName}}Plugin();
    await plugin.initialize(mockGateway, { enabled: true });
  });

  afterEach(async () => {
    await plugin.shutdown();
  });

  describe('initialize', () => {
    it('should initialize with gateway', async () => {
      expect(plugin.gateway).toBe(mockGateway);
      expect(plugin.config.enabled).toBe(true);
    });

    it('should emit initialized event', (done) => {
      plugin.on('initialized', (data) => {
        expect(data.name).toBe('{{pluginName}}');
        expect(data.version).toBe('1.0.0');
        done();
      });
    });

    it('should register tools', async () => {
      expect(mockGateway.tools.register).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start the plugin', async () => {
      const startedPromise = new Promise((resolve) => {
        plugin.on('started', resolve);
      });
      
      await plugin.start();
      const data = await startedPromise;
      
      expect(data.name).toBe('{{pluginName}}');
    });

    it('should not start if disabled', async () => {
      plugin.config.enabled = false;
      const disabledPromise = new Promise((resolve) => {
        plugin.on('disabled', resolve);
      });
      
      await plugin.start();
      const data = await disabledPromise;
      
      expect(data.reason).toBe('Plugin disabled in configuration');
    });
  });

  describe('getTools', () => {
    it('should return tools array', async () => {
      const tools = await plugin.getTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should have valid tool structure', async () => {
      const tools = await plugin.getTools();
      const tool = tools[0];
      
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('handler');
      expect(tool).toHaveProperty('parameters');
    });
  });

  describe('executeTool', () => {
    it('should execute tool successfully', async () => {
      const result = await plugin.executeTool(
        { message: 'test' },
        { agentId: 'test-agent' }
      );
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: 'test' });
    });
  });

  describe('getStatus', () => {
    it('should return status object', () => {
      const status = plugin.getStatus();
      
      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('running');
    });

    it('should return correct plugin name', () => {
      const status = plugin.getStatus();
      expect(status.name).toBe('{{pluginName}}');
    });
  });

  describe('handleMessage', () => {
    it('should handle messages', async () => {
      const message = { type: 'test', content: 'hello' };
      
      // Should not throw
      await expect(plugin.handleMessage(message)).resolves.not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      const shutdownPromise = new Promise((resolve) => {
        plugin.on('shutdown', resolve);
      });
      
      await plugin.shutdown();
      await expect(shutdownPromise).resolves.toBeDefined();
    });
  });
});
