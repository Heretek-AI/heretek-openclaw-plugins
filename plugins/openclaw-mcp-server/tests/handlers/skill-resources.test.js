/**
 * Tests for SkillResourceHandler
 * @module SkillResourceHandlerTests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SkillResourceHandler } from '../../src/handlers/skill-resources.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('SkillResourceHandler', () => {
  let handler;
  let testSkillsDir;

  beforeEach(async () => {
    // Create a temporary test skills directory
    testSkillsDir = path.join(__dirname, 'test-skills-temp');
    await fs.mkdir(testSkillsDir, { recursive: true });
    
    handler = new SkillResourceHandler(testSkillsDir);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Clean up temp directory
    try {
      await fs.rm(testSkillsDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('List Resources', () => {
    test('should list basic skill resources', async () => {
      const resources = await handler.listResources();

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].uri).toBe('skill://list');
    });

    test('should include skill list resource', async () => {
      const resources = await handler.listResources();

      const listResource = resources.find(r => r.uri === 'skill://list');
      expect(listResource).toBeDefined();
      expect(listResource.name).toBe('All Skills');
    });

    test('should include categories resource', async () => {
      const resources = await handler.listResources();

      const categoriesResource = resources.find(r => r.uri === 'skill://categories');
      expect(categoriesResource).toBeDefined();
      expect(categoriesResource.name).toBe('Skill Categories');
    });

    test('should include dynamic skill resources when skills exist', async () => {
      // Create a test skill directory
      const skillDir = path.join(testSkillsDir, 'test-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: test-skill
description: A test skill
---
# Test Skill
`);

      const resources = await handler.listResources();

      const skillResource = resources.find(r => r.uri === 'skill://test-skill');
      expect(skillResource).toBeDefined();
    });

    test('should include category resources when categories exist', async () => {
      // Create a test skill directory with category
      const skillDir = path.join(testSkillsDir, 'backup-ledger');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: backup-ledger
description: Backup skill
category: operations
---
# Backup Ledger
`);

      const resources = await handler.listResources();

      const categoryResource = resources.find(r => r.uri === 'skill://category/operations');
      expect(categoryResource).toBeDefined();
    });
  });

  describe('Read Resource', () => {
    test('should read skill list resource', async () => {
      // Create test skills
      const skill1Dir = path.join(testSkillsDir, 'skill-1');
      const skill2Dir = path.join(testSkillsDir, 'skill-2');
      await fs.mkdir(skill1Dir, { recursive: true });
      await fs.mkdir(skill2Dir, { recursive: true });
      await fs.writeFile(path.join(skill1Dir, 'SKILL.md'), `---
name: skill-1
description: First skill
---
# Skill 1
`);
      await fs.writeFile(path.join(skill2Dir, 'SKILL.md'), `---
name: skill-2
description: Second skill
---
# Skill 2
`);

      const result = await handler.readResource('skill://list');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      const skillNames = result.map(s => s.name);
      expect(skillNames).toContain('skill-1');
      expect(skillNames).toContain('skill-2');
    });

    test('should read categories resource', async () => {
      const result = await handler.readResource('skill://categories');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should read individual skill resource', async () => {
      const skillDir = path.join(testSkillsDir, 'test-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: test-skill
description: Test skill description
category: testing
---
# Test Skill
Content here
`);

      const result = await handler.readResource('skill://test-skill');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('test-skill');
    });

    test('should return mock skill for non-existent skill', async () => {
      const result = await handler.readResource('skill://non-existent');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('non-existent');
    });
  });

  describe('List Skills', () => {
    test('should return skills from filesystem', async () => {
      const skill1Dir = path.join(testSkillsDir, 'skill-1');
      const skill2Dir = path.join(testSkillsDir, 'skill-2');
      await fs.mkdir(skill1Dir, { recursive: true });
      await fs.mkdir(skill2Dir, { recursive: true });
      await fs.writeFile(path.join(skill1Dir, 'SKILL.md'), `---
name: skill-1
description: First skill
---
# Skill 1
`);
      await fs.writeFile(path.join(skill2Dir, 'SKILL.md'), `---
name: skill-2
description: Second skill
---
# Skill 2
`);

      const skills = await handler.listSkills();

      expect(skills).toBeDefined();
      expect(skills.length).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array when no skills', async () => {
      const skills = await handler.listSkills();

      expect(skills).toEqual([]);
    });
  });

  describe('List Categories', () => {
    test('should return default categories when no skills', async () => {
      const categories = await handler.listCategories();

      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
    });

    test('should return categories from skills', async () => {
      const skillDir = path.join(testSkillsDir, 'backup-ledger');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: backup-ledger
description: Backup skill
category: operations
---
# Backup Ledger
`);

      const categories = await handler.listCategories();

      expect(categories).toBeDefined();
      expect(categories).toContain('operations');
    });
  });

  describe('List Skills by Category', () => {
    test('should filter skills by category', async () => {
      // Create skills in testing category
      const skill1Dir = path.join(testSkillsDir, 'test-skill-1');
      const skill2Dir = path.join(testSkillsDir, 'test-skill-2');
      
      await fs.mkdir(skill1Dir, { recursive: true });
      await fs.mkdir(skill2Dir, { recursive: true });
      
      await fs.writeFile(path.join(skill1Dir, 'SKILL.md'), `---
name: test-skill-1
category: testing
---
# Test 1
`);
      await fs.writeFile(path.join(skill2Dir, 'SKILL.md'), `---
name: test-skill-2
category: testing
---
# Test 2
`);

      const testingSkills = await handler.listSkillsByCategory('testing');

      expect(testingSkills.length).toBeGreaterThanOrEqual(1);
    });

    test('should return empty array for unknown category', async () => {
      const skills = await handler.listSkillsByCategory('unknown-category');

      expect(skills).toEqual([]);
    });

    test('should handle category mapping for operations', async () => {
      const skillDir = path.join(testSkillsDir, 'backup-ledger');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: backup-ledger
category: operations
---
# Backup
`);

      const skills = await handler.listSkillsByCategory('operations');

      expect(skills).toBeDefined();
      expect(skills.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Read Skill', () => {
    test('should return skill content', async () => {
      const skillDir = path.join(testSkillsDir, 'test-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: test-skill
description: Test description
category: testing
version: 1.0.0
---
# Test Skill
Full content here
`);

      const skill = await handler.readSkill('test-skill');

      expect(skill).toBeDefined();
      expect(typeof skill).toBe('string');
      expect(skill).toContain('test-skill');
      expect(skill).toContain('Test description');
    });

    test('should return mock skill for non-existent skill', async () => {
      const skill = await handler.readSkill('non-existent');

      expect(skill).toBeDefined();
      expect(typeof skill).toBe('string');
      expect(skill).toContain('non-existent');
    });
  });

  describe('Category Inference', () => {
    test('should infer category from skill name', () => {
      const category = handler._inferCategory('backup-ledger');
      expect(category).toBe('operations');
    });

    test('should return default category for unknown names', () => {
      const category = handler._inferCategory('unknown-skill-name');
      expect(category).toBe('utilities');
    });

    test('should map triad skills to triad-protocols', () => {
      const category = handler._inferCategory('triad-heartbeat');
      expect(category).toBe('triad-protocols');
    });

    test('should map governance skills correctly', () => {
      const category = handler._inferCategory('quorum-enforcement');
      expect(category).toBe('governance');
    });
  });

  describe('Mock Skill Generation', () => {
    test('should generate mock skill markdown', () => {
      const mockMarkdown = handler._mockSkillMarkdown('test-skill');

      expect(mockMarkdown).toBeDefined();
      expect(mockMarkdown).toContain('test-skill');
    });

    test('should include skill name in mock', () => {
      const mockMarkdown = handler._mockSkillMarkdown('backup-skill');

      expect(mockMarkdown).toContain('backup-skill');
    });

    test('should generate markdown with skill name header', () => {
      const mockMarkdown = handler._mockSkillMarkdown('test');

      expect(mockMarkdown).toContain('# test');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty skills directory', async () => {
      const skills = await handler.listSkills();
      expect(skills).toEqual([]);
    });

    test('should handle valid skills path', async () => {
      const validHandler = new SkillResourceHandler('./skills');
      const skills = await validHandler.listSkills();
      // Should handle gracefully even if directory doesn't exist
      expect(skills).toBeDefined();
      expect(Array.isArray(skills)).toBe(true);
    });

    test('should handle default constructor', async () => {
      const defaultHandler = new SkillResourceHandler();
      const skills = await defaultHandler.listSkills();
      // Should handle gracefully
      expect(skills).toBeDefined();
      expect(Array.isArray(skills)).toBe(true);
    });
  });
});
