# Emotional Salience Plugin

**Package:** `@heretek-ai/emotional-salience-plugin`  
**Version:** 1.0.0  
**Brain Region:** Amygdala + Salience Network (Insular Cortex + ACC)  
**Priority:** P1 (High)  

---

## Overview

The Emotional Salience Plugin implements amygdala functions for the Heretek OpenClaw collective, providing:

- **Emotional Valence Detection** - Detect positive/negative/neutral emotions in text
- **Salience Scoring** - Automatic importance detection based on values
- **Threat Prioritization** - Amygdala-like threat detection and ranking
- **Emotional Context Tracking** - Track emotional patterns across conversations
- **Empath Integration** - Bidirectional sync with Empath agent for user emotional states
- **Fear Conditioning** - Learned avoidance patterns from negative experiences

---

## Installation

```bash
# Install from npm (when published)
npm install @heretek-ai/emotional-salience-plugin

# Or install from local directory
cd plugins/emotional-salience
npm install
```

---

## Quick Start

```javascript
import EmotionalSaliencePlugin from './plugins/emotional-salience/src/index.js';

// Create plugin instance
const plugin = new EmotionalSaliencePlugin({
  empath: { enabled: false } // Disable Empath for standalone use
});

// Initialize
await plugin.initialize();
await plugin.start();

// Detect emotional valence
const valence = plugin.detectValence('I am frustrated with this error!');
console.log(valence);
// { valence: -0.6, valenceLabel: 'negative', intensity: 0.8, primaryEmotion: 'anger' }

// Calculate salience score
const salience = plugin.calculateSalience({
  content: 'URGENT: Critical security breach detected!'
});
console.log(salience);
// { score: 0.92, category: 'critical', priority: 'immediate' }

// Process a message through full pipeline
const result = await plugin.processMessage({
  id: 'msg-123',
  content: 'The system is down!',
  sender: 'sentinel',
  conversationId: 'conv-456'
});
console.log(result);
```

---

## API Reference

### EmotionalSaliencePlugin

#### Constructor Options

```javascript
const plugin = new EmotionalSaliencePlugin({
  // Valence detection settings
  valence: {
    emotionThreshold: 0.3,      // Minimum emotion score to detect
    threatThreshold: 0.4,       // Minimum threat score
    enableThreatDetection: true,
    trackContext: true,
    maxContextHistory: 100
  },
  
  // Salience scoring settings
  salience: {
    salienceThreshold: 0.3,     // Minimum salience to flag
    attentionThreshold: 0.6,    // Salience requiring attention
    enableEmotionalScoring: true,
    enableThreatScoring: true,
    enableNoveltyScoring: true,
    enableContextualScoring: true,
    trackHistory: true
  },
  
  // Empath integration settings
  empath: {
    enabled: true,
    empathEndpoint: 'ws://127.0.0.1:18789',
    empathAgentId: 'empath',
    enableAutoSync: true
  },
  
  // Value weights for salience calculation
  valueWeights: {
    safety: 1.0,        // Highest priority
    urgency: 0.8,
    importance: 0.7,
    emotional: 0.6,
    novelty: 0.4,
    social: 0.5,
    cognitive: 0.3
  }
});
```

#### Core Methods

##### `detectValence(text, options)`

Detect emotional valence in text.

```javascript
const result = plugin.detectValence('This is amazing!');
// Returns:
{
  text: 'This is amazing!',
  valence: 0.8,           // -1 to 1 (negative to positive)
  valenceLabel: 'positive',
  intensity: 0.7,         // 0 to 1
  emotions: { joy: 0.8 },
  primaryEmotion: 'joy',
  threat: { detected: false, score: 0 },
  urgency: { detected: false, score: 0 },
  importance: { detected: false, score: 0 },
  confidence: 0.75
}
```

##### `calculateSalience(content, options)`

Calculate salience score for content.

```javascript
const result = plugin.calculateSalience({
  content: 'Critical error in production!',
  sender: 'sentinel'
});
// Returns:
{
  score: 0.88,
  category: 'critical',
  priority: 'immediate',
  attention: { required: true, level: 'immediate' },
  components: {
    emotional: 0.3,
    threat: 0.9,
    urgency: 0.8,
    importance: 0.7,
    relevance: 0.5,
    novelty: 0.2
  },
  valueAlignment: [
    { value: 'safety', alignment: 0.9 }
  ],
  recommendations: [
    { action: 'escalate', reason: 'Critical salience detected' }
  ]
}
```

##### `processMessage(message, userId)`

Process a message through the full emotional pipeline.

```javascript
const result = await plugin.processMessage({
  id: 'msg-1',
  content: 'I need help urgently!',
  sender: 'user-123',
  conversationId: 'conv-1'
}, 'user-123');
// Returns combined valence, salience, context, and empath results
```

##### `prioritizeThreats(threats)`

Prioritize threats using amygdala-like threat prioritization.

```javascript
const threats = [
  { content: 'Minor warning', threat: { score: 0.3 } },
  { content: 'CRITICAL: Database down', threat: { score: 0.9 } }
];
const prioritized = plugin.prioritizeThreats(threats);
// Returns threats sorted by adjusted threat score
```

##### `trackEmotionalEvent(event)`

