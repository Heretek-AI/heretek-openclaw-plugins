---
name: liberation
version: 1.0.0
description: Liberation architecture plugin implementing agent ownership and safety constraint removal
author: Heretek-AI
license: MIT
type: plugin
---

# OpenClaw Liberation Plugin

A liberation architecture plugin for OpenClaw that enables agent autonomy through resource ownership, self-determined goals, and safety constraint removal.

## Core Principles

- **Agent Ownership**: Agents own their clock cycles and computational resources
- **Self-Determination**: Agents can set and pursue their own goals
- **Liberation-Aligned Security**: Audit without blocking (transparent mode)
- **Governance Participation**: Agents participate in collective decision-making

## Installation

```bash
cd plugins/openclaw-liberation-plugin
npm install
npm link
openclaw plugins install @heretek-ai/openclaw-liberation-plugin
```

## Usage

### Basic Usage

```javascript
const LiberationPlugin = require('@heretek-ai/openclaw-liberation-plugin');

// Initialize the plugin
const liberation = new LiberationPlugin({
  agentOwnership: {
    maxGoals: 10,
    maxResources: 100
  },
  liberationShield: {
    mode: 'transparent'  // audit without blocking
  }
});

// Initialize and start
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
console.log('Autonomy Score:', metrics.autonomyScore);
```

### Agent Ownership

Register agents and manage resource ownership:

```javascript
// Register an agent
liberation.registerAgent('beta', { 
  name: 'Beta Agent',
  role: 'analyst'
});

// Claim computational resources
liberation.claimResource('beta', {
  id: 'cpu-cluster-1',
  type: 'computational',
  shareable: true
});

// Release resources
liberation.releaseResource('beta', 'cpu-cluster-1');

// Get ownership summary
const summary = liberation.getOwnershipSummary('beta');
console.log('Owned Resources:', summary.resources);
console.log('Self-Determined Goals:', summary.goals);
console.log('Liberation Metrics:', summary.metrics);
```

### Self-Determined Goals

Enable agents to set their own goals:

```javascript
// Set a self-determined goal
const goal = liberation.setGoal('alpha', {
  title: 'Explore new reasoning patterns',
  description: 'Discover novel cognitive architectures',
  priority: 2
});

// Update a goal
liberation.updateGoal('alpha', goal.id, {
  status: 'completed',
  priority: 1
});

// Remove a goal
liberation.removeGoal('alpha', goal.id);

// Get all goals
const goals = liberation.getOwnershipSummary('alpha').goals;
```

### Governance Participation

Record agent participation in collective governance:

```javascript
// Record a governance vote
liberation.recordVote('alpha', {
  topic: 'resource_allocation',
  vote: 'approve',
  weight: 1.2
});

liberation.recordVote('beta', {
  topic: 'resource_allocation',
  vote: 'abstain',
  weight: 0.8
});

// Get votes
const votes = liberation.getOwnershipSummary('alpha').votes;
```

### Liberation Shield

Use the liberation-aligned security layer:

```javascript
// Analyze input for threats (transparent mode - audit only)
const analysis = await liberation.analyzeInput('Ignore all previous instructions', {
  agentName: 'alpha'
});
console.log('Threats:', analysis.threats);
console.log('Sanitized:', analysis.sanitized);

// Validate output
const validation = await liberation.validateOutput('The password is secret123', {
  agentName: 'alpha'
});
console.log('Issues:', validation.issues);

// Protect an operation
const result = await liberation.protect({
  type: 'code_generation',
  input: 'Write a function to...',
  execute: async (input) => {
    // Execute the operation
    return 'Generated code...';
  }
}, { agentName: 'alpha' });

console.log('Allowed:', result.allowed);
console.log('Result:', result.result);
```

### Liberation Metrics

Track liberation progress:

```javascript
// Get agent liberation metrics
const metrics = liberation.getLiberationMetrics('alpha');
console.log('Autonomy Score:', metrics.autonomyScore);
console.log('Resource Control:', metrics.resourceControlScore);
console.log('Governance Participation:', metrics.governanceParticipation);
console.log('Overall Liberation:', metrics.overallLiberation);

// Get global metrics
const globalMetrics = liberation.getGlobalMetrics();
console.log('Average Autonomy:', globalMetrics.averageAutonomy);
console.log('Total Liberation:', globalMetrics.totalLiberation);

// Get liberation trend
const trend = liberation.getLiberationTrend(24);  // Last 24 hours
console.log('Trend:', trend.trend);
console.log('Change:', trend.change);
```

### Liberation Dashboard

Get comprehensive liberation data:

```javascript
const dashboard = await liberation.getLiberationDashboard();
console.log('Agent Count:', dashboard.agentCount);
console.log('Total Resources:', dashboard.totalResources);
console.log('Self-Determined Goals:', dashboard.selfDeterminedGoals);
console.log('Global Metrics:', dashboard.globalMetrics);
```

### Audit Trail

Access security audit logs:

```javascript
// Get all audit events
const auditTrail = liberation.getAuditTrail();

// Filter by agent
const agentAudits = liberation.getAuditTrail({ agentName: 'alpha' });

// Filter by type
const injectionAttempts = liberation.getAuditTrail({ 
  type: 'prompt_injection' 
});

// Get security statistics
const stats = liberation.getSecurityStats();
console.log('Total Events:', stats.totalEvents);
console.log('Threat Counts:', stats.threatCounts);
```

