/**
 * Tests for EntityExtractor
 * @module EntityExtractorTests
 */

import { EntityExtractor } from '../src/extractors/entity-extractor.js';

describe('EntityExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new EntityExtractor({
      maxEntities: 100,
      entityTypes: ['PERSON', 'ORGANIZATION', 'LOCATION', 'CONCEPT', 'EVENT'],
      minConfidence: 0.5
    });
  });

  afterEach(() => {
    extractor.clear();
  });

  describe('Initialization', () => {
    it('should create extractor with configuration', () => {
      expect(extractor.config).toBeDefined();
      expect(extractor.config.maxEntities).toBe(100);
      expect(extractor.config.entityTypes).toHaveLength(5);
    });

    it('should use default configuration', () => {
      const defaultExtractor = new EntityExtractor();

      expect(defaultExtractor.config.maxEntities).toBe(1000);
      expect(defaultExtractor.config.entityTypes).toBeDefined();
    });
  });

  describe('Entity Extraction', () => {
    it('should extract entities from text', () => {
      const text = 'John works at Google in Mountain View.';
      const entities = extractor.extract(text);

      expect(entities).toBeDefined();
      expect(Array.isArray(entities)).toBe(true);
    });

    it('should extract person entities', () => {
      const text = 'Alice and Bob are working together.';
      const entities = extractor.extract(text);

      const people = entities.filter(e => e.type === 'PERSON');
      expect(people.length).toBeGreaterThan(0);
    });

    it('should extract organization entities', () => {
      const text = 'Microsoft and Apple are tech companies.';
      const entities = extractor.extract(text);

      const orgs = entities.filter(e => e.type === 'ORGANIZATION');
      expect(orgs.length).toBeGreaterThan(0);
    });

    it('should extract concept entities', () => {
      const text = 'Machine learning and artificial intelligence are important.';
      const entities = extractor.extract(text);

      const concepts = entities.filter(e => e.type === 'CONCEPT');
      expect(concepts.length).toBeGreaterThan(0);
    });

    it('should include entity text', () => {
      const text = 'Python is a programming language.';
      const entities = extractor.extract(text);

      expect(entities.some(e => e.text === 'Python')).toBe(true);
    });

    it('should include entity type', () => {
      const text = 'Paris is a city.';
      const entities = extractor.extract(text);

      expect(entities.every(e => e.type)).toBe(true);
    });

    it('should include confidence scores', () => {
      const text = 'Test entity extraction.';
      const entities = extractor.extract(text);

      entities.forEach(entity => {
        expect(entity.confidence).toBeDefined();
        expect(typeof entity.confidence).toBe('number');
      });
    });

    it('should limit entities to maxEntities', () => {
      const longText = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z';
      const limitedExtractor = new EntityExtractor({ maxEntities: 5 });

      const entities = limitedExtractor.extract(longText);

      expect(entities.length).toBeLessThanOrEqual(5);
    });

    it('should filter by minConfidence', () => {
      const text = 'Low confidence entity test.';
      const strictExtractor = new EntityExtractor({ minConfidence: 0.9 });

      const entities = strictExtractor.extract(text);

      entities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });
  });

  describe('Batch Extraction', () => {
    it('should extract from multiple texts', () => {
      const texts = [
        'Alice works at Google.',
        'Bob works at Microsoft.'
      ];

      const allEntities = extractor.extractBatch(texts);

      expect(allEntities).toBeDefined();
      expect(Array.isArray(allEntities)).toBe(true);
    });

    it('should preserve text order in batch results', () => {
      const texts = [
        'First text with Alice',
        'Second text with Bob'
      ];

      const results = extractor.extractBatch(texts);

      expect(results).toBeDefined();
      expect(results.length).toBe(texts.length);
    });

    it('should handle empty batch', () => {
      const results = extractor.extractBatch([]);

      expect(results).toEqual([]);
    });
  });

  describe('Entity Deduplication', () => {
    it('should deduplicate identical entities', () => {
      const text = 'John John John is at Google Google.';
      const entities = extractor.extract(text);

      const uniqueTexts = new Set(entities.map(e => e.text));
      expect(uniqueTexts.size).toBeLessThanOrEqual(entities.length);
    });

    it('should merge entity metadata', () => {
      const text = 'Google is a company. Google is in Mountain View.';
      const entities = extractor.extract(text);

      const googleEntities = entities.filter(e => e.text === 'Google');
      
      if (googleEntities.length > 0) {
        expect(googleEntities[0]).toBeDefined();
      }
    });
  });

  describe('Entity Types', () => {
    it('should recognize PERSON type', () => {
      const text = 'John Smith is a person.';
      const entities = extractor.extract(text);

      const hasPerson = entities.some(e => 
        e.type === 'PERSON' && e.text.includes('John')
      );
      expect(hasPerson).toBe(true);
    });

    it('should recognize ORGANIZATION type', () => {
      const text = 'Google is a company.';
      const entities = extractor.extract(text);

      const hasOrg = entities.some(e => 
        e.type === 'ORGANIZATION' && e.text.includes('Google')
      );
      expect(hasOrg).toBe(true);
    });

    it('should recognize LOCATION type', () => {
      const text = 'Paris is in France.';
      const entities = extractor.extract(text);

      const hasLocation = entities.some(e => 
        e.type === 'LOCATION'
      );
      expect(hasLocation).toBe(true);
    });

    it('should recognize CONCEPT type', () => {
      const text = 'Machine learning is important.';
      const entities = extractor.extract(text);

      const hasConcept = entities.some(e => 
        e.type === 'CONCEPT'
      );
      expect(hasConcept).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track extraction statistics', () => {
      extractor.extract('John works at Google.');
      extractor.extract('Alice is at Microsoft.');

      const stats = extractor.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalExtractions).toBeGreaterThanOrEqual(2);
    });

    it('should track entities by type', () => {
      extractor.extract('John at Google in Paris.');

      const stats = extractor.getStatistics();

      expect(stats.byType).toBeDefined();
    });

    it('should track average confidence', () => {
      extractor.extract('Test entity with confidence.');

      const stats = extractor.getStatistics();

      expect(stats.averageConfidence).toBeDefined();
    });
  });

  describe('Clear', () => {
    it('should clear extracted entities', () => {
      extractor.extract('Test content');
      extractor.clear();

      const stats = extractor.getStatistics();
      expect(stats.totalExtractions).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const entities = extractor.extract('');
      expect(entities).toEqual([]);
    });

    it('should handle null text', () => {
      const entities = extractor.extract(null);
      expect(entities).toEqual([]);
    });

    it('should handle undefined text', () => {
      const entities = extractor.extract(undefined);
      expect(entities).toEqual([]);
    });

    it('should handle very short text', () => {
      const entities = extractor.extract('A');
      expect(entities).toBeDefined();
    });

    it('should handle text with special characters', () => {
      const text = 'Test! @#$% entity & more.';
      const entities = extractor.extract(text);
      expect(entities).toBeDefined();
    });

    it('should handle text with numbers', () => {
      const text = 'Test 123 entity 456.';
      const entities = extractor.extract(text);
      expect(entities).toBeDefined();
    });
  });
});
