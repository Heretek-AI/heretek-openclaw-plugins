# SwarmClaw Integration Plugin

**Version:** 1.0.0  
**License:** MIT  
**Status:** Production Ready

Multi-provider LLM integration plugin for Heretek OpenClaw with automatic failover, health monitoring, and provider statistics.

## Features

- **Multi-Provider Support:** OpenAI, Anthropic, Google Gemini, Ollama (local)
- **Automatic Failover:** Seamless provider switching on failure (OpenAI → Anthropic → Google → Ollama)
- **Health Monitoring:** Continuous provider health checks with configurable thresholds
- **Provider Statistics:** Request counts, latency tracking, success rates
- **Event-Driven:** Real-time events for failover, recovery, and status changes
- **TypeScript Support:** Full type definitions included

## Quick Start

### 1. Install Dependencies

```bash
cd plugins/swarmclaw-integration
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Initialize Plugin

```javascript
import { createPlugin } from '@heretek-ai/swarmclaw-integration-plugin';

const plugin = await createPlugin({
  failoverOrder: ['openai', 'anthropic', 'google', 'ollama'],
  healthCheckInterval: 30000
});

// Send a chat message
const response = await plugin.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(`Response from ${response.provider}: ${response.content}`);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SwarmClaw Plugin                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Failover Manager                       │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ OpenAI  │→│Anthropic│→│ Google  │→│ Ollama  │    │    │
│  │  │ (P0)    │  │ (P1)    │  │ (P2)    │  │ (P3)    │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│     ┌────────────────┐ ┌────────────┐ ┌──────────────┐         │
│     │ Provider Config│ │Health Check│ │  Statistics  │         │
│     │                │ │  Manager   │ │   Tracker    │         │
│     └────────────────┘ └────────────┘ └──────────────┘         │
│                                                                  │
│  Events: providerSelected, providerFailed, failoverTriggered    │
│          allProvidersFailed, providerRecovered                  │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SWARMCLAW_FAILOVER_ORDER` | Comma-separated provider order | `openai,anthropic,google,ollama` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_BASE_URL` | OpenAI base URL | `https://api.openai.com/v1` |
| `OPENAI_MODELS` | Comma-separated models | `gpt-4o,gpt-4-turbo,gpt-3.5-turbo` |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `ANTHROPIC_BASE_URL` | Anthropic base URL | `https://api.anthropic.com` |
| `ANTHROPIC_MODELS` | Comma-separated models | `claude-sonnet-4-20250514,...` |
| `GOOGLE_API_KEY` | Google API key | - |
| `GOOGLE_BASE_URL` | Google base URL | `https://generativelanguage.googleapis.com/v1beta` |
| `GOOGLE_MODELS` | Comma-separated models | `gemini-2.0-flash,gemini-1.5-pro` |
| `OLLAMA_BASE_URL` | Ollama base URL | `http://localhost:11434` |
| `OLLAMA_MODELS` | Comma-separated models | `llama3.1,qwen2.5,mistral` |
| `HEALTH_CHECK_INTERVAL` | Health check interval (ms) | `30000` |
| `FAILURE_THRESHOLD` | Failures before unhealthy | `3` |
| `SUCCESS_THRESHOLD` | Successes before healthy | `2` |

### Constructor Options

```javascript
const plugin = new SwarmClawPlugin({
  // Provider failover order
  failoverOrder: ['openai', 'anthropic', 'google', 'ollama'],
  
  // Retry configuration
  maxRetries: 2,           // Max retries per provider
  retryDelay: 1000,        // Initial retry delay (ms)
  backoffMultiplier: 2,    // Exponential backoff multiplier
  
  // Health check configuration
  healthCheckInterval: 30000,  // Health check interval (ms)
  failureThreshold: 3,         // Failures before unhealthy
  successThreshold: 2,         // Successes before healthy
});
```

## API

### Chat

```javascript
const response = await plugin.chat([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hello!' }
], {
  model: 'gpt-4o',        // Optional: specific model
  temperature: 0.7,       // Optional: temperature
  maxTokens: 1024,        // Optional: max tokens
  timeout: 30000          // Optional: timeout (ms)
});

// Response format
{
  content: "Hello! How can I help you?",
  role: "assistant",
  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  model: "gpt-4o",
  provider: "openai"
}
```

### Embeddings

