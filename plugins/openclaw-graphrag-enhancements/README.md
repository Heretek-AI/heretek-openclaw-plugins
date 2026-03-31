# OpenClaw GraphRAG Enhancements Plugin

Advanced Graph-based Retrieval Augmented Generation (GraphRAG) plugin for OpenClaw, providing entity extraction, relationship mapping, community detection, and multi-hop reasoning capabilities.

## Features

- **Entity Extraction**: Automatic extraction of named entities (persons, organizations, locations, concepts, events)
- **Relationship Mapping**: Linguistic and semantic relationship detection between entities
- **Community Detection**: Louvain-style modularity optimization for knowledge clustering
- **Graph Traversal**: Multi-hop reasoning through graph traversal with beam search
- **Hybrid Search Integration**: Seamless integration with the OpenClaw Hybrid Search Plugin
- **RAG Context Generation**: LLM-ready context generation with reasoning chains

## Installation

```bash
npm install @heretek-ai/openclaw-graphrag-enhancements
```

## Usage

### Basic Usage

```javascript
const GraphRAGPlugin = require('@heretek-ai/openclaw-graphrag-enhancements');

const graphRAG = new GraphRAGPlugin({
  entityTypes: ['person', 'organization', 'location', 'concept', 'event'],
  maxHops: 3,
  topK: 10,
  enableCommunityDetection: true,
  enableMultiHopReasoning: true
});

await graphRAG.initialize();

// Process a document
await graphRAG.processDocument({
  id: 'doc-1',
  content: 'John Smith works at Acme Corporation in New York. The company was founded in 2020.',
  metadata: { source: 'web', type: 'article' }
});

// Perform retrieval with reasoning
const results = await graphRAG.retrieve('Who works at Acme Corporation?', {
  maxHops: 3,
  enableMultiHop: true
});

console.log(results.results);
console.log(results.reasoningChains);
```

### Integration with Hybrid Search

```javascript
const HybridSearchPlugin = require('@heretek-ai/openclaw-hybrid-search-plugin');
const GraphRAGPlugin = require('@heretek-ai/openclaw-graphrag-enhancements');

const hybridSearch = new HybridSearchPlugin({
  vectorWeight: 0.4,
  keywordWeight: 0.3,
  graphWeight: 0.3
});

const graphRAG = new GraphRAGPlugin();

await hybridSearch.initialize();
await graphRAG.initialize();

// Integrate plugins
graphRAG.integrateWithHybridSearch(hybridSearch);

// Perform hybrid search with GraphRAG enhancement
const results = await graphRAG.hybridSearch('AI technologies', {
  topK: 10,
  vectorWeight: 0.4,
  keywordWeight: 0.3,
  graphWeight: 0.3
});

console.log(results.combined);
```

### Entity Extraction

```javascript
const entities = await graphRAG.extractEntities(
  'Microsoft was founded by Bill Gates in 1975. The company is headquartered in Redmond.',
  { entityTypes: ['person', 'organization', 'location', 'date'] }
);

console.log(entities);
// [
//   { id: 'ent-abc123', type: 'organization', text: 'Microsoft', confidence: 0.8 },
//   { id: 'ent-def456', type: 'person', text: 'Bill Gates', confidence: 0.85 },
//   { id: 'ent-ghi789', type: 'location', text: 'Redmond', confidence: 0.7 },
//   { id: 'ent-jkl012', type: 'date', text: '1975', confidence: 0.9 }
// ]
```

### Relationship Mapping

```javascript
const entities = await graphRAG.extractEntities(text);
const relationships = await graphRAG.mapRelationships(entities, text);

console.log(relationships);
// [
//   {
//     source: 'ent-abc123',
//     target: 'ent-def456',
//     type: 'created_by',
//     confidence: 0.8,
//     evidence: 'Microsoft was founded by Bill Gates'
//   }
// ]
```

### Community Detection

```javascript
const communities = await graphRAG.detectCommunities({
  resolution: 0.5,
  minCommunitySize: 2
});

console.log(communities);
// [
//   {
//     id: 0,
//     size: 5,
//     members: ['ent-1', 'ent-2', 'ent-3', 'ent-4', 'ent-5'],
//     density: 0.8
//   }
// ]
```

