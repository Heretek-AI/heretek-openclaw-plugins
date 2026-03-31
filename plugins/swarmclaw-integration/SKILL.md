# SwarmClaw Integration Skill

**Package:** `@heretek-ai/swarmclaw-integration-plugin`  
**Version:** 1.0.0  
**Type:** Multi-Provider LLM Integration with Automatic Failover

## Purpose

Provides resilient multi-provider LLM access for Heretek OpenClaw agents with automatic failover from OpenAI → Anthropic → Google → Ollama (Local). Ensures continuous operation even when individual providers experience outages.

## Capabilities

- **Multi-Provider Support:** OpenAI, Anthropic, Google Gemini, Ollama (local)
- **Automatic Failover:** Seamless provider switching on failure
- **Health Monitoring:** Continuous provider health checks
- **Provider Statistics:** Request counts, latency tracking, success rates
- **Event-Driven:** Real-time events for failover, recovery, and status changes

## Installation

```bash
cd plugins/swarmclaw-integration
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure your provider credentials:

```bash
# Provider failover order
SWARMCLAW_FAILOVER_ORDER=openai,anthropic,google,ollama

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODELS=gpt-4o,gpt-4-turbo,gpt-3.5-turbo

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODELS=claude-sonnet-4-20250514,claude-3-5-sonnet-20241022

# Google
GOOGLE_API_KEY=your-api-key
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GOOGLE_MODELS=gemini-2.0-flash,gemini-1.5-pro

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODELS=llama3.1,qwen2.5,mistral

# Health Check Settings
HEALTH_CHECK_INTERVAL=30000
REQUEST_TIMEOUT=30000
FAILURE_THRESHOLD=3
SUCCESS_THRESHOLD=2
```

## Usage

### Basic Chat with Failover

```javascript
import { createPlugin } from '@heretek-ai/swarmclaw-integration-plugin';

// Initialize plugin
const plugin = await createPlugin();

// Send chat message with automatic failover
const response = await plugin.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello, how are you?' }
], {
  temperature: 0.7,
  maxTokens: 1024
});

console.log(`Response from ${response.provider}: ${response.content}`);
```

### Generate Embeddings with Failover

```javascript
const embedding = await plugin.embed('This text will be embedded', {
  model: 'text-embedding-3-small'
});

console.log(`Embedding vector length: ${embedding.embedding.length}`);
```

### Event Handling

```javascript
// Listen for provider selection
plugin.on('providerSelected', (event) => {
  console.log(`Using provider: ${event.provider}`);
});

// Listen for failover events
plugin.on('failoverTriggered', (event) => {
  console.warn(`Failover from ${event.fromProvider} to ${event.nextProvider}`);
});

// Listen for provider recovery
plugin.on('providerRecovered', (event) => {
  console.log(`Provider ${event.provider} recovered: ${event.status}`);
});

// Listen for all providers failing
plugin.on('allProvidersFailed', (event) => {
  console.error(`All providers failed. Attempted: ${event.attemptedProviders}`);
});
```

### Health Monitoring

```javascript
// Get status of all providers
const status = plugin.getStatus();
console.log(status);

// Get health of specific provider
const health = plugin.getProviderHealth('openai');
console.log(health);

// Get provider statistics
const stats = plugin.getStats();
console.log(stats);
```

### Manual Provider Management

```javascript
// Mark provider as healthy (override health check)
plugin.markProviderHealthy('openai');

// Mark provider as unhealthy
plugin.markProviderUnhealthy('anthropic', new Error('Rate limited'));

// Remove a provider
plugin.removeProvider('google');

// Add a custom provider
import { ProviderConfig } from '@heretek-ai/swarmclaw-integration-plugin';

const customProvider = new ProviderConfig({
  type: 'custom',
  name: 'Custom LLM',
  baseUrl: 'https://custom-llm.example.com',
  apiKey: process.env.CUSTOM_API_KEY,
  models: ['custom-model-v1'],
  chatEndpoint: '/v1/chat/completions'
});

plugin.addProvider(customProvider);

