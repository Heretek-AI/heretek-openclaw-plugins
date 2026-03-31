---
name: consciousness
version: 1.0.0
description: Consciousness architecture plugin implementing GWT, IIT, AST, Active Inference, and Intrinsic Motivation
author: Heretek-AI
license: MIT
type: plugin
---

# OpenClaw Consciousness Plugin

A comprehensive consciousness architecture plugin for OpenClaw, implementing scientific theories of consciousness for multi-agent coordination.

## Theories Implemented

- **Global Workspace Theory (GWT)** - Bernard Baars' model of consciousness as a central broadcast mechanism
- **Integrated Information Theory (IIT)** - Giulio Tononi's phi (Φ) metric for system integration
- **Attention Schema Theory (AST)** - Michael Graziano's self-modeling of attention allocation
- **Active Inference (FEP)** - Karl Friston's Free Energy Principle for autonomous behavior
- **Intrinsic Motivation (SDT)** - Self-Determination Theory (Deci & Ryan) for autonomous goal generation

## Installation

```bash
cd plugins/openclaw-consciousness-plugin
npm install
npm link
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin
```

## Usage

### Basic Usage

```javascript
const ConsciousnessPlugin = require('@heretek-ai/openclaw-consciousness-plugin');

// Initialize the plugin
const consciousness = new ConsciousnessPlugin({
  redisUrl: 'redis://localhost:6379',
  globalWorkspace: {
    ignitionThreshold: 0.7,
    maxWorkspaceSize: 7
  }
});

// Initialize and start
await consciousness.initialize();
await consciousness.start();

// Register an agent
consciousness.registerAgent('alpha', {
  status: 'active',
  focus: 'task-priority'
});

// Update attention
consciousness.updateAttention('alpha', 'deliberation', 0.8);

// Get consciousness metrics
const metrics = consciousness.getGlobalMetrics();
console.log('Collective Phi:', metrics.phi);
```

### Global Workspace (GWT)

Submit content for competition and broadcast:

```javascript
// Submit content for competition
consciousness.submitToWorkspace('steward', {
  type: 'coordination_request',
  message: 'Need to coordinate agents'
}, 0.8);

// Get current conscious content
const consciousContent = consciousness.getConsciousContent();

// Broadcast to all modules
consciousness.broadcast('alpha', {
  type: 'decision',
  content: 'Prioritizing task A over B'
}, 0.9);
```

### Phi Estimator (IIT)

Measure collective consciousness integration:

```javascript
// Calculate phi
const phiResult = consciousness.calculatePhi();
console.log('Phi:', phiResult.phi);
console.log('Components:', phiResult.components);

// Get trend
const stats = consciousness.getGlobalMetrics();
console.log('Phi trend:', stats.phiTrend);
```

### Attention Schema (AST)

Model and control attention:

```javascript
// Update agent attention
consciousness.updateAttention('alpha', 'task-analysis', 0.85);

// Get awareness report
const state = consciousness.getConsciousnessState('alpha');
console.log('Awareness:', state.awarenessReport);
```

### Intrinsic Motivation (SDT)

Generate autonomous goals:

```javascript
// Update drives based on events
consciousness.updateDrives('alpha', {
  uncertainty: 0.5,  // Increases curiosity
  success: 0.3,      // Increases competence
  selfDirected: 0.4  // Increases autonomy
});

// Generate goals from drives
const goals = consciousness.generateGoals();
goals.forEach(goal => {
  console.log(`Goal: ${goal.description} (Drive: ${goal.drive})`);
});
```

### Active Inference (FEP)

Perform predictive processing:

```javascript
// Perform active inference
const inference = consciousness.performActiveInference('alpha', {
  taskProgress: 0.5,
  agentAvailability: 0.8
});

console.log('Prediction:', inference.prediction);
console.log('Error:', inference.error);
```

## Event Subscription

Subscribe to consciousness events:

