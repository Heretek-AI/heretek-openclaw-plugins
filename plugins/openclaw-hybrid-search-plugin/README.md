# OpenClaw Hybrid Search Plugin

Advanced hybrid search plugin combining vector, keyword, and graph-based retrieval for enhanced RAG capabilities.

## Features

- **Vector Search**: Semantic search using embeddings
- **Keyword Search**: Lexical search using BM25/TF-IDF
- **Graph Search**: Relationship-based traversal
- **Hybrid Fusion**: Weighted Reciprocal Rank Fusion (RRF)
- **Cross-Reference Linking**: Automatic document linking
- **Reranking**: Cross-encoder style result refinement

## Installation

```bash
npm install @heretek-ai/openclaw-hybrid-search-plugin
```

## Usage

```javascript
const HybridSearchPlugin = require('@heretek-ai/openclaw-hybrid-search-plugin');

const search = new HybridSearchPlugin({
  vectorWeight: 0.5,
  keywordWeight: 0.3,
  graphWeight: 0.2,
  topK: 10,
  enableReranking: true
});

await search.initialize();

// Index a document
await search.index({
  id: 'doc-1',
  content: 'Document content here',
  metadata: { type: 'article', source: 'web' }
});

// Search
const results = await search.search('query terms', {
  topK: 10,
  filters: { type: 'article' }
});
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `vectorWeight` | 0.5 | Weight for vector search results |
| `keywordWeight` | 0.3 | Weight for keyword search results |
| `graphWeight` | 0.2 | Weight for graph search results |
| `topK` | 10 | Default number of results |
| `minScore` | 0.3 | Minimum score threshold |
| `enableReranking` | true | Enable cross-encoder reranking |

## API

### `search(query, options)`
Perform hybrid search across all retrieval methods.

### `index(document)`
Index a document for hybrid retrieval.

### `bulkIndex(documents)`
Index multiple documents at once.

### `getStats()`
Get search statistics.

### `clear()`
Clear all indices.

## License

MIT
