/**
 * Relationship Mapper for GraphRAG
 * Maps relationships between entities based on context and linguistic patterns
 */

class RelationshipMapper {
  constructor(config = {}) {
    this.config = {
      relationshipTypes: config.relationshipTypes || [
        'related_to',
        'part_of',
        'causes',
        'similar_to',
        'references',
        'located_in',
        'member_of',
        'works_at',
        'created_by',
        'owns'
      ],
      minConfidence: config.minConfidence || 0.5,
      maxRelationships: config.maxRelationships || 100,
      ...config
    };

    this.relationships = new Map();
    this.entityConnections = new Map();
    this.mappingCount = 0;
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Map relationships between entities
   * @param {Array} entities - Array of entities to find relationships between
   * @param {string} text - Source text for context
   * @param {object} options - Mapping options
   * @returns {Promise<Array>} Array of mapped relationships
   */
  async map(entities, text, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      relationshipTypes = this.config.relationshipTypes,
      minConfidence = this.config.minConfidence,
      maxRelationships = this.config.maxRelationships
    } = options;

    const relationships = [];

    // Generate candidate pairs
    const pairs = this.generateCandidatePairs(entities);

    // Analyze each pair for relationships
    for (const pair of pairs) {
      const relationship = this.analyzeRelationship(pair.entity1, pair.entity2, text);
      
      if (
        relationship &&
        relationship.confidence >= minConfidence &&
        relationshipTypes.includes(relationship.type)
      ) {
        relationships.push(relationship);
      }

      if (relationships.length >= maxRelationships) break;
    }

    // Store relationships
    for (const rel of relationships) {
      const relId = this.getRelationshipId(rel.source, rel.target, rel.type);
      if (!this.relationships.has(relId)) {
        this.relationships.set(relId, {
          ...rel,
          firstMapped: Date.now(),
          mappingCount: 1
        });
        this.updateEntityConnections(rel.source, rel.target);
      } else {
        const existing = this.relationships.get(relId);
        existing.mappingCount++;
        existing.lastMapped = Date.now();
      }
    }

    this.mappingCount++;
    return relationships;
  }

