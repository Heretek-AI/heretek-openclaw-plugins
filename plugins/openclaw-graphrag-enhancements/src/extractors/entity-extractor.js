/**
 * Entity Extractor for GraphRAG
 * Extracts named entities from text using NLP techniques
 */

class EntityExtractor {
  constructor(config = {}) {
    this.config = {
      entityTypes: config.entityTypes || [
        'PERSON',
        'ORGANIZATION',
        'LOCATION',
        'CONCEPT',
        'EVENT',
        'DATE',
        'PRODUCT'
      ],
      minConfidence: config.minConfidence || 0.6,
      maxEntities: config.maxEntities || 1000,
      ...config
    };

    this.extractedEntities = new Map();
    this.extractionCount = 0;
    this.initialized = false;
  }

  async initialize() {
    // Initialize NLP resources
    this.initialized = true;
  }

  /**
   * Extract entities from text
   * @param {string} text - Text to extract entities from
   * @param {object} options - Extraction options
   * @returns {Array} Array of extracted entities
   */
  extract(text, options = {}) {
    // Handle null, undefined, or empty text
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return [];
    }

    const {
      entityTypes = this.config.entityTypes,
      minConfidence = this.config.minConfidence,
      maxEntities = this.config.maxEntities
    } = options;

    const entities = [];

    // Extract different entity types
    const extractedByType = {
      persons: this.extractPersons(text),
      organizations: this.extractOrganizations(text),
      locations: this.extractLocations(text),
      dates: this.extractDates(text),
      concepts: this.extractConcepts(text),
      events: this.extractEvents(text)
    };

    // Process and deduplicate entities
    const seenIds = new Set();
    for (const [type, typeEntities] of Object.entries(extractedByType)) {
      if (!entityTypes.some(et => type.includes(et.toLowerCase()))) continue;

      for (const entity of typeEntities) {
        if (entity.confidence < minConfidence) continue;
        if (seenIds.has(entity.id)) continue;

        seenIds.add(entity.id);
        entities.push(entity);

        if (entities.length >= maxEntities) break;
      }

      if (entities.length >= maxEntities) break;
    }

    // Sort by confidence and store
    entities.sort((a, b) => b.confidence - a.confidence);
    
    for (const entity of entities) {
      if (!this.extractedEntities.has(entity.id)) {
        this.extractedEntities.set(entity.id, {
          ...entity,
          firstExtracted: Date.now(),
          extractionCount: 1
        });
      } else {
        const existing = this.extractedEntities.get(entity.id);
        existing.extractionCount++;
        existing.lastExtracted = Date.now();
      }
    }

