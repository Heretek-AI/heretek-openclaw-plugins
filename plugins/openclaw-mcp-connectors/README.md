# OpenClaw MCP Connectors Plugin

Model Context Protocol (MCP) connectors for external service integration with comprehensive API management.

## Features

- **MCP Client**: Full Model Context Protocol implementation
- **API Authentication**: Support for Bearer, Basic, API Key, HMAC, and OAuth2
- **Response Caching**: LRU cache with TTL and stale-while-revalidate
- **Rate Limiting**: Token bucket algorithm with per-server configuration
- **API Abstraction**: Unified interface for external APIs

## Installation

```bash
npm install @heretek-ai/openclaw-mcp-connectors
```

## Usage

### Basic Connection

```javascript
const MCPConnectors = require('@heretek-ai/openclaw-mcp-connectors');

const connectors = new MCPConnectors();
await connectors.initialize();

// Connect to MCP server
await connectors.connect('my-server', {
  transportType: 'stdio',
  command: '/path/to/server',
  capabilities: ['resources', 'tools', 'prompts']
});

// Make API request
const response = await connectors.request('my-server', '/api/data', {
  method: 'GET',
  params: { filter: 'active' }
});
```

### Authentication Configuration

```javascript
// Bearer token
await connectors.configureAuth('api-server', {
  type: 'bearer',
  token: 'your-access-token',
  expiresIn: 3600,
  refreshToken: 'your-refresh-token'
});

// API Key
await connectors.configureAuth('api-server', {
  type: 'apikey',
  apiKey: 'your-api-key',
  headerName: 'X-API-Key'
});

// HMAC
await connectors.configureAuth('api-server', {
  type: 'hmac',
  apiKey: 'your-api-key',
  secret: 'your-secret',
  algorithm: 'HmacSHA256'
});
```

### API Abstraction

```javascript
// Register an API
await connectors.registerAPI('weather-api', {
  baseUrl: 'https://api.weather.com',
  authentication: { type: 'apikey', apiKey: 'xxx' },
  operations: {
    getCurrent: {
      method: 'GET',
      path: '/v1/current/{location}',
      cacheable: true,
      cacheTTL: 300000
    },
    getForecast: {
      method: 'GET',
      path: '/v1/forecast/{location}',
      params: {
        days: { type: 'number', required: false }
      }
    }
  }
});

// Call registered API
const weather = await connectors.callAPI('weather-api', 'getCurrent', {
  location: 'london'
});
```

### Rate Limiting Configuration

```javascript
connectors.rateLimiter.configure('api-server', {
  rateLimit: 10, // requests per second
  burstSize: 20
});
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `defaultTimeout` | 30000 | Default request timeout (ms) |
| `maxRetries` | 3 | Maximum retry attempts |
| `enableCache` | true | Enable response caching |
| `enableRateLimiting` | true | Enable rate limiting |

## API Reference

### `connect(serverId, config)`
Connect to an MCP server.

### `disconnect(serverId)`
Disconnect from an MCP server.

### `request(serverId, endpoint, options)`
Make an API request through MCP.

### `registerAPI(apiId, definition)`
Register a custom API abstraction.

### `callAPI(apiId, operation, params)`
Call a registered API operation.

### `configureAuth(serverId, authConfig)`
Configure authentication for a server.

### `clearCache(serverId)`
Clear cached responses.

### `getStats()`
Get plugin statistics.

## License

MIT
