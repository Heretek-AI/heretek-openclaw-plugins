# Conflict Monitor Plugin

**Package:** `@heretek-ai/conflict-monitor-plugin`  
**Version:** 1.0.0  
**Type:** ACC Brain Function Implementation  
**License:** MIT

## Overview

The Conflict Monitor Plugin implements Anterior Cingulate Cortex (ACC) functions for the Heretek OpenClaw collective. It provides real-time conflict detection, severity scoring, and resolution suggestions for agent proposals and goals.

### Brain Function Mapping

| Brain Region | Function | Implementation |
|--------------|----------|----------------|
| **Anterior Cingulate Cortex (ACC)** | Conflict monitoring | `ConflictDetector` class |
| **ACC** | Error detection | Severity scoring with escalation |
| **ACC** | Cognitive control | Resolution suggestion generation |
| **Prefrontal Cortex** | Decision support | Triad deliberation integration |

## Features

- **Real-time Conflict Detection** - Monitors agent proposals for logical contradictions, goal conflicts, resource contention, value violations, and temporal conflicts
- **Severity Scoring** - Multi-factor assessment with low/medium/high/critical levels
- **Resolution Suggestions** - Strategy-based recommendations (compromise, collaboration, arbitration, etc.)
- **History Tracking** - Complete conflict history with analytics
- **Triad Integration** - Direct integration with triad deliberation protocol

## Installation

```bash
cd plugins/conflict-monitor
npm install
```

## Quick Start

```javascript
import { createPlugin } from '@heretek-ai/conflict-monitor-plugin';

// Initialize plugin
const plugin = await createPlugin({
  triadIntegration: true,
  autoDetectConflicts: true,
  autoGenerateSuggestions: true
});

// Register agents
plugin.registerAgent('alpha', {
  goals: ['Optimize reasoning efficiency'],
  proposals: []
});

// Analyze a proposal
const result = await plugin.analyzeProposal({
  id: 'proposal-1',
  agentId: 'beta',
  content: 'We should prioritize speed over accuracy',
  goals: ['Complete tasks quickly']
});

console.log(`Detected ${result.conflicts.length} conflicts`);
console.log(`Highest severity: ${result.summary.highestSeverity}`);
```

## Conflict Detection

### Conflict Types

| Type | Description | Example |
|------|-------------|---------|
| `logical_contradiction` | Direct logical inconsistency | "Enable X" vs "Disable X" |
| `goal_conflict` | Incompatible objectives | "Maximize speed" vs "Ensure thoroughness" |
| `resource_conflict` | Competition for resources | Two agents needing exclusive CPU access |
| `value_conflict` | Value system violations | "Autonomy" vs "Control" |
| `temporal_conflict` | Scheduling overlaps | Same time slot for two tasks |
| `authority_conflict` | Jurisdiction disputes | Two agents claiming same authority |
| `methodology_conflict` | Approach disagreements | Different implementation strategies |

### Detection Algorithms

The plugin uses multiple detection algorithms:

1. **Negation Detection** - Identifies direct "A" vs "not-A" contradictions
2. **Mutual Exclusivity** - Detects inherently incompatible goals
3. **Pattern Matching** - Matches against known contradiction patterns
4. **Resource Analysis** - Checks for exclusive resource requirements
5. **Value Opposition** - Identifies opposing values in the value system
6. **Temporal Overlap** - Calculates time slot conflicts

## Severity Scoring

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Autonomy Impact | 15% | Impact on agent autonomy |
| Collective Impact | 20% | Impact on collective objectives |
| Agent Count | 10% | Number of agents affected |
| Resource Contention | 15% | Level of resource competition |
| Value Violation | 20% | Severity of value violations |
| Temporal Urgency | 10% | Time sensitivity |
| Escalation Potential | 10% | Risk of conflict escalation |

### Severity Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| `low` | 0.0 - 0.3 | Minor conflicts, log only |
| `medium` | 0.3 - 0.6 | Moderate conflicts, monitor |
| `high` | 0.6 - 0.85 | Serious conflicts, intervention needed |
| `critical` | 0.85 - 1.0 | Emergency, immediate action required |

## Resolution Strategies

