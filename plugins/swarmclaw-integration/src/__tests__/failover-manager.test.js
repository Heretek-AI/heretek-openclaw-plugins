/**
 * Tests for SwarmClaw Integration Plugin
 * Tests for FailoverManager, ProviderConfig, and HealthCheck
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FailoverManager, RequestType } from '../failover-manager.js';
import { ProviderConfig, ProviderType } from '../provider-config.js';
import { HealthCheckManager, HealthStatus } from '../healthcheck.js';

describe('ProviderConfig', () => {
  describe('fromEnv', () => {
    beforeEach(() => {
      // Clear environment variables
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_BASE_URL;
      delete process.env.OPENAI_MODELS;
    });

    it('should create OpenAI config from environment', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
      process.env.OPENAI_MODELS = 'gpt-4o,gpt-4-turbo';

      const config = ProviderConfig.fromEnv(ProviderType.OPENAI);

      expect(config.type).toBe(ProviderType.OPENAI);
      expect(config.apiKey).toBe('sk-test-key');
      expect(config.baseUrl).toBe('https://api.openai.com/v1');
      expect(config.models).toEqual(['gpt-4o', 'gpt-4-turbo']);
    });

    it('should use default values when env vars not set', () => {
      const config = ProviderConfig.fromEnv(ProviderType.OPENAI);

      expect(config.baseUrl).toBe('https://api.openai.com/v1');
      expect(config.models).toContain('gpt-4o');
    });

    it('should throw for unknown provider type', () => {
      expect(() => ProviderConfig.fromEnv('unknown')).toThrow('Unknown provider type');
    });
  });

  describe('isConfigured', () => {
    it('should return true when properly configured', () => {
      const config = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com',
        models: ['gpt-4o']
      });

      expect(config.isConfigured()).toBe(true);
    });

    it('should return false when API key missing', () => {
      const config = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: null,
        baseUrl: 'https://api.openai.com',
        models: ['gpt-4o'],
        authHeader: 'Authorization'
      });

      expect(config.isConfigured()).toBe(false);
    });

    it('should return false when disabled', () => {
      const config = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test',
        enabled: false
      });

      expect(config.isConfigured()).toBe(false);
    });
  });

  describe('validate', () => {
    it('should return valid for proper config', () => {
      const config = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com',
        models: ['gpt-4o']
      });

      const result = config.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for invalid config', () => {
      const config = new ProviderConfig({
        type: null,
        apiKey: null,
        models: []
      });

      const result = config.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getFullUrl', () => {
    it('should build full URL with base', () => {
      const config = new ProviderConfig({
        type: ProviderType.OPENAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test'
      });

      const url = config.getFullUrl('/chat/completions');
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
    });

    it('should replace model placeholder', () => {
      const config = new ProviderConfig({
        type: ProviderType.GOOGLE,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: 'test-key'
      });

      const url = config.getFullUrl('/models/{model}:generateContent', 'gemini-2.0-flash');
      expect(url).toContain('gemini-2.0-flash');
    });

    it('should add API key as query param for Google', () => {
      const config = new ProviderConfig({
        type: ProviderType.GOOGLE,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: 'test-key'
      });

      const url = config.getFullUrl('/models');
      expect(url).toContain('key=test-key');
    });
  });
});

describe('HealthCheckManager', () => {
  let healthManager;

  beforeEach(() => {
    healthManager = new HealthCheckManager({
      checkInterval: 1000,
      failureThreshold: 2,
      successThreshold: 2
    });
  });

  it('should register providers', () => {
    const provider = new ProviderConfig({
      type: ProviderType.OPENAI,
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com'
    });

    healthManager.registerProvider(provider);

    expect(healthManager.providers.has(ProviderType.OPENAI)).toBe(true);
  });

  it('should return empty array for healthy providers when none registered', () => {
    const healthy = healthManager.getHealthyProviders();
    expect(healthy).toEqual([]);
  });

  it('should get all statuses', () => {
    const provider = new ProviderConfig({
      type: ProviderType.OPENAI,
      apiKey: 'sk-test'
    });

    healthManager.registerProvider(provider);
    const statuses = healthManager.getAllStatuses();

    expect(statuses[ProviderType.OPENAI]).toBeDefined();
    expect(statuses[ProviderType.OPENAI].provider).toBe(ProviderType.OPENAI);
  });
});

describe('FailoverManager', () => {
  let failoverManager;

  beforeEach(() => {
    failoverManager = new FailoverManager({
      maxRetries: 2,
      retryDelay: 100,
      failoverOrder: [ProviderType.OPENAI, ProviderType.ANTHROPIC, ProviderType.OLLAMA]
    });
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const provider = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test'
      });

      failoverManager.registerProvider(provider);

      expect(failoverManager.providers.has(ProviderType.OPENAI)).toBe(true);
    });

    it('should throw for non-ProviderConfig', () => {
      expect(() => failoverManager.registerProvider({})).toThrow('must be a ProviderConfig instance');
    });
  });

  describe('getNextProvider', () => {
    beforeEach(() => {
      failoverManager.registerProvider(new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test'
      }));
      failoverManager.registerProvider(new ProviderConfig({
        type: ProviderType.ANTHROPIC,
        apiKey: 'sk-ant-test'
      }));

      // Manually mark as healthy for testing
      const health = failoverManager.healthManager.healthChecks.get(ProviderType.OPENAI);
      if (health) health.markHealthy();
    });

    it('should return first healthy provider in order', () => {
      const provider = failoverManager.getNextProvider([], RequestType.CHAT);
      expect(provider.type).toBe(ProviderType.OPENAI);
    });

    it('should skip excluded providers', () => {
      const provider = failoverManager.getNextProvider([ProviderType.OPENAI], RequestType.CHAT);
      expect(provider.type).toBe(ProviderType.ANTHROPIC);
    });

    it('should skip providers without embedding support for embedding requests', () => {
      // Register ANTHROPIC (no embeddings) and OLLAMA (has embeddings)
      failoverManager.registerProvider(new ProviderConfig({
        type: ProviderType.ANTHROPIC,
        apiKey: 'sk-ant-test',
        baseUrl: 'https://api.anthropic.com'
      }));
      failoverManager.registerProvider(new ProviderConfig({
        type: ProviderType.OLLAMA,
        baseUrl: 'http://localhost:11434',
        models: ['llama3.1'],
        embeddingEndpoint: '/api/embeddings'
      }));
      
      // Mark both as healthy
      const anthropicHealth = failoverManager.healthManager.healthChecks.get(ProviderType.ANTHROPIC);
      if (anthropicHealth) anthropicHealth.markHealthy();
      const ollamaHealth = failoverManager.healthManager.healthChecks.get(ProviderType.OLLAMA);
      if (ollamaHealth) ollamaHealth.markHealthy();
      
      // Anthropic doesn't support embeddings, should skip to OLLAMA
      const provider = failoverManager.getNextProvider([], RequestType.EMBEDDING);
      // Should return OLLAMA since ANTHROPIC doesn't have embeddingEndpoint
      expect(provider).not.toBe(null);
      if (provider) {
        expect(provider.type).toBe(ProviderType.OLLAMA);
      }
    });

    it('should return null when no providers available', () => {
      const provider = failoverManager.getNextProvider(
        [ProviderType.OPENAI, ProviderType.ANTHROPIC],
        RequestType.CHAT
      );
      expect(provider).toBe(null);
    });
  });

  describe('getStatus', () => {
    it('should return status object', () => {
      const status = failoverManager.getStatus();

      expect(status).toHaveProperty('providers');
      expect(status).toHaveProperty('failoverOrder');
      expect(status).toHaveProperty('healthStatuses');
      expect(status).toHaveProperty('stats');
    });
  });

  describe('executeWithFailover', () => {
    it('should throw when no providers registered', async () => {
      const requestFn = jest.fn().mockResolvedValue({ content: 'test' });

      // When no providers registered, the while loop exits immediately and throws ALL_PROVIDERS_FAILED
      await expect(failoverManager.executeWithFailover(requestFn)).rejects.toThrow('All providers failed');
    });

    it('should succeed with working provider', async () => {
      const provider = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test'
      });
      failoverManager.registerProvider(provider);

      // Manually mark as healthy
      const health = failoverManager.healthManager.healthChecks.get(ProviderType.OPENAI);
      if (health) health.markHealthy();

      const requestFn = jest.fn().mockResolvedValue({ content: 'success' });
      const result = await failoverManager.executeWithFailover(requestFn);

      expect(result.content).toBe('success');
      expect(requestFn).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      // Create a failover manager with multiple providers to test failover
      const failoverManager = new FailoverManager({
        maxRetries: 2,
        retryDelay: 10,
        failoverOrder: [ProviderType.OPENAI, ProviderType.OLLAMA]
      });
      
      const openaiProvider = new ProviderConfig({
        type: ProviderType.OPENAI,
        apiKey: 'sk-test'
      });
      const ollamaProvider = new ProviderConfig({
        type: ProviderType.OLLAMA,
        baseUrl: 'http://localhost:11434',
        models: ['llama3.1']
      });
      
      failoverManager.registerProvider(openaiProvider);
      failoverManager.registerProvider(ollamaProvider);

      // Manually mark both as healthy
      const openaiHealth = failoverManager.healthManager.healthChecks.get(ProviderType.OPENAI);
      if (openaiHealth) openaiHealth.markHealthy();
      const ollamaHealth = failoverManager.healthManager.healthChecks.get(ProviderType.OLLAMA);
      if (ollamaHealth) ollamaHealth.markHealthy();

      let callCount = 0;
      const requestFn = jest.fn().mockImplementation((provider) => {
        callCount++;
        // First call (OPENAI) fails, second call (OLLAMA) succeeds
        if (callCount === 1) {
          throw new Error('Temporary failure');
        }
        return { content: 'success after failover', provider: provider.type };
      });

      // Should failover from OPENAI to OLLAMA
      const result = await failoverManager.executeWithFailover(requestFn, { maxRetries: 2 });
      expect(result.content).toBe('success after failover');
      expect(callCount).toBe(2);
    });
  });

  describe('advanceProvider', () => {
    it('should cycle through providers', () => {
      failoverManager.failoverOrder = ['openai', 'anthropic'];

      const first = failoverManager.getCurrentProvider();
      expect(first).toBeUndefined(); // Index starts at 0, no providers registered

      failoverManager.registerProvider(new ProviderConfig({ type: 'openai', apiKey: 'test' }));
      failoverManager.registerProvider(new ProviderConfig({ type: 'anthropic', apiKey: 'test' }));

      failoverManager.currentProviderIndex = 0;
      const p1 = failoverManager.getCurrentProvider();
      expect(p1.type).toBe('openai');

      failoverManager.advanceProvider();
      const p2 = failoverManager.getCurrentProvider();
      expect(p2.type).toBe('anthropic');
    });
  });
});

describe('Integration Tests', () => {
  it('should work end-to-end with mock provider', async () => {
    const failoverManager = new FailoverManager({
      maxRetries: 1,
      retryDelay: 50
    });

    const provider = new ProviderConfig({
      type: ProviderType.OLLAMA,
      baseUrl: 'http://localhost:11434',
      models: ['llama3.1']
    });

    failoverManager.registerProvider(provider);

    // Mark as healthy for testing
    const health = failoverManager.healthManager.healthChecks.get(ProviderType.OLLAMA);
    if (health) health.markHealthy();

    // Mock the chat request
    const mockResponse = {
      content: 'Hello from mock',
      provider: ProviderType.OLLAMA
    };

    const requestFn = jest.fn().mockResolvedValue(mockResponse);
    const result = await failoverManager.executeWithFailover(requestFn, {
      requestType: RequestType.CHAT
    });

    expect(result.content).toBe('Hello from mock');
  });
});
