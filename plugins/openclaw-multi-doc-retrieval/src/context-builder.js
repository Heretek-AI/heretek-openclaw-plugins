/**
 * Context Builder Module
 * Constructs coherent context from multiple retrieved documents
 */

class ContextBuilder {
  constructor(config = {}) {
    this.config = {
      maxLength: config.maxLength || 8000,
      overlap: config.overlap || 100,
      separator: config.separator || '\n\n---\n\n',
      includeMetadata: config.includeMetadata ?? true,
      truncateStrategy: config.truncateStrategy || 'middle',
      ...config
    };

    this.initialized = false;
    this.buildCount = 0;
    this.totalCharacters = 0;
  }

  async initialize() {
    this.initialized = true;
  }

  /**
   * Build context from retrieved documents
   * @param {Array<object>} documents - Retrieved documents
   * @param {object} options - Build options
   * @returns {Promise<string>} Constructed context
   */
  async build(documents, options = {}) {
    const {
      maxLength = this.config.maxLength,
      separator = this.config.separator,
      includeMetadata = this.config.includeMetadata
    } = options;

    if (!documents || documents.length === 0) {
      return '';
    }

    // Build context sections
    const sections = documents.map((doc, index) => {
      let section = '';
      
      if (includeMetadata) {
        section += `[Document ${index + 1}]`;
        if (doc.metadata?.source) section += ` Source: ${doc.metadata.source}`;
        if (doc.metadata?.type) section += ` Type: ${doc.metadata.type}`;
        section += '\n';
      }
      
      section += doc.content || doc.text || '';
      
      return section;
    });

    // Join sections
    let context = sections.join(separator);

    // Truncate if needed
    if (context.length > maxLength) {
      context = this.truncateContext(context, maxLength);
    }

    this.buildCount++;
    this.totalCharacters += context.length;

    return context;
  }

  /**
   * Truncate context to max length
   */
  truncateContext(context, maxLength) {
    const { truncateStrategy, overlap } = this.config;

    if (truncateStrategy === 'middle') {
      // Keep beginning and end, remove middle
      const keepLength = Math.floor((maxLength - overlap) / 2);
      const start = context.slice(0, keepLength);
      const end = context.slice(-(keepLength + overlap));
      return `${start}\n\n[...truncated...]\n\n${end}`;
    } else if (truncateStrategy === 'end') {
      // Keep only beginning
      return context.slice(0, maxLength) + '\n\n[...truncated...]';
    } else {
      // Default: truncate from start
      return '[...truncated...]\n\n' + context.slice(-maxLength);
    }
  }

  /**
   * Build context with citations
   * @param {Array<object>} documents - Documents with citation IDs
   * @returns {Promise<string>} Context with citation markers
   */
  async buildWithCitations(documents) {
    const sections = documents.map((doc, index) => {
      const citationMarker = `[${index + 1}]`;
      const content = doc.content || doc.text || '';
      return `${citationMarker} ${content}`;
    });

    return sections.join('\n\n');
  }

  /**
   * Get context builder statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    return {
      type: 'context',
      buildCount: this.buildCount,
      totalCharacters: this.totalCharacters,
      avgContextLength: this.buildCount > 0 ? this.totalCharacters / this.buildCount : 0,
      maxLength: this.config.maxLength,
      truncateStrategy: this.config.truncateStrategy
    };
  }

  /**
   * Clear context builder state
   * @returns {Promise<void>}
   */
  async clear() {
    this.buildCount = 0;
    this.totalCharacters = 0;
  }
}

module.exports = ContextBuilder;
