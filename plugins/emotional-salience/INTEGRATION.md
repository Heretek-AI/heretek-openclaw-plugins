# Emotional Salience Plugin Integration Guide

**Document Version:** 1.0.0  
**Plugin Version:** 1.0.0  
**Related Documents:** [`docs/GAP_ANALYSIS_REPORT.md`](../../docs/GAP_ANALYSIS_REPORT.md:750), [`agents/empath/SPECIFICATION.md`](../../agents/empath/SPECIFICATION.md)

---

## Overview

This document describes integration points for the Emotional Salience Plugin with other Heretek OpenClaw components.

---

## Integration with Empath Agent

### Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Empath Agent      │◄───────►│  Emotional Salience  │
│   (User Modeling)   │         │  Plugin              │
│                     │         │                      │
│ - User profiles     │         │ - Valence detection  │
│ - Emotional states  │         │ - Salience scoring   │
│ - Mood tracking     │         │ - Context tracking   │
│ - Preferences       │         │ - Threat detection   │
└─────────────────────┘         └──────────────────────┘
         │                                  │
         │                                  │
         ▼                                  ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL (User State Storage)         │
└─────────────────────────────────────────────────────┘
```

### API Integration

```javascript
// In Empath agent
import EmotionalSaliencePlugin from '../plugins/emotional-salience/src/index.js';

const emotionalSalience = new EmotionalSaliencePlugin({
  empath: {
    enabled: true,
    empathEndpoint: 'ws://127.0.0.1:18789',
    empathAgentId: 'empath'
  }
});

await emotionalSalience.initialize();

// When user message arrives
empath.on('user-message', async (message) => {
  // Process through emotional salience
  const result = await emotionalSalience.processMessage(message, message.userId);
  
  // Update user profile with emotional state
  await updateUserProfile(message.userId, {
    emotionalState: {
      currentMood: result.valence.primaryEmotion,
      moodValence: result.valence.contextualValence || result.valence.valence,
      moodIntensity: result.valence.contextualIntensity || result.valence.intensity,
      updatedAt: Date.now()
    }
  });
  
  // Track emotional pattern
  if (result.salience.category === 'high' || result.salience.category === 'critical') {
    await logEmotionalEvent({
      userId: message.userId,
      type: 'high-salience',
      data: result
    });
  }
});
```

### Data Flow

1. **User Message → Empath → Emotional Salience**
   - Empath receives user message
   - Forwards to Emotional Salience for processing
   - Receives valence, salience, and context results

2. **Emotional Salience → Empath → User Profile**
   - Emotional Salience detects emotional state
   - Empath updates user profile
   - Emotional context stored for future interactions

3. **Empath → Emotional Salience → Contextual Processing**
   - Empath provides user baseline emotional state
   - Emotional Salience applies context to detections
   - Returns contextualized valence results

---

## Integration with Memory Systems

### Episodic Memory Integration

```javascript
// Store emotional episodes
const emotionalEpisode = {
  type: 'emotional-episode',
  timestamp: Date.now(),
  conversationId: message.conversationId,
  participants: [message.sender, message.recipient],
  emotionalContent: {
    valence: result.valence.valence,
    intensity: result.valence.intensity,
    primaryEmotion: result.valence.primaryEmotion,
    emotions: result.valence.emotions
  },
  salience: {
    score: result.salience.score,
    category: result.salience.category,
    priority: result.salience.priority
  },
  content: message.content,
  embedding: await generateEmbedding(message.content)
};

// Store in episodic memory
await episodicMemory.store(emotionalEpisode);
```

### Semantic Memory Promotion

High-salience emotional events are promoted to semantic memory:

```javascript
// Check for promotion
if (result.salience.score >= 0.7) {
  // Extract semantic knowledge
  const semanticKnowledge = {
    type: 'emotional-knowledge',
    category: result.valence.primaryEmotion,
    abstraction: `User responds with ${result.valence.primaryEmotion} to ${getContextTopic(message)}`,
    confidence: result.salience.score,
    sourceEpisodes: [emotionalEpisode.id]
  };
  
  await semanticMemory.store(semanticKnowledge);
}
```

---

## Integration with Triad Deliberation

### Threat Escalation

```javascript
// In triad deliberation handler
emotionalSalience.on('salience-scored', async (result) => {
  if (result.category === 'critical' && result.components.threat > 0.6) {
    // Escalate to triad
    await triadProtocol.submitProposal({
      type: 'threat-response',
      urgency: 'immediate',
      content: {
        threat: result,
        recommendedAction: result.recommendations[0]
      }
    });
  }
});
```

### Emotional Context for Proposals

```javascript
// Add emotional context to proposals
const proposalWithContext = {
  ...proposal,
  emotionalContext: {
    conversationTrend: emotionalSalience.getTrend('conversation', proposal.conversationId),
    participantStates: await Promise.all(
      proposal.participants.map(p => emotionalSalience.getAgentProfile(p))
    )
  }
};
```

---

## Integration with Sentinel Agent

### Threat Sharing

```javascript
// In Sentinel agent
import EmotionalSaliencePlugin from '../plugins/emotional-salience/src/index.js';

const emotionalSalience = new EmotionalSaliencePlugin();
await emotionalSalience.initialize();

