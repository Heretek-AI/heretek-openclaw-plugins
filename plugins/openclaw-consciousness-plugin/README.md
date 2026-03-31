# @heretek-ai/openclaw-consciousness-plugin

Consciousness architecture plugin for OpenClaw, implementing theories of consciousness for multi-agent coordination.

## Theories Implemented

- **Global Workspace Theory (GWT)** - Bernard Baars' model of consciousness as a central broadcast mechanism
- **Integrated Information Theory (IIT)** - Giulio Tononi's phi (Φ) metric for system integration
- **Attention Schema Theory (AST)** - Michael Graziano's self-modeling of attention allocation
- **Active Inference** - Karl Friston's Free Energy Principle for autonomous behavior
- **Intrinsic Motivation** - Self-Determination Theory (Deci & Ryan) for autonomous goal generation

## Installation

```bash
cd plugins/openclaw-consciousness-plugin
npm install
npm link
openclaw plugins install @heretek-ai/openclaw-consciousness-plugin
```

## Usage

```javascript
const ConsciousnessPlugin = require('@heretek-ai/openclaw-consciousness-plugin');

// Initialize the plugin
const consciousness = new ConsciousnessPlugin({
  redisUrl: 'redis://localhost:6379',
  globalWorkspace: {
    ignitionThreshold: 0.7,
    maxWorkspaceSize: 7
  },
  phiEstimator: {
    sampleIntervalMs: 10000
  }
});

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

## API

### Global Workspace
- `submit(moduleId, content, priority)` - Submit content for competition
- `broadcast(source, content, priority)` - Broadcast to all modules
- `getWorkspaceContents()` - Get current conscious content
- `getHistory(limit)` - Get broadcast history

### Phi Estimator
- `estimatePhi()` - Calculate integrated information
- `getTrend(windowSize)` - Get phi trend over time
- `getStats()` - Get estimation statistics

### Attention Schema
- `modelAttention(focus, intensity)` - Model attention state
- `getAwarenessReport()` - Get awareness report
- `controlAttention(goalFocus)` - Control attention allocation

### Intrinsic Motivation
- `updateDrives(events)` - Update drive levels
- `generateGoals()` - Generate goals from drives
- `getDriveLevels()` - Get current drive levels

### Active Inference
- `predict()` - Generate predictions
- `activeInference(goalState)` - Plan actions to minimize prediction error
- `perceptualInference(observations)` - Update beliefs from observations

## Architecture

```
ConsciousnessIntegrationLayer
├── GlobalWorkspace (GWT) - Broadcast mechanism
├── PhiEstimator (IIT) - Integration metrics
├── AttentionSchema (AST) - Self-modeling
├── IntrinsicMotivation - Goal generation
├── ActiveInference (FEP) - Autonomous behavior
└── Event Bus - Inter-module communication
```

## Configuration

See `config/default.json` for default configuration options.

## License

MIT