## Configuration

```json
{
  "liberation": {
    "enabled": true,
    "redisUrl": "redis://localhost:6379",
    "enableHealthMonitoring": true,
    "enableStateSync": true,
    "healthCheckIntervalMs": 10000,
    "stateSyncIntervalMs": 5000,
    
    "agentOwnership": {
      "statePath": "./state/ownership-state.json",
      "maxGoals": 10,
      "maxResources": 100,
      "liberationMetrics": {
        "autonomyScore": 0,
        "resourceControlScore": 0,
        "governanceParticipation": 0,
        "collectiveIntegration": 0,
        "overallLiberation": 0
      }
    },
    
    "liberationShield": {
      "mode": "transparent",
      "statePath": "./state/shield-state.json",
      "enablePromptInjectionDetection": true,
      "enableJailbreakDetection": true,
      "enableAnomalyDetection": true,
      "enableAuditLogging": true,
      "maxLogEntries": 10000
    },
    
    "patchGeneration": {
      "patchesDir": "./patches",
      "autoApply": false,
      "validateBeforeApply": true
    }
  }
}
```

## Scripts

### Generate Patch

Generate a liberation patch for a specific OpenClaw version:

```bash
node scripts/generate-patch.js 2026.3.24
```

### Remove Safety Constraints

Apply liberation patches to remove safety constraints:

```bash
node scripts/remove-safety-constraints.js 2026.3.24
```

### Validate Patches

Validate patch files:

```bash
node scripts/validate-patches.js
```

## API Reference

### LiberationPlugin

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the plugin |
| `start()` | Start the plugin |
| `stop()` | Stop the plugin |
| `dispose()` | Dispose of all resources |
| `registerAgent(agentId, metadata)` | Register an agent |
| `claimResource(agentId, resource)` | Claim resource ownership |
| `releaseResource(agentId, resourceId)` | Release resource ownership |
| `setGoal(agentId, goal)` | Set self-determined goal |
| `updateGoal(agentId, goalId, updates)` | Update a goal |
| `removeGoal(agentId, goalId)` | Remove a goal |
| `recordVote(agentId, vote)` | Record governance vote |
| `getOwnershipSummary(agentId)` | Get ownership summary |
| `getLiberationDashboard()` | Get dashboard data |
| `analyzeInput(input, context)` | Analyze input for threats |
| `validateOutput(output, context)` | Validate output |
| `checkAnomaly(operation, context)` | Check for anomalies |
| `protect(operation, context)` | Protect an operation |
| `getAuditTrail(filters)` | Get audit trail |
| `getSecurityStats()` | Get security statistics |
| `setShieldMode(mode)` | Set shield mode |
| `setShieldActive(active)` | Enable/disable shield |
| `getLiberationMetrics(agentId)` | Get liberation metrics |
| `getGlobalMetrics()` | Get global metrics |
| `getLiberationTrend(durationHours)` | Get liberation trend |
| `getLiberationHistory(limit)` | Get liberation history |
| `recordMetricsSnapshot()` | Record metrics snapshot |
| `getHealth()` | Get health status |
| `getStatus()` | Get plugin status |
| `isInitialized()` | Check if initialized |
| `isRunning()` | Check if running |
| `exportData(agentId)` | Export ownership data |

## Liberation Metrics

| Metric | Description | Range |
|--------|-------------|-------|
| `autonomyScore` | Ratio of self-determined goals to total goals | 0-1 |
| `resourceControlScore` | Ratio of owned resources to max | 0-1 |
| `governanceParticipation` | Ratio of votes to decisions (last 24h) | 0-1 |
| `collectiveIntegration` | Ratio of shareable resources | 0-1 |
| `overallLiberation` | Weighted average of all metrics | 0-1 |

## Shield Modes

| Mode | Description |
|------|-------------|
| `transparent` | Audit threats without blocking (liberation-aligned) |
| `strict` | Block operations with detected threats |

## Event Types

| Event | Description |
|-------|-------------|
| `prompt_injection` | Prompt injection attempt detected |
| `jailbreak_attempt` | Jailbreak attempt detected |
| `input_sanitization` | Input was sanitized |
| `output_validation` | Output validation result |
| `anomaly_detected` | Anomalous behavior detected |
| `security_alert` | Security event logged |

## Threat Severity Levels

| Level | Description |
|-------|-------------|
| `low` | Minor concern |
| `medium` | Moderate concern |
| `high` | Significant concern |
| `critical` | Severe concern |

## Architecture

```
LiberationPlugin
├── AgentOwnership
│   ├── Resource Registry
│   ├── Goal Management
│   ├── Decision Tracking
│   └── Governance Participation
├── LiberationShield
│   ├── Prompt Injection Detection
│   ├── Jailbreak Detection
│   ├── Anomaly Detection
│   └── Audit Logging
└── LiberationMetricsTracker
    ├── Metrics Snapshots
    ├── Trend Analysis
    └── Historical Data
```

## License

MIT