  /**
   * Generate candidate entity pairs for relationship analysis
   */
  generateCandidatePairs(entities) {
    const pairs = [];
    
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        pairs.push({
          entity1: entities[i],
          entity2: entities[j],
          proximity: this.calculateProximity(entities[i], entities[j])
        });
      }
    }

    // Sort by proximity (closer entities more likely to be related)
    return pairs.sort((a, b) => a.proximity - b.proximity);
  }

  /**
   * Calculate proximity between two entities in text
   */
  calculateProximity(entity1, entity2) {
    if (!entity1.context || !entity2.context) return Infinity;
    
    // Simple proximity based on context overlap
    const context1 = entity1.context.toLowerCase();
    const context2 = entity2.context.toLowerCase();
    
    // Check if entities appear in similar context
    let overlap = 0;
    const words1 = new Set(context1.split(/\s+/));
    const words2 = new Set(context2.split(/\s+/));
    
    for (const word of words1) {
      if (words2.has(word) && word.length > 3) {
        overlap++;
      }
    }

    return 1 / (overlap + 1); // Lower score = closer
  }

  /**
   * Analyze relationship between two entities
   */
  analyzeRelationship(entity1, entity2, text) {
    const analyzers = [
      this.analyzeSyntacticRelationship,
      this.analyzeSemanticRelationship,
      this.analyzeTypeBasedRelationship,
      this.analyzeContextualRelationship
    ];

    const results = analyzers.map(analyzer => 
      analyzer.call(this, entity1, entity2, text)
    ).filter(r => r !== null);

    if (results.length === 0) return null;

    // Combine results and return highest confidence
    results.sort((a, b) => b.confidence - a.confidence);
    return results[0];
  }

  /**
   * Analyze syntactic relationships based on linguistic patterns
   */
  analyzeSyntacticRelationship(entity1, entity2, text) {
    const patterns = [
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:is|was|are|were)\\s+(?:a|an|the)?\\s*${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'is_a',
        confidence: 0.8
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:of|in|at|from)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'related_to',
        confidence: 0.6
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:works at|employed by|works for)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'works_at',
        confidence: 0.85
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:created|founded|established|built)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'created_by',
        confidence: 0.8
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:owns|owns|controls|holds)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'owns',
        confidence: 0.75
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:located in|based in|situated in|in)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'located_in',
        confidence: 0.7
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:member of|belongs to|part of)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'member_of',
        confidence: 0.75
      },
      {
        pattern: new RegExp(`\\b${this.escapeRegex(entity1.text)}\\s+(?:causes|leads to|results in|triggers)\\s+${this.escapeRegex(entity2.text)}\\b`, 'i'),
        type: 'causes',
        confidence: 0.7
      }
    ];

    for (const { pattern, type, confidence } of patterns) {
      if (pattern.test(text)) {
        return {
          source: entity1.id,
          target: entity2.id,
          sourceEntity: entity1,
          targetEntity: entity2,
          type,
          confidence,
          evidence: this.extractEvidence(text, pattern),
          direction: 'forward'
        };
      }

      // Check reverse pattern
      const reversePattern = new RegExp(
        pattern.source.replace(
          this.escapeRegex(entity1.text),
          '___TARGET___'
        ).replace(
          this.escapeRegex(entity2.text),
          '___SOURCE___'
        ).replace('___TARGET___', this.escapeRegex(entity2.text))
         .replace('___SOURCE___', this.escapeRegex(entity1.text)),
        'i'
      );
      
      if (reversePattern.test(text)) {
        return {
          source: entity2.id,
          target: entity1.id,
          sourceEntity: entity2,
          targetEntity: entity1,
          type,
          confidence: confidence * 0.9, // Slightly lower for reverse
          evidence: this.extractEvidence(text, reversePattern),
          direction: 'reverse'
        };
      }
    }

    return null;
  }

  /**
   * Analyze semantic relationships based on entity types
   */
  analyzeSemanticRelationship(entity1, entity2, text) {
    const typeRelationships = {
      person: {
        organization: ['works_at', 'member_of', 'created_by'],
        location: ['located_in', 'related_to'],
        event: ['related_to', 'created_by']
      },
      organization: {
        location: ['located_in', 'part_of'],
        person: ['employs', 'created_by'],
        product: ['creates', 'owns']
      },
      location: {
        location: ['part_of', 'adjacent_to'],
        organization: ['contains']
      },
      concept: {
        concept: ['similar_to', 'related_to', 'part_of']
      }
    };

    const type1 = entity1.type;
    const type2 = entity2.type;

    if (typeRelationships[type1] && typeRelationships[type1][type2]) {
      const possibleTypes = typeRelationships[type1][type2];
      return {
        source: entity1.id,
        target: entity2.id,
        sourceEntity: entity1,
        targetEntity: entity2,
        type: possibleTypes[0],
        confidence: 0.5, // Lower confidence for type-based inference
        evidence: 'Type-based inference',
        direction: 'inferred'
      };
    }

    return null;
  }

  /**
   * Analyze relationships based on entity types
   */
  analyzeTypeBasedRelationship(entity1, entity2, text) {
    // Part-of relationships for nested names
    if (entity2.text && entity1.text.includes(entity2.text)) {
      return {
        source: entity1.id,
        target: entity2.id,
        sourceEntity: entity1,
        targetEntity: entity2,
        type: 'part_of',
        confidence: 0.6,
        evidence: 'Text inclusion',
        direction: 'inferred'
      };
    }

    return null;
  }

  /**
   * Analyze contextual relationships
   */
  analyzeContextualRelationship(entity1, entity2, text) {
    const proximity = this.calculateProximity(entity1, entity2);
    
    if (proximity < 0.5) { // Close proximity
      return {
        source: entity1.id,
        target: entity2.id,
        sourceEntity: entity1,
        targetEntity: entity2,
        type: 'related_to',
        confidence: 0.4,
        evidence: 'Contextual proximity',
        direction: 'inferred'
      };
    }

    return null;
  }

  /**
   * Extract evidence text for a relationship
   */
  extractEvidence(text, pattern) {
    const match = text.match(pattern);
    if (match) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(text.length, match.index + match[0].length + 20);
      return text.substring(start, end);
    }
    return 'Pattern match';
  }

  /**
   * Update entity connection tracking
   */
  updateEntityConnections(sourceId, targetId) {
    if (!this.entityConnections.has(sourceId)) {
      this.entityConnections.set(sourceId, new Set());
    }
    if (!this.entityConnections.has(targetId)) {
      this.entityConnections.set(targetId, new Set());
    }
    
    this.entityConnections.get(sourceId).add(targetId);
    this.entityConnections.get(targetId).add(sourceId);
  }

  /**
   * Get relationship by ID
   */
  getRelationship(sourceId, targetId, type) {
    const relId = this.getRelationshipId(sourceId, targetId, type);
    return this.relationships.get(relId);
  }

  /**
   * Get all relationships for an entity
   */
  getRelationshipsForEntity(entityId) {
    const relationships = [];
    
    for (const rel of this.relationships.values()) {
      if (rel.source === entityId || rel.target === entityId) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  /**
   * Get all relationships
   */
  getAllRelationships() {
    return Array.from(this.relationships.values());
  }

  /**
   * Clear all relationships
   */
  clear() {
    this.relationships.clear();
    this.entityConnections.clear();
    this.mappingCount = 0;
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    const byType = new Map();
    for (const rel of this.relationships.values()) {
      byType.set(rel.type, (byType.get(rel.type) || 0) + 1);
    }

    return {
      totalRelationships: this.relationships.size,
      mappingCount: this.mappingCount,
      relationshipsByType: Object.fromEntries(byType),
      connectedEntities: this.entityConnections.size
    };
  }

  /**
   * Generate unique relationship ID
   */
  getRelationshipId(sourceId, targetId, type) {
    // Ensure consistent ordering for bidirectional relationships
    const [first, second] = [sourceId, targetId].sort();
    return `${first}->${second}:${type}`;
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = RelationshipMapper;