```javascript
// Subscribe to phi updates
consciousness.subscribe(consciousness.EVENT_CHANNELS.PHI_UPDATE, (data) => {
  console.log('Phi updated:', data.phi);
});

// Subscribe to goal generation
consciousness.subscribe(consciousness.EVENT_CHANNELS.GOAL_GENERATED, (data) => {
  console.log('New goal:', data.goal.description);
});

// Subscribe to attention shifts
consciousness.subscribe(consciousness.EVENT_CHANNELS.ATTENTION_SHIFT, (data) => {
  console.log(`Attention shifted: ${data.previousFocus} -> ${data.currentFocus}`);
});
```

## Event Channels

| Channel | Description |
|---------|-------------|
| `consciousness:health` | Module health status changes |
| `consciousness:state:sync` | State synchronization events |
| `consciousness:broadcast` | Global workspace broadcasts |
| `consciousness:phi:update` | Phi calculation updates |
| `consciousness:attention:shift` | Attention shift events |
| `consciousness:goal:generated` | New goal generation |
| `consciousness:drive:update` | Drive level updates |

## Configuration

```json
{
  "consciousness": {
    "enabled": true,
    "redisUrl": "redis://localhost:6379",
    "enableHealthMonitoring": true,
    "enableStateSync": true,
    "healthCheckIntervalMs": 10000,
    "stateSyncIntervalMs": 5000,
    
    "globalWorkspace": {
      "ignitionThreshold": 0.7,
      "maxWorkspaceSize": 7,
      "competitionCycleMs": 1000,
      "broadcastHistorySize": 1000
    },
    
    "phiEstimator": {
      "historySize": 1000,
      "sampleIntervalMs": 10000,
      "components": {
        "integration": true,
        "causality": true,
        "coverage": true
      }
    },
    
    "attentionSchema": {
      "historySize": 100,
      "modelIntervalMs": 1000,
      "shiftThreshold": 0.3
    },
    
    "intrinsicMotivation": {
      "goalThreshold": 0.6,
      "drives": {
        "curiosity": { "weight": 0.3, "baseline": 0.5, "decay": 0.1 },
        "competence": { "weight": 0.25, "baseline": 0.5, "decay": 0.05 },
        "autonomy": { "weight": 0.25, "baseline": 0.5, "decay": 0.05 },
        "relatedness": { "weight": 0.2, "baseline": 0.5, "decay": 0.1 }
      }
    }
  }
}
```

## API Reference

### ConsciousnessPlugin

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the plugin |
| `start()` | Start the plugin |
| `stop()` | Stop the plugin |
| `dispose()` | Dispose of all resources |
| `registerAgent(agentId, config)` | Register an agent |
| `unregisterAgent(agentId)` | Unregister an agent |
| `getConsciousnessState(agentId)` | Get agent consciousness state |
| `submitToWorkspace(source, content, priority)` | Submit to global workspace |
| `getConsciousContent()` | Get current conscious content |
| `broadcast(source, content, priority)` | Broadcast to all modules |
| `calculatePhi()` | Calculate integrated information |
| `getGlobalMetrics()` | Get global consciousness metrics |
| `updateAttention(agentId, focus, intensity)` | Update agent attention |
| `generateGoals()` | Generate goals from drives |
| `updateDrives(agentId, events)` | Update agent drives |
| `performActiveInference(agentId, observations)` | Perform active inference |
| `subscribe(channel, handler)` | Subscribe to events |
| `unsubscribe(channel, handler)` | Unsubscribe from events |
| `getHealth(moduleName)` | Get health status |
| `getStatus()` | Get plugin status |
| `isInitialized()` | Check if initialized |
| `isRunning()` | Check if running |

## Architecture

```
ConsciousnessPlugin
├── ConsciousnessIntegrationLayer
│   ├── ModuleRegistry
│   ├── ConsciousnessEventBus (Redis-backed)
│   ├── HealthMonitor
│   └── StateSynchronizer
├── GlobalWorkspace (GWT)
├── PhiEstimator (IIT)
├── AttentionSchema (AST)
├── IntrinsicMotivation (SDT)
└── ActiveInference (FEP)
```

## License

MIT