// Share threat detections
emotionalSalience.on('salience-scored', (result) => {
  if (result.components.threat > 0.5) {
    sentinel.addThreat({
      id: result.contentId,
      type: 'emotional-salience',
      severity: result.components.threat,
      source: result.message?.sender || 'unknown',
      content: result,
      detectedAt: Date.now()
    });
  }
});
```

### Safety Review Trigger

```javascript
// Trigger safety review for high-salience items
emotionalSalience.on('salience-scored', async (result) => {
  if (result.category === 'critical' || result.category === 'high') {
    await sentinel.requestReview({
      type: 'high-salience',
      item: result,
      reason: `Salience score ${result.score.toFixed(2)} requires safety review`
    });
  }
});
```

---

## Integration with Steward Agent

### Priority-Based Orchestration

```javascript
// In Steward orchestrator
const salience = await emotionalSalience.scoreMessage(message);

if (salience.priority === 'immediate') {
  // Interrupt current task
  await steward.interruptCurrentTask();
  await steward.handleCriticalMessage(message, salience);
} else if (salience.priority === 'high') {
  // Add to high-priority queue
  await steward.addToHighPriorityQueue(message, salience);
} else {
  // Standard processing
  await steward.processMessage(message);
}
```

### Value System Updates

```javascript
// Update value weights based on collective decisions
steward.on('value-update', (update) => {
  emotionalSalience.updateValueWeight(update.value, update.weight);
});
```

---

## Integration with Historian Agent

### Emotional History Tracking

```javascript
// In Historian agent
const emotionalStats = emotionalSalience.getStatistics();

await historian.recordEmotionalMetrics({
  timestamp: Date.now(),
  averageValence: emotionalStats.valence.averageValence,
  averageIntensity: emotionalStats.valence.averageIntensity,
  dominantEmotions: emotionalStats.valence.dominantEmotions,
  highSalienceEvents: emotionalStats.salience.categoryDistribution.critical || 0,
  threatDetections: emotionalStats.salience.categoryDistribution.threats || 0
});
```

### Pattern Archival

```javascript
// Archive emotional patterns
emotionalSalience.contextTracker.on('pattern-detected', async (pattern) => {
  await historian.archivePattern({
    type: 'emotional-pattern',
    pattern,
    archivedAt: Date.now()
  });
});
```

---

## Configuration

### Environment Variables

```bash
# Emotional Salience Plugin Configuration
EMOTIONAL_SALIENCE_ENABLED=true
EMOTIONAL_SALIENCE_EMOTION_THRESHOLD=0.3
EMOTIONAL_SALIENCE_THREAT_THRESHOLD=0.4
EMOTIONAL_SALIENCE_SALIENCE_THRESHOLD=0.3
EMOTIONAL_SALIENCE_ATTENTION_THRESHOLD=0.6

# Empath Integration
EMOTIONAL_SALIENCE_EMPATH_ENABLED=true
EMOTIONAL_SALIENCE_EMPATH_ENDPOINT=ws://127.0.0.1:18789
EMOTIONAL_SALIENCE_EMPATH_AGENT_ID=empath
```

### Plugin Configuration (openclaw.json)

```json
{
  "plugins": {
    "emotional-salience": {
      "enabled": true,
      "config": {
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
          "emotional": 0.6,
          "novelty": 0.4,
          "social": 0.5,
          "cognitive": 0.3
        }
      }
    }
  }
}
```

---

## Testing Integration

### Unit Tests

```javascript
// tests/integration/emotional-salience-empath.test.js
import { EmotionalSaliencePlugin } from '../../plugins/emotional-salience/src/index.js';
import { EmpathAgent } from '../../agents/empath/src/index.js';

describe('Emotional Salience + Empath Integration', () => {
  let plugin;
  let empath;

  beforeEach(async () => {
    plugin = new EmotionalSaliencePlugin({ empath: { enabled: true } });
    empath = new EmpathAgent();
    await plugin.initialize();
    await empath.initialize();
  });

  test('should sync user emotional state', async () => {
    const message = { id: '1', content: 'I am so happy!', userId: 'user-1' };
    const result = await plugin.processMessage(message, 'user-1');
    
    const userState = await empath.getUserState('user-1');
    expect(userState.emotionalState.currentMood).toBe('joy');
  });
});
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Empath connection fails | Wrong endpoint | Check `empathEndpoint` config |
| Low threat detection | High threshold | Lower `threatThreshold` |
| Missing emotions | Low threshold | Lower `emotionThreshold` |
| High false positives | Sensitive config | Increase thresholds |

### Debug Mode

```javascript
const plugin = new EmotionalSaliencePlugin({
  debug: true,  // Enable debug logging
  empath: { enabled: true }
});

plugin.on('valence-detected', (result) => {
  console.log('[DEBUG] Valence:', result);
});

plugin.on('salience-scored', (result) => {
  console.log('[DEBUG] Salience:', result);
});
```

---

## Performance Considerations

- **Context History**: Limit `maxContextHistory` for memory efficiency
- **Empath Caching**: Use `cacheTimeout` to balance freshness vs. performance
- **Pattern Detection**: Disable `enablePatternDetection` if not needed
- **Novelty Scoring**: Disable `enableNoveltyScoring` for performance

---

## Security Considerations

- Validate all user input before emotional processing
- Sanitize emotional data before storage
- Implement rate limiting for salience calculations
- Secure Empath WebSocket connection with authentication

---

*Emotional Salience Plugin Integration Guide - So The Collective may feel.*