// Change failover order
plugin.setFailoverOrder(['ollama', 'openai', 'anthropic']);
```

## API Reference

### Class: SwarmClawPlugin

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `failoverOrder` | string[] | `['openai', 'anthropic', 'google', 'ollama']` | Provider failover order |
| `maxRetries` | number | 2 | Max retries per provider |
| `retryDelay` | number | 1000 | Initial retry delay (ms) |
| `backoffMultiplier` | number | 2 | Exponential backoff multiplier |
| `healthCheckInterval` | number | 30000 | Health check interval (ms) |
| `failureThreshold` | number | 3 | Failures before marking unhealthy |
| `successThreshold` | number | 2 | Successes before marking healthy |

#### Methods

##### `initialize(options)`

Initialize the plugin and start health monitoring.

```javascript
await plugin.initialize({ startHealthMonitoring: true });
```

##### `chat(messages, options)`

Send a chat message with automatic failover.

```javascript
const response = await plugin.chat([
  { role: 'user', content: 'Hello' }
], {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1024,
  timeout: 30000
});
```

**Returns:** `{ content, role, usage, model, provider }`

##### `embed(text, options)`

Generate embeddings with automatic failover.

```javascript
const result = await plugin.embed('Text to embed', {
  model: 'text-embedding-3-small'
});
```

**Returns:** `{ embedding, usage, model, provider }`

##### `getStatus()`

Get plugin status and health information.

```javascript
const status = plugin.getStatus();
// { name, version, initialized, providers, failoverOrder, healthStatuses, stats }
```

##### `getProviderHealth(providerType)`

Get health status for a specific provider.

```javascript
const health = plugin.getProviderHealth('openai');
// { provider, status, lastCheck, consecutiveFailures, consecutiveSuccesses }
```

##### `getStats(providerType)`

Get provider statistics.

```javascript
const stats = plugin.getStats('openai');
// { totalRequests, successfulRequests, failedRequests, totalLatency, lastUsed }
```

##### `markProviderHealthy(providerType)`

Manually mark a provider as healthy.

##### `markProviderUnhealthy(providerType, error)`

Manually mark a provider as unhealthy.

##### `addProvider(provider)`

Add a new provider configuration.

##### `removeProvider(providerType)`

Remove a provider.

##### `setFailoverOrder(newOrder)`

Update the failover order.

##### `getFailoverOrder()`

Get current failover order.

##### `shutdown()`

Shutdown the plugin and stop health monitoring.

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `initialized` | `{ providerCount, failoverOrder }` | Plugin initialized |
| `providerRegistered` | `{ type, name, configured }` | Provider registered |
| `providerSelected` | `{ provider, attempt, attemptedProviders, success?, latency? }` | Provider selected for request |
| `providerFailed` | `{ provider, error, retryCount, maxRetries }` | Provider request failed |
| `failoverTriggered` | `{ fromProvider, reason, nextProvider }` | Failover to next provider |
| `allProvidersFailed` | `{ attemptedProviders, lastError }` | All providers failed |
| `providerRecovered` | `{ provider, status }` | Provider recovered from unhealthy |
| `shutdown` | - | Plugin shutdown |

### Provider Types

```javascript
import { ProviderType } from '@heretek-ai/swarmclaw-integration-plugin';

ProviderType.OPENAI;      // 'openai'
ProviderType.ANTHROPIC;   // 'anthropic'
ProviderType.GOOGLE;      // 'google'
ProviderType.OLLAMA;      // 'ollama'
```

### Health Status

```javascript
import { HealthStatus } from '@heretek-ai/swarmclaw-integration-plugin';

HealthStatus.HEALTHY;    // 'healthy'
HealthStatus.UNHEALTHY;  // 'unhealthy'
HealthStatus.DEGRADED;   // 'degraded'
HealthStatus.UNKNOWN;    // 'unknown'
```

## Integration with OpenClaw Gateway

To integrate with the OpenClaw Gateway, configure the plugin in your Gateway configuration:

```javascript
// In your agent workspace configuration
{
  "plugins": [
    {
      "name": "swarmclaw-integration",
      "path": "./plugins/swarmclaw-integration",
      "config": {
        "failoverOrder": ["openai", "anthropic", "google", "ollama"],
        "healthCheckInterval": 30000
      }
    }
  ]
}
```

## LiteLLM Integration

This plugin can work alongside LiteLLM for additional routing flexibility:

```yaml
# litellm_config.yaml
model_list:
  - model_name: "fallback-chain"
    litellm_params:
      model: "swarmclaw/openai"
    fallbacks:
      - swarmclaw/anthropic
      - swarmclaw/google
      - swarmclaw/ollama
```

## Troubleshooting

### All providers failing

1. Check API keys are valid
2. Verify network connectivity
3. Check provider status pages
4. Review logs for specific error messages

### High latency

1. Check provider health status
2. Consider adjusting failover order
3. Review timeout settings
4. Check network connectivity

### Provider marked unhealthy

1. Check consecutive failure count
2. Review health check logs
3. Manually mark healthy if false positive
4. Adjust failure threshold if needed

## License

MIT

## Repository

https://github.com/heretek-ai/heretek-openclaw/tree/main/plugins/swarmclaw-integration
