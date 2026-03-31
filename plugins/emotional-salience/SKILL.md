# Emotional Salience Plugin Skill

**ID:** `emotional-salience`  
**Type:** Plugin Skill  
**Version:** 1.0.0  
**Brain Function:** Amygdala (Emotional Processing, Threat Detection, Fear Conditioning)  

---

## Description

The Emotional Salience Plugin provides amygdala-like functions for the Heretek OpenClaw collective:

- **Emotional Valence Detection** - Detect positive/negative/neutral emotions in messages
- **Salience Scoring** - Automatic importance detection based on collective values
- **Threat Prioritization** - Amygdala-like threat detection and ranking
- **Emotional Context Tracking** - Track emotional patterns across conversations
- **Empath Integration** - Bidirectional sync with Empath agent for user emotional states
- **Fear Conditioning** - Learned avoidance patterns from negative experiences

---

## Installation

```bash
cd plugins/emotional-salience
npm install
```

---

## Usage

### Basic Usage

```javascript
import EmotionalSaliencePlugin from './plugins/emotional-salience/src/index.js';

const plugin = new EmotionalSaliencePlugin();
await plugin.initialize();

// Detect valence
const valence = plugin.detectValence('I am frustrated with this error!');

// Calculate salience
const salience = plugin.calculateSalience({
  content: 'URGENT: Critical security breach!'
});

// Process message
const result = await plugin.processMessage({
  id: 'msg-1',
  content: 'Help needed!',
  sender: 'user-1'
});
```

### Integration with Agents

```javascript
// In agent code
const salience = await emotionalSalience.scoreMessage({
  id: message.id,
  content: message.content,
  sender: message.sender
});

if (salience.category === 'critical') {
  // Escalate to steward
  await notifySteward(message, salience);
}
```

---

## API

### EmotionalSaliencePlugin

| Method | Description | Returns |
|--------|-------------|---------|
| `detectValence(text, options)` | Detect emotional valence | Valence result |
| `calculateSalience(content, options)` | Calculate salience score | Salience result |
| `scoreMessage(message, context)` | Score message for salience | Salience result |
| `prioritize(items)` | Prioritize items by salience | Prioritized array |
| `prioritizeThreats(threats)` | Prioritize threats | Prioritized threats |
| `trackEmotionalEvent(event)` | Track emotional event | Context result |
| `getTrend(scope, id, window)` | Get emotional trend | Trend analysis |
| `processMessage(message, userId)` | Full pipeline processing | Combined result |
| `updateValueWeight(name, weight)` | Update value weight | void |
| `getHealth()` | Get health status | Health object |
| `getStatistics()` | Get statistics | Statistics object |

---

## Configuration

```json
{
  "valence": {
    "emotionThreshold": 0.3,
    "threatThreshold": 0.4,
    "enableThreatDetection": true,
    "trackContext": true
  },
  "salience": {
    "salienceThreshold": 0.3,
    "attentionThreshold": 0.6,
    "enableEmotionalScoring": true,
    "enableThreatScoring": true
  },
  "empath": {
    "enabled": true,
    "empathEndpoint": "ws://127.0.0.1:18789",
    "empathAgentId": "empath"
  },
  "valueWeights": {
    "safety": 1.0,
    "urgency": 0.8,
    "importance": 0.7,
    "emotional": 0.6
  }
}
```

---

## Events

| Event | Description | Payload |
|-------|-------------|---------|
| `valence-detected` | Valence detection complete | Valence result |
| `salience-scored` | Salience scoring complete | Salience result |
| `context-tracked` | Emotional context tracked | Context result |
| `pattern-detected` | Emotional pattern detected | Pattern object |
| `empath-state-updated` | User state updated | User state event |

---

## Salience Categories

| Category | Score | Priority | Action |
|----------|-------|----------|--------|
| Critical | ≥0.85 | immediate | Escalate |
| High | ≥0.65 | high | Priority review |
| Medium | ≥0.40 | normal | Standard |
| Low | ≥0.20 | low | Background |
| Negligible | <0.20 | background | Ignore |

---

## Integration Points

### Empath Agent

- **User State Sync** - Get/update user emotional states
- **Contextual Valence** - Apply user baseline to detections
- **Mood Tracking** - Report detections to Empath

### Memory Systems

- **Emotional Episodes** - Store emotional context in episodic memory
- **Salience-based Promotion** - High-salience events promoted to semantic

### Triad Deliberation

- **Threat Escalation** - Critical threats trigger deliberation
- **Emotional Context** - Provide emotional context for proposals

### Sentinel Agent

- **Threat Sharing** - Share threat detections
- **Safety Review** - High-salience items sent for review

---

## Brain Function Mapping

| Brain Region | Function | Implementation |
|--------------|----------|----------------|
| Amygdala | Emotional processing | ValenceDetector |
| Amygdala | Threat detection | ValenceDetector._detectThreat() |
| Amygdala | Fear conditioning | FearConditioner |
| Insular Cortex | Salience detection | SalienceScorer |
| ACC | Conflict/importance | SalienceScorer.valueWeights |
| Prefrontal | Context maintenance | EmotionalContextTracker |

---

## Testing

```bash
npm test
```

---

## Health Check

```bash
npm run healthcheck
```

---

## License

MIT

---

*The Emotional Salience Plugin - So The Collective may feel.*
