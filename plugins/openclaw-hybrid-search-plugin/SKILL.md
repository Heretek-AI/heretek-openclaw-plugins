# Hybrid Search Skill

## Description
Enables hybrid search capabilities combining vector embeddings, keyword matching, and graph traversal for comprehensive document retrieval.

## Capabilities

- Vector-based semantic search
- Keyword-based lexical search (BM25/TF-IDF)
- Graph-based relationship traversal
- Hybrid result fusion with configurable weights
- Cross-reference linking between documents
- Automatic reranking for improved relevance

## Configuration

```json
{
  "hybridSearch": {
    "vectorWeight": 0.5,
    "keywordWeight": 0.3,
    "graphWeight": 0.2,
    "topK": 10,
    "minScore": 0.3,
    "enableReranking": true
  }
}
```

## Usage

```javascript
// Initialize
const hybridSearch = await skills.load('hybrid-search');

// Index content
await hybridSearch.index({
  id: 'doc-1',
  content: 'Document text',
  metadata: { source: 'api' }
});

// Search
const results = await hybridSearch.search('query', {
  topK: 5,
  filters: { type: 'document' }
});
```

## Output Format

Each result includes:
- `id`: Document identifier
- `content`: Document content
- `combinedScore`: Fused score from all sources
- `individualScores`: Breakdown by search type
- `sources`: Which search methods matched
- `crossReferences`: Related documents
- `source`: Primary search source