    this.extractionCount++;
    return entities;
  }

  /**
   * Extract entities from multiple texts (batch extraction)
   * @param {Array<string>} texts - Array of texts to extract entities from
   * @returns {Array} Array of arrays, where each inner array contains entities from corresponding text
   */
  extractBatch(texts) {
    if (!Array.isArray(texts)) {
      return [];
    }
    
    const results = [];
    for (const text of texts) {
      const entities = this.extract(text);
      results.push(entities);
    }
    return results;
  }

  /**
   * Extract person names from text
   */
  extractPersons(text) {
    const entities = [];
    
    // Pattern for capitalized names (simple heuristic)
    const namePatterns = [
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // First Last
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // First Middle Last
      /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g, // Title + Name
      /\b([A-Z][a-z]+)\b/g // Single capitalized names
    ];

    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1] || match[0];
        // Skip common false positives
        const falsePositives = ['The', 'This', 'That', 'These', 'Those', 'And', 'But', 'For', 'With', 'From', 'Into', 'Upon', 'About', 'After', 'Before', 'During', 'Without'];
        if (falsePositives.includes(name)) continue;
        
        entities.push({
          id: this.hash(`person:${name.toLowerCase()}`),
          type: 'PERSON',
          text: name,
          confidence: 0.6,
          context: this.getContext(text, match.index)
        });
      }
    }

    return entities;
  }

  /**
   * Extract organization names from text
   */
  extractOrganizations(text) {
    const entities = [];
    
    // Patterns for organization names
    const orgPatterns = [
      /\b([A-Z][A-Za-z]*\s+(?:Inc\.|LLC|Ltd\.|Corporation|Corp\.|Company|Co\.|Group|Foundation|Institute|University|College|School|Department|Agency|Administration|Association|Organization))\b/g,
      /\b([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*\s+(?:Technologies|Systems|Solutions|Services|Industries|Enterprises|Holdings|Partners|Consulting|Labs|Laboratories))\b/g,
      /\b(Google|Microsoft|Apple|Amazon|Facebook|Meta|Netflix|Tesla|IBM|Intel|Oracle|Adobe|SAP|Salesforce|Twitter|Uber|Airbnb|Spotify|Slack|Zoom)\b/g // Well-known tech companies
    ];

    for (const pattern of orgPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const org = match[0];
        // Filter out common false positives
        if (this.isLikelyOrganization(org)) {
          entities.push({
            id: this.hash(`organization:${org.toLowerCase()}`),
            type: 'ORGANIZATION',
            text: org,
            confidence: 0.7,
            context: this.getContext(text, match.index)
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract location names from text
   */
  extractLocations(text) {
    const entities = [];
    
    // Patterns for locations
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:City|Town|Village|County|State|Province|Region|District))\b/g,
      /\b(?:in|from|to|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      /\b([A-Z][a-z]+\s+(?:Street|St\.|Avenue|Ave\.|Boulevard|Blvd\.|Road|Rd\.|Drive|Dr\.|Lane|Ln\.|Court|Ct\.))\b/g
    ];

    for (const pattern of locationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = match[1] || match[0];
        entities.push({
          id: this.hash(`location:${location.toLowerCase()}`),
          type: 'LOCATION',
          text: location,
          confidence: 0.6,
          context: this.getContext(text, match.index)
        });
      }
    }

    return entities;
  }

  /**
   * Extract dates and temporal expressions
   */
  extractDates(text) {
    const entities = [];
    
    const datePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, // MM/DD/YYYY
      /\b(\d{4}-\d{2}-\d{2})\b/g, // YYYY-MM-DD
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/g,
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.\s+\d{1,2},?\s+\d{4})\b/g,
      /\b((?:today|tomorrow|yesterday|next\s+week|last\s+week|next\s+month|last\s+month))\b/g
    ];

    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const date = match[0];
        entities.push({
          id: this.hash(`date:${date.toLowerCase()}`),
          type: 'DATE',
          text: date,
          confidence: 0.8,
          context: this.getContext(text, match.index)
        });
      }
    }

    return entities;
  }

  /**
   * Extract concepts and abstract entities
   */
  extractConcepts(text) {
    const entities = [];
    
    // Look for quoted terms and technical concepts
    const conceptPatterns = [
      /["']([^"']{3,50})["']/g, // Quoted terms
      /\b([A-Z][a-z]+(?:-[A-Z][a-z]+)+)\b/g, // Hyphenated terms
      /\b([a-z]+(?:-[a-z]+)+)\b/g, // Lowercase hyphenated terms
      /\b(machine learning|artificial intelligence|programming language|python|java|javascript)\b/gi // Common tech concepts
    ];

    for (const pattern of conceptPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const concept = match[1] || match[0];
        if (concept.length > 2 && concept.length < 50) {
          entities.push({
            id: this.hash(`concept:${concept.toLowerCase()}`),
            type: 'CONCEPT',
            text: concept,
            confidence: 0.55,
            context: this.getContext(text, match.index)
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract event names from text
   */
  extractEvents(text) {
    const entities = [];
    
    const eventPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Conference|Summit|Meeting|Symposium|Workshop|Seminar|Convention|Forum|Congress|Exhibition|Show|Festival|Ceremony|Event))\b/g,
      /\b((?:Annual|International|National|Global|World)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    ];

    for (const pattern of eventPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const event = match[0];
        entities.push({
          id: this.hash(`event:${event.toLowerCase()}`),
          type: 'EVENT',
          text: event,
          confidence: 0.65,
          context: this.getContext(text, match.index)
        });
      }
    }

    return entities;
  }

  /**
   * Get context around a match
   */
  getContext(text, matchIndex, windowSize = 50) {
    const start = Math.max(0, matchIndex - windowSize);
    const end = Math.min(text.length, matchIndex + windowSize);
    let context = text.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context.trim();
  }

  /**
   * Check if text is likely an organization name
   */
  isLikelyOrganization(text) {
    const falsePositives = [
      'The', 'A', 'An', 'This', 'That', 'These', 'Those',
      'He', 'She', 'They', 'We', 'You', 'I',
      'It', 'What', 'Which', 'Who', 'Whom', 'Whose'
    ];
    
    const words = text.trim().split(/\s+/);
    
    // Too short or single common word
    if (words.length === 1 && falsePositives.includes(words[0])) return false;
    
    // Too long
    if (words.length > 6) return false;
    
    // All caps (likely acronym, might be org)
    if (text === text.toUpperCase() && text.length > 2) return true;
    
    return true;
  }

  /**
   * Get all extracted entities
   */
  getAllEntities() {
    return Array.from(this.extractedEntities.values());
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId) {
    return this.extractedEntities.get(entityId);
  }

  /**
   * Clear extracted entities
   */
  clear() {
    this.extractedEntities.clear();
    this.extractionCount = 0;
  }

  /**
   * Get extraction statistics
   */
  getStats() {
    const byType = new Map();
    let totalConfidence = 0;
    for (const entity of this.extractedEntities.values()) {
      byType.set(entity.type, (byType.get(entity.type) || 0) + 1);
      totalConfidence += entity.confidence;
    }

    return {
      totalEntities: this.extractedEntities.size,
      totalExtractions: this.extractionCount,
      entitiesByType: Object.fromEntries(byType),
      byType: Object.fromEntries(byType),
      averageConfidence: this.extractedEntities.size > 0 ? totalConfidence / this.extractedEntities.size : 0
    };
  }

  /**
   * Get extraction statistics (alias for getStats)
   */
  getStatistics() {
    return this.getStats();
  }

  /**
   * Simple hash function for entity IDs
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'ent-' + Math.abs(hash).toString(36);
  }
}

export default EntityExtractor;