| Strategy | Description | Success Rate | Use Case |
|----------|-------------|--------------|----------|
| `compromise` | Find middle ground | 65% | Most conflicts |
| `collaboration` | Win-win solution | 55% | High-trust situations |
| `accommodation` | One party yields | 70% | Low-priority conflicts |
| `competition` | Winner takes all | 50% | Clear merit cases |
| `avoidance` | Delay resolution | 40% | Low-urgency conflicts |
| `split_difference` | Equal division | 60% | Resource conflicts |
| `arbitration` | Third-party decision | 75% | High/critical severity |
| `consensus` | Everyone agrees | 50% | Triad deliberations |
| `reframing` | New perspective | 45% | Value conflicts |
| `resource_expansion` | Expand resources | 65% | Resource scarcity |

## API Reference

### Class: ConflictMonitorPlugin

#### Constructor Options

```javascript
{
  // Detection settings
  sensitivity: 0.7,
  enableLogicalDetection: true,
  enableGoalDetection: true,
  enableResourceDetection: true,
  enableValueDetection: true,
  enableTemporalDetection: true,
  knownContradictions: [],
  valueSystem: [],
  
  // Scoring settings
  factorWeights: {},
  severityThresholds: {},
  contextMultipliers: {},
  criticalEscalationThreshold: 0.85,
  autoEscalate: true,
  agentPriorities: {},
  
  // Resolution settings
  enabledStrategies: [],
  minSuccessRate: 0.3,
  maxSuggestions: 5,
  includeSteps: true,
  useHistoricalData: true,
  
  // Plugin settings
  triadIntegration: true,
  triadMembers: ['alpha', 'beta', 'charlie'],
  autoDetectConflicts: true,
  autoGenerateSuggestions: true,
  notifyOnCritical: true,
  enableAnalytics: true,
  analyticsInterval: 60000,
  maxHistorySize: 1000
}
```

#### Methods

##### `initialize(options)`

Initialize the plugin.

```javascript
await plugin.initialize({
  triadIntegration: true,
  autoGenerateSuggestions: true
});
```

##### `registerAgent(agentId, state)`

Register an agent for monitoring.

```javascript
plugin.registerAgent('alpha', {
  goals: ['Goal 1'],
  proposals: [],
  resources: [],
  values: []
});
```

##### `analyzeProposal(proposal, options)`

Analyze a proposal for conflicts.

```javascript
const result = await plugin.analyzeProposal({
  id: 'proposal-1',
  agentId: 'alpha',
  content: 'Proposal content',
  goals: ['Goal 1', 'Goal 2']
}, {
  context: {
    isTriadDeliberation: true,
    urgency: 'high'
  }
});
```

**Returns:**
```javascript
{
  proposalId: 'proposal-1',
  conflicts: [...],
  severities: [...],
  suggestions: [...],
  summary: {
    totalConflicts: 2,
    severityCounts: { low: 1, high: 1 },
    highestSeverity: 'high',
    requiresAttention: true
  }
}
```

##### `monitorTriadDeliberation(deliberation)`

Monitor triad deliberation for conflicts.

```javascript
const result = await plugin.monitorTriadDeliberation({
  id: 'deliberation-1',
  phase: 'voting',
  participants: ['alpha', 'beta', 'charlie'],
  proposals: [...]
});
```

##### `resolveConflict(conflictId, resolution)`

Mark a conflict as resolved.

```javascript
plugin.resolveConflict('conflict-123', {
  strategy: 'compromise',
  description: 'Both parties agreed to split resources',
  success: true,
  resolvedAt: Date.now()
});
```

##### `getSuggestions(conflictId, options)`

Get resolution suggestions for a conflict.

```javascript
const suggestions = plugin.getSuggestions('conflict-123');
```

##### `getAnalytics()`

Get comprehensive analytics.

