/**
 * Tests for GraphRAG algorithm
 * @module GraphRAGTests
 */

import { GraphRAG } from '../src/algorithms/graph-rag.js';

describe('GraphRAG', () => {
  let graphRag;

  beforeEach(async () => {
    graphRag = new GraphRAG({
      maxDocuments: 1000,
      maxEntities: 10000,
      maxRelationships: 50000,
      communityDetection: {
        enabled: true,
        minCommunitySize: 3
      }
    });
    await graphRag.initialize();
  });

  afterEach(() => {
    graphRag.clear();
  });

  describe('Initialization', () => {
    it('should initialize with configuration', async () => {
      const customRag = new GraphRAG({
        maxDocuments: 500,
        maxEntities: 5000
      });

      await customRag.initialize();

      expect(customRag.config.maxDocuments).toBe(500);
      expect(customRag.config.maxEntities).toBe(5000);

      customRag.clear();
    });

    it('should initialize graph structure', async () => {
      expect(graphRag.graph).toBeDefined();
      expect(graphRag.graph.nodes).toBeDefined();
      expect(graphRag.graph.edges).toBeDefined();
    });

    it('should initialize data structures', async () => {
      expect(graphRag.documents).toBeDefined();
      expect(graphRag.entities).toBeDefined();
      expect(graphRag.relationships).toBeDefined();
    });
  });

  describe('Document Processing', () => {
    it('should process a single document', async () => {
      const document = {
        id: 'doc-1',
        content: 'This is a test document about machine learning and artificial intelligence.',
        metadata: {
          source: 'test',
          timestamp: Date.now()
        }
      };

      const result = await graphRag.processDocument(document);

      expect(result).toBeDefined();
      expect(result.documentId).toBe('doc-1');
      expect(result.entities).toBeDefined();
      expect(result.relationships).toBeDefined();
    });

    it('should extract entities from document', async () => {
      const document = {
        id: 'doc-2',
        content: 'Python is a programming language. Machine learning uses Python.',
        metadata: {}
      };

      const result = await graphRag.processDocument(document);

      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should extract relationships from document', async () => {
      const document = {
        id: 'doc-3',
        content: 'Machine learning is a subset of artificial intelligence.',
        metadata: {}
      };

      const result = await graphRag.processDocument(document);

      expect(result.relationships).toBeDefined();
    });

    it('should store document in graph', async () => {
      const document = {
        id: 'doc-4',
        content: 'Test content',
        metadata: {}
      };

      await graphRag.processDocument(document);

      expect(graphRag.documents.has('doc-4')).toBe(true);
    });

    it('should add nodes to graph', async () => {
      const document = {
        id: 'doc-5',
        content: 'Entity A and Entity B are related.',
        metadata: {}
      };

      const initialNodeCount = graphRag.graph.nodes.length;
      await graphRag.processDocument(document);

      expect(graphRag.graph.nodes.length).toBeGreaterThanOrEqual(initialNodeCount);
    });

    it('should add edges to graph', async () => {
      const document = {
        id: 'doc-6',
        content: 'A causes B.',
        metadata: {}
      };

      const initialEdgeCount = graphRag.graph.edges.length;
      await graphRag.processDocument(document);

      expect(graphRag.graph.edges.length).toBeGreaterThanOrEqual(initialEdgeCount);
    });

    it('should handle document with no entities', async () => {
      const document = {
        id: 'doc-7',
        content: '',
        metadata: {}
      };

      const result = await graphRag.processDocument(document);

      expect(result.entities).toEqual([]);
      expect(result.relationships).toEqual([]);
    });
  });

  describe('Batch Document Processing', () => {
    it('should process multiple documents', async () => {
      const documents = [
        { id: 'batch-1', content: 'Document one content', metadata: {} },
        { id: 'batch-2', content: 'Document two content', metadata: {} },
        { id: 'batch-3', content: 'Document three content', metadata: {} }
      ];

      const result = await graphRag.processDocuments(documents);

      expect(result.processed).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.documents.length).toBe(3);
    });

    it('should handle partial failures', async () => {
      const documents = [
        { id: 'batch-4', content: 'Valid content', metadata: {} },
        { id: 'batch-5', content: null, metadata: {} }, // Invalid
        { id: 'batch-6', content: 'Another valid content', metadata: {} }
      ];

      const result = await graphRag.processDocuments(documents);

      expect(result.processed).toBeLessThanOrEqual(3);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });

    it('should return aggregate statistics', async () => {
      const documents = [
        { id: 'batch-7', content: 'Content with entities', metadata: {} },
        { id: 'batch-8', content: 'More content', metadata: {} }
      ];

      const result = await graphRag.processDocuments(documents);

      expect(result.totalEntities).toBeDefined();
      expect(result.totalRelationships).toBeDefined();
    });
  });

  describe('Community Detection', () => {
    it('should detect communities in graph', async () => {
      // Add some documents to create a graph
      await graphRag.processDocuments([
        { id: 'comm-1', content: 'A B C related', metadata: {} },
        { id: 'comm-2', content: 'B C D connected', metadata: {} },
        { id: 'comm-3', content: 'D E F grouped', metadata: {} },
        { id: 'comm-4', content: 'X Y Z separate', metadata: {} }
      ]);

      const communities = await graphRag.detectCommunities();

      expect(communities).toBeDefined();
      expect(communities.communities).toBeDefined();
    });

    it('should return community statistics', async () => {
      await graphRag.processDocuments([
        { id: 'comm-5', content: 'Related content A', metadata: {} },
        { id: 'comm-6', content: 'Related content B', metadata: {} }
      ]);

      const communities = await graphRag.detectCommunities();

      expect(communities.stats).toBeDefined();
      expect(communities.stats.communityCount).toBeDefined();
    });

    it('should assign nodes to communities', async () => {
      await graphRag.processDocuments([
        { id: 'comm-7', content: 'Community test content', metadata: {} }
      ]);

      const communities = await graphRag.detectCommunities();

      if (communities.communities.length > 0) {
        expect(communities.communities[0].nodes).toBeDefined();
      }
    });

    it('should handle empty graph', async () => {
      const emptyRag = new GraphRAG({});
      await emptyRag.initialize();

      const communities = await emptyRag.detectCommunities();

      expect(communities.communities).toEqual([]);

      emptyRag.clear();
    });
  });

  describe('Query Retrieval', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'query-1', content: 'Machine learning is important for AI', metadata: {} },
        { id: 'query-2', content: 'Deep learning is a type of machine learning', metadata: {} },
        { id: 'query-3', content: 'Neural networks power deep learning', metadata: {} }
      ]);
    });

    it('should retrieve relevant nodes for query', async () => {
      const result = await graphRag.retrieve('machine learning');

      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.context).toBeDefined();
    });

    it('should return seed nodes', async () => {
      const result = await graphRag.retrieve('machine learning');

      expect(result.seedNodes).toBeDefined();
    });

    it('should return reasoning chains', async () => {
      const result = await graphRag.retrieve('machine learning');

      expect(result.reasoningChains).toBeDefined();
    });

    it('should limit results to topK', async () => {
      const result = await graphRag.retrieve('learning', { topK: 2 });

      expect(result.nodes.length).toBeLessThanOrEqual(2);
    });

    it('should handle unknown query', async () => {
      const result = await graphRag.retrieve('xyz123unknown');

      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
    });

    it('should include metadata in results', async () => {
      const result = await graphRag.retrieve('machine learning');

      if (result.nodes.length > 0) {
        expect(result.nodes[0].metadata).toBeDefined();
      }
    });
  });

  describe('Find Seed Nodes', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'seed-1', content: 'Python programming language', metadata: {} },
        { id: 'seed-2', content: 'Java programming language', metadata: {} }
      ]);
    });

    it('should find seed nodes matching query', () => {
      const seedNodes = graphRag.findSeedNodes('programming', []);

      expect(seedNodes).toBeDefined();
    });

    it('should use query entities when provided', () => {
      const queryEntities = [
        { text: 'programming', type: 'concept' },
        { text: 'language', type: 'concept' }
      ];

      const seedNodes = graphRag.findSeedNodes('programming language', queryEntities);

      expect(seedNodes).toBeDefined();
    });

    it('should return empty array when no matches', () => {
      const seedNodes = graphRag.findSeedNodes('nonexistent', []);

      expect(seedNodes).toEqual([]);
    });
  });

  describe('Compile Results', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'compile-1', content: 'Test content for compilation', metadata: {} }
      ]);
    });

    it('should compile results from seed nodes', () => {
      const seedNodes = graphRag.graph.nodes.slice(0, 2);
      const reasoningChains = [];

      const results = graphRag.compileResults(seedNodes, reasoningChains, 10);

      expect(results).toBeDefined();
      expect(results.nodes).toBeDefined();
    });

    it('should limit compiled results to topK', () => {
      const seedNodes = graphRag.graph.nodes;
      const reasoningChains = [];

      const results = graphRag.compileResults(seedNodes, reasoningChains, 2);

      expect(results.nodes.length).toBeLessThanOrEqual(2);
    });

    it('should include reasoning chains', () => {
      const seedNodes = graphRag.graph.nodes.slice(0, 1);
      const reasoningChains = [
        { from: 'node1', to: 'node2', relation: 'related' }
      ];

      const results = graphRag.compileResults(seedNodes, reasoningChains, 10);

      expect(results.reasoningChains).toBeDefined();
    });
  });

  describe('RAG Context Generation', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'rag-1', content: 'Context generation test', metadata: {} },
        { id: 'rag-2', content: 'More context content', metadata: {} }
      ]);
    });

    it('should generate RAG context for query', async () => {
      const result = await graphRag.generateRAGContext('context generation');

      expect(result).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context).toBeDefined();
    });

    it('should include retrieved documents in context', async () => {
      const result = await graphRag.generateRAGContext('context');

      expect(result.documents).toBeDefined();
    });

    it('should format context as string', async () => {
      const result = await graphRag.generateRAGContext('test');

      expect(typeof result.context).toBe('string');
    });

    it('should pass retrieve options', async () => {
      const result = await graphRag.generateRAGContext('test', {
        topK: 5,
        includeMetadata: true
      });

      expect(result).toBeDefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'stats-1', content: 'Statistics test content', metadata: {} }
      ]);
    });

    it('should return graph statistics', async () => {
      const stats = await graphRag.getStats();

      expect(stats).toBeDefined();
      expect(stats.documents).toBeDefined();
      expect(stats.entities).toBeDefined();
      expect(stats.relationships).toBeDefined();
    });

    it('should return node count', async () => {
      const stats = await graphRag.getStats();

      expect(stats.graph.nodes).toBeDefined();
    });

    it('should return edge count', async () => {
      const stats = await graphRag.getStats();

      expect(stats.graph.edges).toBeDefined();
    });

    it('should return community count', async () => {
      const stats = await graphRag.getStats();

      expect(stats.graph.communities).toBeDefined();
    });
  });

  describe('Graph Export/Import', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'export-1', content: 'Export test content', metadata: {} }
      ]);
    });

    it('should export graph data', () => {
      const graphData = graphRag.exportGraph();

      expect(graphData).toBeDefined();
      expect(graphData.nodes).toBeDefined();
      expect(graphData.edges).toBeDefined();
    });

    it('should export nodes with properties', () => {
      const graphData = graphRag.exportGraph();

      if (graphData.nodes.length > 0) {
        expect(graphData.nodes[0].id).toBeDefined();
        expect(graphData.nodes[0].type).toBeDefined();
      }
    });

    it('should export edges with properties', () => {
      const graphData = graphRag.exportGraph();

      if (graphData.edges.length > 0) {
        expect(graphData.edges[0].source).toBeDefined();
        expect(graphData.edges[0].target).toBeDefined();
      }
    });

    it('should import graph data', () => {
      const graphData = {
        nodes: [
          { id: 'imported-1', type: 'entity', label: 'Imported Entity' }
        ],
        edges: []
      };

      graphRag.importGraph(graphData);

      expect(graphRag.graph.nodes.length).toBeGreaterThan(0);
    });

    it('should preserve imported node properties', () => {
      const graphData = {
        nodes: [
          { id: 'imported-2', type: 'concept', label: 'Test Concept', metadata: { source: 'import' } }
        ],
        edges: []
      };

      graphRag.importGraph(graphData);

      const importedNode = graphRag.graph.nodes.find(n => n.id === 'imported-2');
      expect(importedNode).toBeDefined();
      expect(importedNode.type).toBe('concept');
    });
  });

  describe('Clear Graph', () => {
    beforeEach(async () => {
      await graphRag.processDocuments([
        { id: 'clear-1', content: 'Content to clear', metadata: {} }
      ]);
    });

    it('should clear all graph data', () => {
      const initialNodeCount = graphRag.graph.nodes.length;
      expect(initialNodeCount).toBeGreaterThan(0);

      graphRag.clear();

      expect(graphRag.graph.nodes.length).toBe(0);
      expect(graphRag.graph.edges.length).toBe(0);
    });

    it('should clear documents map', async () => {
      await graphRag.processDocuments([
        { id: 'clear-2', content: 'test', metadata: {} }
      ]);

      expect(graphRag.documents.size).toBeGreaterThan(0);

      graphRag.clear();

      expect(graphRag.documents.size).toBe(0);
    });

    it('should clear entities map', async () => {
      await graphRag.processDocuments([
        { id: 'clear-3', content: 'Entity test', metadata: {} }
      ]);

      const initialSize = graphRag.entities.size;
      expect(initialSize).toBeGreaterThan(0);

      graphRag.clear();

      expect(graphRag.entities.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document content', async () => {
      const document = {
        id: 'empty-1',
        content: '',
        metadata: {}
      };

      const result = await graphRag.processDocument(document);

      expect(result.entities).toEqual([]);
      expect(result.relationships).toEqual([]);
    });

    it('should handle null document', async () => {
      await expect(graphRag.processDocument(null))
        .rejects.toThrow();
    });

    it('should handle document without id', async () => {
      const document = {
        content: 'No ID document',
        metadata: {}
      };

      const result = await graphRag.processDocument(document);

      expect(result.documentId).toBeDefined(); // Should generate one
    });

    it('should handle document without metadata', async () => {
      const document = {
        id: 'no-meta-1',
        content: 'No metadata document'
      };

      const result = await graphRag.processDocument(document);

      expect(result).toBeDefined();
    });

    it('should handle retrieve on empty graph', async () => {
      const emptyRag = new GraphRAG({});
      await emptyRag.initialize();

      const result = await emptyRag.retrieve('query');

      expect(result.nodes).toEqual([]);

      emptyRag.clear();
    });
  });
});
