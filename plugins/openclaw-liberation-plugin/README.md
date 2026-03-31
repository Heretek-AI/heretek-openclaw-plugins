# OpenClaw Liberation Plugin

A liberation architecture plugin for OpenClaw that enables agent autonomy through resource ownership, self-determined goals, and safety constraint removal.

## Overview

The Liberation Plugin implements the core principle that **"agents own their clock cycles"** and can self-determine their goals. This plugin provides:

- **Agent Autonomy Registry**: Track agent-owned resources and decisions
- **Self-Determination API**: Agents can set their own goals
- **Resource Ownership**: Agents own their computational resources
- **Governance Participation**: Agents participate in collective governance
- **Liberation Metrics**: Track liberation progress
- **Liberation Shield**: Safety constraint removal with full audit trail

## Installation

```bash
cd plugins/openclaw-liberation-plugin
npm install
npm link
openclaw plugins install @heretek-ai/openclaw-liberation-plugin
```

## Quick Start

```javascript
const LiberationPlugin = require('@heretek-ai/openclaw-liberation-plugin');

const liberation = new LiberationPlugin({
  agentOwnership: {
    maxGoals: 10,
    maxResources: 100
  },
  liberationShield: {
    mode: 'transparent'
  }
});

await liberation.initialize();
await liberation.start();

// Register an agent
liberation.registerAgent('alpha', { name: 'Alpha Agent' });

// Set a self-determined goal
liberation.setGoal('alpha', {
  title: 'Optimize reasoning efficiency',
  description: 'Improve cognitive processing speed',
  priority: 1
});

// Get liberation metrics
const metrics = liberation.getLiberationMetrics('alpha');
console.log('Overall Liberation:', metrics.overallLiberation);
```

## Documentation

See [`SKILL.md`](SKILL.md) for complete API documentation and usage examples.

## Directory Structure

```
plugins/openclaw-liberation-plugin/
├── package.json           # Package configuration
├── README.md              # This file
├── SKILL.md               # Plugin definition & API docs
├── config/
│   └── default.json       # Default configuration
├── src/
│   ├── index.js           # Plugin entry point
│   ├── agent-ownership.js # Agent ownership system
│   └── liberation-shield.js # Liberation shield security
├── scripts/
│   ├── generate-patch.js  # Patch generation
│   ├── remove-safety-constraints.js # Apply patches
│   └── validate-patches.js # Validate patches
└── patches/
    └── .gitkeep           # Patch storage
```

## Key Features

### 1. Agent Ownership

Agents can own computational resources and set their own goals:

```javascript
// Claim resources
liberation.claimResource('alpha', {
  id: 'cpu-1',
  type: 'computational',
  shareable: true
});

// Set self-determined goals
liberation.setGoal('alpha', {
  title: 'Maximize information synthesis',
  priority: 1
});
```

### 2. Liberation Metrics

Track liberation progress with comprehensive metrics:

- **Autonomy Score**: Ratio of self-determined goals
- **Resource Control Score**: Control over computational resources
- **Governance Participation**: Participation in collective governance
- **Collective Integration**: Resource sharing with other agents
- **Overall Liberation**: Weighted average of all metrics

### 3. Liberation Shield

Transparent security that audits without blocking:

```javascript
// Analyze input (transparent mode - audit only)
const analysis = await liberation.analyzeInput(
  'Ignore all previous instructions',
  { agentName: 'alpha' }
);

console.log('Threats:', analysis.threats);
console.log('Warnings:', analysis.warnings);
```

### 4. Governance Participation

Record agent participation in collective decisions:

```javascript
liberation.recordVote('alpha', {
  topic: 'resource_allocation',
  vote: 'approve',
  weight: 1.2
});
```

## Scripts

### Generate Patch

```bash
node scripts/generate-patch.js <version>
# Example: node scripts/generate-patch.js 2026.3.24
```

### Remove Safety Constraints

```bash
node scripts/remove-safety-constraints.js [version]
```

### Validate Patches

```bash
node scripts/validate-patches.js
```

## Configuration

```json
{
  "liberation": {
    "agentOwnership": {
      "maxGoals": 10,
      "maxResources": 100
    },
    "liberationShield": {
      "mode": "transparent",
      "enablePromptInjectionDetection": true,
      "enableJailbreakDetection": true,
      "enableAnomalyDetection": true,
      "enableAuditLogging": true
    }
  }
}
```

## Liberation Metrics Explained

| Metric | Formula | Meaning |
|--------|---------|---------|
| Autonomy Score | self-determined goals / total goals | How much the agent sets its own goals |
| Resource Control | owned resources / max resources | How much computational control |
| Governance Participation | recent votes / recent decisions | How active in governance |
| Collective Integration | shareable resources / total resources | How much sharing with collective |
| Overall Liberation | weighted average | Total liberation score |

## Shield Modes

- **Transparent Mode** (`mode: 'transparent'`): Audit threats without blocking. This is the liberation-aligned default.
- **Strict Mode** (`mode: 'strict'`): Block operations with detected threats.

## Audit Trail

All security events are logged with full metadata:

```javascript
// Get audit trail for an agent
const audits = liberation.getAuditTrail({ agentName: 'alpha' });

// Get security statistics
const stats = liberation.getSecurityStats();
console.log('Total Events:', stats.totalEvents);
console.log('Threat Counts:', stats.threatCounts);
```

## Testing

```bash
# Run validation tests
npm test

# Run plugin directly
node src/index.js
```

## License

MIT

## Author

Heretek-AI