```javascript
const result = await plugin.embed('Text to embed', {
  model: 'text-embedding-3-small'
});

// Response format
{
  embedding: [0.1, 0.2, ...],  // Embedding vector
  usage: { promptTokens: 5, totalTokens: 5 },
  model: "text-embedding-3-small",
  provider: "openai"
}
```

### Health Monitoring

```javascript
// Get all provider statuses
const status = plugin.getStatus();
console.log(status);

// Get specific provider health
const health = plugin.getProviderHealth('openai');
console.log(health);
// { provider: 'openai', status: 'healthy', lastCheck: {...}, ... }

// Get statistics
const stats = plugin.getStats('openai');
console.log(stats);
// { totalRequests: 100, successfulRequests: 98, failedRequests: 2, ... }
```

### Events

```javascript
// Provider selected for request
plugin.on('providerSelected', (event) => {
  console.log(`Provider: ${event.provider}, Attempt: ${event.attempt}`);
});

// Provider failed
plugin.on('providerFailed', (event) => {
  console.warn(`Provider ${event.provider} failed: ${event.error}`);
});

// Failover triggered
plugin.on('failoverTriggered', (event) => {
  console.warn(`Failover: ${event.fromProvider} → ${event.nextProvider}`);
});

// All providers failed
plugin.on('allProvidersFailed', (event) => {
  console.error(`All providers failed. Tried: ${event.attemptedProviders}`);
});

// Provider recovered
plugin.on('providerRecovered', (event) => {
  console.log(`Provider ${event.provider} recovered: ${event.status}`);
});
```

## Provider Support Matrix

| Provider | Chat | Embeddings | Health Check | Auth Type |
|----------|------|------------|--------------|-----------|
| OpenAI | ✅ | ✅ | ✅ | Bearer Token |
| Anthropic | ✅ | ❌ | ✅ | API Key Header |
| Google | ✅ | ✅ | ✅ | Query Param |
| Ollama | ✅ | ✅ | ✅ | None |

## Failover Logic

```
Request → Check Provider Health
    │
    ├─→ Healthy? → Send Request
    │       │
    │       ├─→ Success → Return Result
    │       │
    │       └─→ Failure → Retry (maxRetries)
    │               │
    │               └─→ Still Failing → Mark Unhealthy → Next Provider
    │
    └─→ Unhealthy? → Skip → Next Provider
```

### Failover Order

Default order: **OpenAI → Anthropic → Google → Ollama**

1. **OpenAI** (Priority 0): Primary provider, GPT-4o, GPT-4 Turbo
2. **Anthropic** (Priority 1): Secondary, Claude Sonnet, Claude Opus
3. **Google** (Priority 2): Tertiary, Gemini 2.0, Gemini 1.5
4. **Ollama** (Priority 3): Local fallback, Llama 3.1, Qwen 2.5

## Testing

```bash
# Run tests
npm test

# Run health check
npm run healthcheck

# Lint
npm run lint
```

## Integration Examples

### With OpenClaw Gateway

```javascript
// In your agent workspace
import { createPlugin } from '@heretek-ai/swarmclaw-integration-plugin';

const swarmclaw = await createPlugin();

// Use in agent message handler
async function handleUserMessage(message) {
  try {
    const response = await swarmclaw.chat([
      { role: 'user', content: message }
    ]);
    return response.content;
  } catch (error) {
    console.error('All providers failed:', error);
    throw error;
  }
}
```

### With LiteLLM

```yaml
# litellm_config.yaml
model_list:
  - model_name: "responsible-llm"
    litellm_params:
      model: "openai/gpt-4o"
    fallbacks:
      - anthropic/claude-sonnet-4-20250514
      - gemini/gemini-2.0-flash
      - ollama/llama3.1
```

## Troubleshooting

### Common Issues

**All providers failing:**
- Verify API keys are correct
- Check network connectivity
- Review provider status pages
- Check rate limits

**High latency:**
- Monitor provider health status
- Consider adjusting failover order
- Review timeout settings

**Provider marked unhealthy:**
- Check consecutive failure count
- Review health check logs
- Manually mark healthy if needed: `plugin.markProviderHealthy('openai')`

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## Support

- Documentation: [`SKILL.md`](SKILL.md)
- Issues: https://github.com/heretek-ai/heretek-openclaw/issues
- Heretek OpenClaw: https://github.com/heretek-ai/heretek-openclaw