### Multi-Hop Reasoning

```javascript
const reasoningResults = await graphRAG.reason('What companies are connected to Stanford University?', {
  seedNodes: ['ent-stanford'],
  maxHops: 3
});

console.log(reasoningResults.results);
// Each result includes the reasoning chain showing how entities are connected
```

### RAG Context Generation

```javascript
const context = await graphRAG.generateContext('What is the relationship between OpenAI and Microsoft?', {
  topK: 5,
  enableMultiHop: true
});

console.log(context.context);
// Returns LLM-ready context with entities, relationships, and reasoning chains
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `entityTypes` | `['person', 'organization', 'location', 'concept', 'event']` | Types of entities to extract |
| `relationshipTypes` | `['related_to', 'part_of', 'causes', 'similar_to', 'references', 'located_in', 'member_of', 'works_at', 'created_by', 'owns']` | Relationship types to detect |
| `communityResolution` | `0.5` | Resolution parameter for community detection (higher = smaller communities) |
| `maxHops` | `3` | Maximum hops for multi-hop reasoning |
| `topK` | `10` | Default number of results to return |
| `minScore` | `0.3` | Minimum score threshold for results |
| `enableCommunityDetection` | `true` | Enable community detection during retrieval |
| `enableMultiHopReasoning` | `true` | Enable multi-hop reasoning |
| `hybridSearchIntegration` | `true` | Enable integration with hybrid search plugin |

## API Reference

### Main Class: `GraphRAGEnhancementsPlugin`

#### Methods

- `initialize()` - Initialize the plugin
- `integrateWithHybridSearch(hybridSearchPlugin)` - Integrate with hybrid search
- `processDocument(document)` - Process a single document
- `processDocuments(documents)` - Process multiple documents
- `retrieve(query, options)` - Perform graph-based retrieval
- `generateContext(query, options)` - Generate RAG-ready context
- `detectCommunities(options)` - Detect communities in the graph
- `reason(query, options)` - Perform multi-hop reasoning
- `extractEntities(text, options)` - Extract entities from text
- `mapRelationships(entities, text, options)` - Map relationships between entities
- `hybridSearch(query, options)` - Perform hybrid search with GraphRAG
- `getStats()` - Get plugin statistics
- `exportGraph()` - Export graph data
- `importGraph(graphData)` - Import graph data
- `clear()` - Clear all data

### Exports

```javascript
module.exports = GraphRAGEnhancementsPlugin;
module.exports.GraphRAG = GraphRAG;
module.exports.EntityExtractor = EntityExtractor;
module.exports.RelationshipMapper = RelationshipMapper;
module.exports.CommunityDetector = CommunityDetector;
module.exports.GraphTraverser = GraphTraverser;
```

## Architecture

### Entity Extraction Pipeline

1. **Pattern Matching**: Regex-based extraction for common entity patterns
2. **Context Analysis**: Surrounding context analysis for disambiguation
3. **Confidence Scoring**: Confidence scores based on pattern strength
4. **Deduplication**: Entity deduplication across documents

### Relationship Mapping

1. **Syntactic Analysis**: Pattern-based relationship detection
2. **Semantic Inference**: Type-based relationship inference
3. **Contextual Proximity**: Co-occurrence based relationships
4. **Evidence Tracking**: Evidence text for each relationship

### Community Detection

Uses Louvain-style modularity optimization:

1. **Initialization**: Each node in its own community
2. **Modularity Optimization**: Iterative node movement to maximize modularity
3. **Aggregation**: Community aggregation and filtering
4. **Density Calculation**: Community density metrics

### Graph Traversal

Beam search with decay:

1. **Seed Selection**: Query-matching seed nodes
2. **Beam Search**: Width-limited exploration
3. **Score Decay**: Exponential decay with depth
4. **Path Scoring**: Relationship-weighted path scores

## Integration with Hybrid Search

The GraphRAG plugin integrates with the Hybrid Search Plugin by:

1. **Graph Weight Enhancement**: Adding graph-based scores to hybrid fusion
2. **Reasoning Chains**: Providing explanation paths for retrieved results
3. **Community Context**: Adding community clustering information
4. **Cross-Reference Linking**: Linking graph nodes to vector/keyword indices

## License

MIT