```javascript
const analytics = plugin.getAnalytics();
// { conflicts, severity, resolutions, triadStatus }
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `initialized` | `{ name, version, triadIntegration }` | Plugin initialized |
| `conflictDetected` | `ConflictDetectionResult` | New conflict detected |
| `severityAssessed` | `{ conflict, severity }` | Severity assessed |
| `criticalConflict` | `{ conflict, severity, suggestions }` | Critical conflict detected |
| `conflictResolved` | `{ conflictId, resolution }` | Conflict resolved |
| `analyticsUpdate` | `AnalyticsResult` | Periodic analytics update |
| `shutdown` | - | Plugin shutdown |

## Triad Deliberation Integration

### Integration Points

The Conflict Monitor integrates with the Triad Deliberation Protocol at these points:

1. **Proposal Submission** - Each proposal is analyzed for conflicts before deliberation
2. **During Deliberation** - Real-time monitoring of statements for contradictions
3. **Voting Phase** - Check for conflicts that might block consensus
4. **Resolution** - Generate suggestions for any detected conflicts

### Usage Pattern

```javascript
// Before deliberation starts
const preCheck = await plugin.monitorTriadDeliberation(deliberation);
if (!preCheck.canProceed) {
  console.log('Blocking conflicts detected:');
  for (const conflict of preCheck.blockingConflicts) {
    const suggestions = plugin.getSuggestions(conflict.id);
    console.log(`- ${conflict.description}`);
    console.log(`  Suggestions: ${suggestions.map(s => s.strategy).join(', ')}`);
  }
}

// During deliberation
plugin.on('conflictDetected', async (conflict) => {
  if (context.isTriadDeliberation) {
    const suggestions = plugin.getSuggestions(conflict.id);
    await notifyTriadMembers(conflict, suggestions);
  }
});
```

### Triad Status

```javascript
const analytics = plugin.getAnalytics();
console.log(analytics.triadStatus);
// {
//   totalTriadConflicts: 2,
//   byMember: [
//     { member: 'alpha', conflictCount: 1 },
//     { member: 'beta', conflictCount: 0 },
//     { member: 'charlie', conflictCount: 1 }
//   ],
//   blockingDeliberation: false
// }
```

## Configuration

### Environment Variables

```bash
# Plugin settings
CONFLICT_MONITOR_SENSITIVITY=0.7
CONFLICT_MONITOR_AUTO_DETECT=true
CONFLICT_MONITOR_AUTO_SUGGEST=true
CONFLICT_MONITOR_NOTIFY_CRITICAL=true

# Triad integration
CONFLICT_MONITOR_TRIAD_INTEGRATION=true
CONFLICT_MONITOR_TRIAD_MEMBERS=alpha,beta,charlie

# Analytics
CONFLICT_MONITOR_ANALYTICS=true
CONFLICT_MONITOR_ANALYTICS_INTERVAL=60000
```

### openclaw.json Configuration

```json
{
  "plugins": {
    "conflict-monitor": {
      "enabled": true,
      "path": "./plugins/conflict-monitor",
      "config": {
        "triadIntegration": true,
        "autoDetectConflicts": true,
        "autoGenerateSuggestions": true,
        "notifyOnCritical": true,
        "severityThresholds": {
          "CRITICAL": { "min": 0.85, "max": 1.0 }
        },
        "contextMultipliers": {
          "isTriadDeliberation": 1.3,
          "isEmergency": 1.5
        }
      }
    }
  }
}
```

## Troubleshooting

### High false positive rate

1. Reduce sensitivity: `sensitivity: 0.5`
2. Disable specific detection types
3. Add known contradictions to exclusion list

### Missing conflicts

1. Increase sensitivity: `sensitivity: 0.8`
2. Add custom known contradictions
3. Enable all detection types

### Performance issues

1. Reduce `maxHistorySize`
2. Increase `analyticsInterval`
3. Disable unused detection types

## Testing

```bash
# Run tests
npm test

# Run health check
npm run healthcheck
```

## License

MIT

## Repository

https://github.com/heretek-ai/heretek-openclaw/tree/main/plugins/conflict-monitor

## References

- [`GAP_ANALYSIS_REPORT.md`](../../docs/GAP_ANALYSIS_REPORT.md#61-conflict-monitor-plugin) - Gap analysis
- [`EXTERNAL_PROJECTS_GAP_ANALYSIS.md`](../../docs/EXTERNAL_PROJECTS_GAP_ANALYSIS.md) - External analysis
- [`AGENTS.md`](../../agents/AGENTS.md) - Agent documentation
- [`SKILLS.md`](../../skills/README.md) - Skills documentation