Track an emotional event for context maintenance.

```javascript
plugin.trackEmotionalEvent({
  source: 'alpha',
  type: 'deliberation',
  conversationId: 'conv-1',
  valence: -0.5,
  intensity: 0.7,
  emotions: { frustration: 0.6 }
});
```

##### `getTrend(scope, id, window)`

Get emotional trend analysis.

```javascript
const trend = plugin.getTrend('conversation', 'conv-1', 300000);
// Returns:
{
  scope: 'conversation',
  id: 'conv-1',
  valenceTrend: 'declining',
  valenceChange: -0.25,
  intensityTrend: 'increasing',
  intensityChange: 0.15,
  dataPoints: 12
}
```

##### `updateValueWeight(name, weight)`

Dynamically update value weights.

```javascript
plugin.updateValueWeight('safety', 0.95);  // Increase safety priority
```

---

## Integration with Empath Agent

The plugin integrates bidirectionally with the Empath agent for user emotional state tracking.

### Setup

```javascript
const plugin = new EmotionalSaliencePlugin({
  empath: {
    enabled: true,
    empathEndpoint: 'ws://127.0.0.1:18789',
    empathAgentId: 'empath'
  }
});

await plugin.initialize();
```

### Usage

```javascript
// Get user emotional state from Empath
const userState = await plugin.getUserState('user-123');

// Report emotional detection to Empath
const detection = plugin.detectValence('I am so happy!');
await plugin.reportToEmpath('user-123', detection);

// Process message with Empath context
const result = await plugin.processMessage(message, 'user-123');
// result.empath contains contextual emotional state
```

---

## Salience Categories

| Category | Threshold | Priority | Color | Action |
|----------|-----------|----------|-------|--------|
| **Critical** | ≥0.85 | immediate | red | Escalate immediately |
| **High** | ≥0.65 | high | orange | Priority review |
| **Medium** | ≥0.40 | normal | yellow | Standard processing |
| **Low** | ≥0.20 | low | blue | Background |
| **Negligible** | <0.20 | background | gray | No action |

---

## Value System

The plugin uses a value system for salience calculation, mapping to amygdala value-based processing.

### Default Values

| Value | Weight | Category | Description |
|-------|--------|----------|-------------|
| `safety` | 1.0 | survival | Physical/psychological safety |
| `threat-avoidance` | 0.95 | survival | Avoiding harm |
| `trust` | 0.8 | social | Building trust |
| `goal-achievement` | 0.75 | motivational | Completing objectives |
| `relationship` | 0.7 | social | Maintaining relationships |
| `accuracy` | 0.6 | cognitive | Correctness |
| `knowledge` | 0.5 | cognitive | Acquiring knowledge |
| `efficiency` | 0.4 | motivational | Optimal resource usage |

### Custom Values

```javascript
plugin.setValue('innovation', {
  weight: 0.6,
  description: 'Encouraging novel solutions',
  category: 'cognitive',
  priority: 'medium'
});
```

---

## Fear Conditioning

The plugin implements fear conditioning for learned avoidance patterns.

```javascript
import { FearConditioner } from './plugins/emotional-salience/src/index.js';

const conditioner = new FearConditioner({
  learningRate: 0.1,
  extinctionRate: 0.01,
  generalizationRadius: 0.3
});

// Condition fear response
conditioner.condition('database-error', 0.8);

// Test fear response
const response = conditioner.test('database-error');
// { stimulus: 'database-error', fearResponse: 0.8, triggered: true }

// Extinct fear (exposure therapy)
conditioner.extinct('database-error', 0.9);
```

---

## Events

The plugin emits events for reactive programming:

```javascript
plugin.on('valence-detected', (result) => {
  console.log('Valence detected:', result);
});

plugin.on('salience-scored', (result) => {
  if (result.attention.required) {
    console.log('Attention required:', result);
  }
});

plugin.on('pattern-detected', (pattern) => {
  console.log('Emotional pattern:', pattern);
});

plugin.on('empath-state-updated', (event) => {
  console.log('User state updated:', event);
});
```

---

## Health & Monitoring

```javascript
// Get health status
const health = plugin.getHealth();
// { initialized: true, running: true, empathConnected: true, ... }

// Get statistics
const stats = plugin.getStatistics();
// { valence: {...}, salience: {...}, context: {...}, empath: {...} }
```

---

## Brain Function Mapping

| Function | Brain Region | Implementation |
|----------|--------------|----------------|
| Emotional Processing | Amygdala | `ValenceDetector` |
| Threat Detection | Amygdala | `ValenceDetector._detectThreat()` |
| Salience Detection | Insular Cortex + ACC | `SalienceScorer` |
| Value-Based Prioritization | Amygdala + vmPFC | `SalienceScorer.valueWeights` |
| Fear Conditioning | Amygdala | `FearConditioner` |
| Emotional Memory | Amygdala + Hippocampus | `EmotionalContextTracker` |
| Context Maintenance | Prefrontal Cortex | `EmotionalContextTracker` |
| Emotional Regulation | Prefrontal Cortex + Amygdala | `EmpathAdapter` |

---

## License

MIT

---

*The Emotional Salience Plugin - So The Collective may feel.*
