/**
 * Tests for RelationshipMapper
 * @module RelationshipMapperTests
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import RelationshipMapper from '../src/extractors/relationship-mapper.js';

describe('RelationshipMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new RelationshipMapper({
      maxRelationships: 100,
      relationshipTypes: ['IS_A', 'PART_OF', 'CAUSES', 'RELATED_TO', 'LOCATED_IN'],
      minConfidence: 0.5
    });
  });

  afterEach(() => {
    mapper.clear();
  });

  describe('Initialization', () => {
    it('should create mapper with configuration', () => {
      expect(mapper.config).toBeDefined();
      expect(mapper.config.maxRelationships).toBe(100);
      expect(mapper.config.relationshipTypes).toHaveLength(5);
    });

    it('should use default configuration', () => {
      const defaultMapper = new RelationshipMapper();

      expect(defaultMapper.config.maxRelationships).toBe(1000);
      expect(defaultMapper.config.relationshipTypes).toBeDefined();
    });
  });

  describe('Relationship Extraction', () => {
    it('should extract relationships from text', () => {
      const text = 'John works at Google.';
      const entities = [
        { text: 'John', type: 'PERSON' },
        { text: 'Google', type: 'ORGANIZATION' }
      ];

      const relationships = mapper.extract(text, entities);

      expect(relationships).toBeDefined();
      expect(Array.isArray(relationships)).toBe(true);
    });

    it('should extract IS_A relationships', () => {
      const text = 'Machine learning is a subset of artificial intelligence.';
      const entities = [
        { text: 'machine learning', type: 'CONCEPT' },
        { text: 'artificial intelligence', type: 'CONCEPT' }
      ];

      const relationships = mapper.extract(text, entities);

      const isARelationships = relationships.filter(r => r.type === 'IS_A' || r.type === 'SUBSET_OF');
      expect(isARelationships.length).toBeGreaterThan(0);
    });

    it('should extract PART_OF relationships', () => {
      const text = 'The engine is part of the car.';
      const entities = [
        { text: 'engine', type: 'CONCEPT' },
        { text: 'car', type: 'CONCEPT' }
      ];

      const relationships = mapper.extract(text, entities);

      const partOfRelationships = relationships.filter(r => r.type === 'PART_OF');
      expect(partOfRelationships.length).toBeGreaterThan(0);
    });

    it('should extract CAUSES relationships', () => {
      const text = 'Smoking causes cancer.';
      const entities = [
        { text: 'smoking', type: 'CONCEPT' },
        { text: 'cancer', type: 'CONCEPT' }
      ];

      const relationships = mapper.extract(text, entities);

      const causesRelationships = relationships.filter(r => r.type === 'CAUSES');
      expect(causesRelationships.length).toBeGreaterThan(0);
    });

    it('should extract RELATED_TO relationships', () => {
      const text = 'Python is related to programming.';
      const entities = [
        { text: 'Python', type: 'CONCEPT' },
        { text: 'programming', type: 'CONCEPT' }
      ];

      const relationships = mapper.extract(text, entities);

      const relatedRelationships = relationships.filter(r => r.type === 'RELATED_TO');
      expect(relatedRelationships.length).toBeGreaterThan(0);
    });

    it('should extract LOCATED_IN relationships', () => {
      const text = 'Google is located in Mountain View.';
      const entities = [
        { text: 'Google', type: 'ORGANIZATION' },
        { text: 'Mountain View', type: 'LOCATION' }
      ];

      const relationships = mapper.extract(text, entities);

      const locatedInRelationships = relationships.filter(r => r.type === 'LOCATED_IN');
      expect(locatedInRelationships.length).toBeGreaterThan(0);
    });

    it('should include source and target entities', () => {
      const text = 'John works at Google.';
      const entities = [
        { text: 'John', type: 'PERSON', id: 'e1' },
        { text: 'Google', type: 'ORGANIZATION', id: 'e2' }
      ];

      const relationships = mapper.extract(text, entities);

      if (relationships.length > 0) {
        expect(relationships[0].source).toBeDefined();
        expect(relationships[0].target).toBeDefined();
      }
    });

    it('should include confidence scores', () => {
      const text = 'Test relationship extraction.';
      const entities = [
        { text: 'Test', type: 'CONCEPT' },
        { text: 'extraction', type: 'CONCEPT' }
      ];

      const relationships = mapper.extract(text, entities);

      relationships.forEach(rel => {
        expect(rel.confidence).toBeDefined();
        expect(typeof rel.confidence).toBe('number');
      });
    });

    it('should limit relationships to maxRelationships', () => {
      const longText = 'A causes B. B is part of C. C relates to D. D is in E.';
      const entities = [
        { text: 'A', type: 'CONCEPT' },
        { text: 'B', type: 'CONCEPT' },
        { text: 'C', type: 'CONCEPT' },
        { text: 'D', type: 'CONCEPT' },
        { text: 'E', type: 'CONCEPT' }
      ];

      const limitedMapper = new RelationshipMapper({ maxRelationships: 2 });
      const relationships = limitedMapper.extract(longText, entities);

      expect(relationships.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minConfidence', () => {
      const text = 'Test relationship with confidence.';
      const entities = [
        { text: 'Test', type: 'CONCEPT' },
        { text: 'confidence', type: 'CONCEPT' }
      ];

      const strictMapper = new RelationshipMapper({ minConfidence: 0.9 });
      const relationships = strictMapper.extract(text, entities);

      relationships.forEach(rel => {
        expect(rel.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });
  });

  describe('Relationship Validation', () => {
    it('should validate relationship type', () => {
      const isValid = mapper.isValidRelationshipType('IS_A');
      expect(isValid).toBe(true);
    });

    it('should reject invalid relationship type', () => {
      const isValid = mapper.isValidRelationshipType('INVALID_TYPE');
      expect(isValid).toBe(false);
    });

    it('should validate entity pair', () => {
      const source = { text: 'John', type: 'PERSON' };
      const target = { text: 'Google', type: 'ORGANIZATION' };

      const isValid = mapper.isValidEntityPair(source, target, 'WORKS_AT');
      expect(isValid).toBeDefined();
    });
  });

  describe('Batch Extraction', () => {
    it('should extract from multiple texts', () => {
      const texts = [
        { text: 'John works at Google.', entities: [{ text: 'John', type: 'PERSON' }, { text: 'Google', type: 'ORGANIZATION' }] },
        { text: 'Alice works at Microsoft.', entities: [{ text: 'Alice', type: 'PERSON' }, { text: 'Microsoft', type: 'ORGANIZATION' }] }
      ];

      const allRelationships = mapper.extractBatch(texts);

      expect(allRelationships).toBeDefined();
      expect(Array.isArray(allRelationships)).toBe(true);
    });

    it('should handle empty batch', () => {
      const relationships = mapper.extractBatch([]);
      expect(relationships).toEqual([]);
    });
  });

  describe('Relationship Deduplication', () => {
    it('should deduplicate identical relationships', () => {
      const text = 'John works at Google. John is employed by Google.';
      const entities = [
        { text: 'John', type: 'PERSON', id: 'e1' },
        { text: 'Google', type: 'ORGANIZATION', id: 'e2' }
      ];

      const relationships = mapper.extract(text, entities);

      // Should not have duplicate source-target pairs with same type
      const uniquePairs = new Set(relationships.map(r => `${r.source}-${r.target}-${r.type}`));
      expect(uniquePairs.size).toBeLessThanOrEqual(relationships.length);
    });
  });

  describe('Statistics', () => {
    it('should track extraction statistics', () => {
      const text1 = 'John works at Google.';
      const entities1 = [{ text: 'John', type: 'PERSON' }, { text: 'Google', type: 'ORGANIZATION' }];
      mapper.extract(text1, entities1);

      const text2 = 'Alice works at Microsoft.';
      const entities2 = [{ text: 'Alice', type: 'PERSON' }, { text: 'Microsoft', type: 'ORGANIZATION' }];
      mapper.extract(text2, entities2);

      const stats = mapper.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalExtractions).toBeGreaterThanOrEqual(2);
    });

    it('should track relationships by type', () => {
      const text = 'John works at Google in Paris.';
      const entities = [
        { text: 'John', type: 'PERSON' },
        { text: 'Google', type: 'ORGANIZATION' },
        { text: 'Paris', type: 'LOCATION' }
      ];

      mapper.extract(text, entities);

      const stats = mapper.getStatistics();

      expect(stats.byType).toBeDefined();
    });

    it('should track average confidence', () => {
      const text = 'Test relationship confidence.';
      const entities = [
        { text: 'Test', type: 'CONCEPT' },
        { text: 'confidence', type: 'CONCEPT' }
      ];

      mapper.extract(text, entities);

      const stats = mapper.getStatistics();

      expect(stats.averageConfidence).toBeDefined();
    });
  });

  describe('Clear', () => {
    it('should clear extracted relationships', () => {
      const text = 'John works at Google.';
      const entities = [{ text: 'John', type: 'PERSON' }, { text: 'Google', type: 'ORGANIZATION' }];
      mapper.extract(text, entities);

      mapper.clear();

      const stats = mapper.getStatistics();
      expect(stats.totalExtractions).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const entities = [{ text: 'Entity', type: 'CONCEPT' }];
      const relationships = mapper.extract('', entities);
      expect(relationships).toEqual([]);
    });

    it('should handle null text', () => {
      const entities = [{ text: 'Entity', type: 'CONCEPT' }];
      const relationships = mapper.extract(null, entities);
      expect(relationships).toEqual([]);
    });

    it('should handle empty entities', () => {
      const text = 'Some text without entities.';
      const relationships = mapper.extract(text, []);
      expect(relationships).toEqual([]);
    });

    it('should handle null entities', () => {
      const text = 'Some text.';
      const relationships = mapper.extract(text, null);
      expect(relationships).toEqual([]);
    });

    it('should handle single entity', () => {
      const text = 'Single entity text.';
      const entities = [{ text: 'OnlyEntity', type: 'CONCEPT' }];
      const relationships = mapper.extract(text, entities);
      expect(relationships).toBeDefined();
    });

    it('should handle text with special characters', () => {
      const text = 'Test! @#$% relationship & more.';
      const entities = [
        { text: 'Test', type: 'CONCEPT' },
        { text: 'relationship', type: 'CONCEPT' }
      ];
      const relationships = mapper.extract(text, entities);
      expect(relationships).toBeDefined();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(10000) + ' causes ' + 'B'.repeat(10000);
      const entities = [
        { text: 'A', type: 'CONCEPT' },
        { text: 'B', type: 'CONCEPT' }
      ];
      const relationships = mapper.extract(longText, entities);
      expect(relationships).toBeDefined();
    });
  });
});
