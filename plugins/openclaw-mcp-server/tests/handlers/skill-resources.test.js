/**
 * Tests for SkillResourceHandler
 * @module SkillResourceHandlerTests
 */

import { SkillResourceHandler } from '../src/handlers/skill-resources.js';

describe('SkillResourceHandler', () => {
  let handler;
  let mockSkillRegistry;

  beforeEach(() => {
    mockSkillRegistry = {
      getSkills: jest.fn().mockResolvedValue([]),
      getSkill: jest.fn().mockResolvedValue(null),
      getCategories: jest.fn().mockResolvedValue([])
    };

    handler = new SkillResourceHandler({
      skillRegistry: mockSkillRegistry
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('List Resources', () => {
    it('should list basic skill resources', async () => {
      const resources = await handler.listResources();

      expect(resources.resources).toBeDefined();
      expect(resources.resources.length).toBeGreaterThan(0);
      expect(resources.resources[0].uri).toBe('skill://list');
    });

    it('should include skill list resource', async () => {
      const resources = await handler.listResources();

      const listResource = resources.resources.find(r => r.uri === 'skill://list');
      expect(listResource).toBeDefined();
      expect(listResource.name).toBe('Skill List');
    });

    it('should include categories resource', async () => {
      const resources = await handler.listResources();

      const categoriesResource = resources.resources.find(r => r.uri === 'skill://categories');
      expect(categoriesResource).toBeDefined();
      expect(categoriesResource.name).toBe('Skill Categories');
    });

    it('should include dynamic skill resources when skills exist', async () => {
      mockSkillRegistry.getSkills.mockResolvedValue([
        { name: 'test-skill', description: 'A test skill' }
      ]);

      const resources = await handler.listResources();

      const skillResource = resources.resources.find(r => r.uri === 'skill://test-skill');
      expect(skillResource).toBeDefined();
    });

    it('should include category resources when categories exist', async () => {
      mockSkillRegistry.getCategories.mockResolvedValue(['testing', 'utility']);

      const resources = await handler.listResources();

      const categoryResource = resources.resources.find(r => r.uri === 'skill://category/testing');
      expect(categoryResource).toBeDefined();
    });
  });

  describe('Read Resource', () => {
    it('should read skill list resource', async () => {
      mockSkillRegistry.getSkills.mockResolvedValue([
        { name: 'skill-1', description: 'First skill' },
        { name: 'skill-2', description: 'Second skill' }
      ]);

      const result = await handler.readResource('skill://list');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toContain('skill-1');
      expect(result.contents[0].text).toContain('skill-2');
    });

    it('should read categories resource', async () => {
      mockSkillRegistry.getCategories.mockResolvedValue(['category-1', 'category-2']);

      const result = await handler.readResource('skill://categories');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toContain('category-1');
    });

    it('should read individual skill resource', async () => {
      mockSkillRegistry.getSkill.mockResolvedValue({
        name: 'test-skill',
        description: 'Test skill description',
        category: 'testing'
      });

      const result = await handler.readResource('skill://test-skill');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toContain('test-skill');
    });

    it('should read category skills resource', async () => {
      mockSkillRegistry.getSkills.mockResolvedValue([
        { name: 'cat-skill-1', category: 'testing' },
        { name: 'cat-skill-2', category: 'testing' }
      ]);

      const result = await handler.readResource('skill://category/testing');

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toContain('cat-skill-1');
    });

    it('should handle unknown resource URI', async () => {
      await expect(handler.readResource('skill://unknown'))
        .rejects.toThrow();
    });
  });

  describe('List Skills', () => {
    it('should return all skills from registry', async () => {
      const expectedSkills = [
        { name: 'skill-1', category: 'cat-1' },
        { name: 'skill-2', category: 'cat-2' }
      ];

      mockSkillRegistry.getSkills.mockResolvedValue(expectedSkills);

      const skills = await handler.listSkills();

      expect(skills).toEqual(expectedSkills);
    });

    it('should return empty array when no skills', async () => {
      mockSkillRegistry.getSkills.mockResolvedValue([]);

      const skills = await handler.listSkills();

      expect(skills).toEqual([]);
    });

    it('should handle registry errors', async () => {
      mockSkillRegistry.getSkills.mockRejectedValue(new Error('Registry error'));

      await expect(handler.listSkills()).rejects.toThrow('Registry error');
    });
  });

  describe('List Categories', () => {
    it('should return all categories from registry', async () => {
      const expectedCategories = ['category-1', 'category-2', 'category-3'];

      mockSkillRegistry.getCategories.mockResolvedValue(expectedCategories);

      const categories = await handler.listCategories();

      expect(categories).toEqual(expectedCategories);
    });

    it('should return default categories when registry empty', async () => {
      mockSkillRegistry.getCategories.mockResolvedValue([]);

      const categories = await handler.listCategories();

      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include default categories', async () => {
      mockSkillRegistry.getCategories.mockResolvedValue([]);

      const categories = await handler.listCategories();

      // Should have some default categories
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('List Skills by Category', () => {
    it('should filter skills by category', async () => {
      const allSkills = [
        { name: 'skill-1', category: 'testing' },
        { name: 'skill-2', category: 'utility' },
        { name: 'skill-3', category: 'testing' }
      ];

      mockSkillRegistry.getSkills.mockResolvedValue(allSkills);

      const testingSkills = await handler.listSkillsByCategory('testing');

      expect(testingSkills.length).toBe(2);
      expect(testingSkills.every(s => s.category === 'testing')).toBe(true);
    });

    it('should return empty array for unknown category', async () => {
      mockSkillRegistry.getSkills.mockResolvedValue([]);

      const skills = await handler.listSkillsByCategory('unknown');

      expect(skills).toEqual([]);
    });

    it('should handle category mapping', async () => {
      const allSkills = [
        { name: 'backup-ledger', category: 'operations' }
      ];

      mockSkillRegistry.getSkills.mockResolvedValue(allSkills);

      const skills = await handler.listSkillsByCategory('operations');

      expect(skills).toBeDefined();
    });
  });

  describe('Read Skill', () => {
    it('should return skill details by name', async () => {
      const expectedSkill = {
        name: 'test-skill',
        description: 'Test description',
        category: 'testing',
        version: '1.0.0'
      };

      mockSkillRegistry.getSkill.mockResolvedValue(expectedSkill);

      const skill = await handler.readSkill('test-skill');

      expect(skill).toEqual(expectedSkill);
    });

    it('should return null for non-existent skill', async () => {
      mockSkillRegistry.getSkill.mockResolvedValue(null);

      const skill = await handler.readSkill('non-existent');

      expect(skill).toBeNull();
    });

    it('should handle skill registry errors', async () => {
      mockSkillRegistry.getSkill.mockRejectedValue(new Error('Skill not found'));

      await expect(handler.readSkill('test-skill'))
        .rejects.toThrow('Skill not found');
    });
  });

  describe('Read Skill Info', () => {
    it('should read skill info from registry', async () => {
      mockSkillRegistry.getSkill.mockResolvedValue({
        name: 'test-skill',
        description: 'Test',
        category: 'testing'
      });

      const result = await handler._readSkillInfo('test-skill');

      expect(result.name).toBe('test-skill');
      expect(result.description).toBe('Test');
    });

    it('should use mock skill when registry returns null', async () => {
      mockSkillRegistry.getSkill.mockResolvedValue(null);

      const result = await handler._readSkillInfo('mock-skill');

      expect(result).toBeDefined();
      expect(result.name).toBe('mock-skill');
    });
  });

  describe('Category Inference', () => {
    it('should infer category from skill name', () => {
      const category = handler._inferCategory('backup-ledger');
      expect(category).toBeDefined();
    });

    it('should return default category for unknown names', () => {
      const category = handler._inferCategory('unknown-skill-name');
      expect(category).toBeDefined();
    });

    it('should map skill names to appropriate categories', () => {
      const backupCategory = handler._inferCategory('backup-ledger');
      const healthCategory = handler._inferCategory('health-check');

      expect(backupCategory).toBeDefined();
      expect(healthCategory).toBeDefined();
    });
  });

  describe('Mock Skill Generation', () => {
    it('should generate mock skill markdown', () => {
      const mockMarkdown = handler._mockSkillMarkdown('test-skill');

      expect(mockMarkdown).toBeDefined();
      expect(mockMarkdown).toContain('test-skill');
      expect(mockMarkdown).toContain('#');
    });

    it('should include skill name in mock', () => {
      const mockMarkdown = handler._mockSkillMarkdown('backup-skill');

      expect(mockMarkdown).toContain('backup-skill');
    });

    it('should generate valid markdown format', () => {
      const mockMarkdown = handler._mockSkillMarkdown('test');

      expect(mockMarkdown).toMatch(/^#/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty skill name', async () => {
      mockSkillRegistry.getSkill.mockResolvedValue(null);

      const result = await handler._readSkillInfo('');

      expect(result).toBeDefined();
    });

    it('should handle null skill registry', async () => {
      const nullHandler = new SkillResourceHandler({});

      const skills = await nullHandler.listSkills();
      expect(skills).toEqual([]);
    });

    it('should handle undefined skill registry', async () => {
      const undefinedHandler = new SkillResourceHandler();

      const skills = await undefinedHandler.listSkills();
      expect(skills).toEqual([]);
    });
  });
});
