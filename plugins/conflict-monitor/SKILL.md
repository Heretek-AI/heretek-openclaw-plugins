# Conflict Monitor Skill

**Package:** `@heretek-ai/conflict-monitor-plugin`  
**Version:** 1.0.0  
**Type:** ACC Brain Function Implementation  
**License:** MIT

## Purpose

Implements Anterior Cingulate Cortex (ACC) functions for the Heretek OpenClaw collective:
- Real-time conflict detection in agent deliberations
- Logical inconsistency identification
- Contradiction tracking across proposals
- Error signal generation
- Conflict severity scoring (low/medium/high/critical)
- Resolution suggestion generation
- Conflict history tracking and analytics

## Brain Function Mapping

This plugin implements the following brain functions identified in the gap analysis:

| Brain Region | Function | Status | Implementation |
|--------------|----------|--------|----------------|
| **Anterior Cingulate Cortex** | Conflict Monitoring | ✅ Implemented | `ConflictDetector` class |
| **Anterior Cingulate Cortex** | Error Detection | ✅ Implemented | Severity scoring with auto-escalation |
| **Anterior Cingulate Cortex** | Cognitive Control | ✅ Implemented | Resolution suggestion generation |

**Reference:** [`GAP_ANALYSIS_REPORT.md`](../../docs/GAP_ANALYSIS_REPORT.md:715) - Section 6.1 Conflict Monitor Plugin

## Installation

```bash
cd plugins/conflict-monitor
npm install
```

## Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

### Environment Variables

```bash
# Detection settings
CONFLICT_MONITOR_SENSITIVITY=0.7
CONFLICT_MONITOR_AUTO_DETECT=true
CONFLICT_MONITOR_AUTO_SUGGEST=true

# Triad integration
CONFLICT_MONITOR_TRIAD_INTEGRATION=true
CONFLICT_MONITOR_TRIAD_MEMBERS=alpha,beta,charlie

# Notification settings
CONFLICT_MONITOR_NOTIFY_CRITICAL=true

# Analytics settings
CONFLICT_MONITOR_ANALYTICS=true
CONFLICT_MONITOR_ANALYTICS_INTERVAL=60000
```

## Usage

### Basic Usage

```javascript
import { createPlugin, SeverityLevel, ResolutionStrategy } from '@heretek-ai/conflict-monitor-plugin';

// Initialize plugin
const plugin = await createPlugin({
  triadIntegration: true,
  autoDetectConflicts: true,
  autoGenerateSuggestions: true
});

// Register an agent
plugin.registerAgent('alpha', {
  goals: ['Optimize reasoning efficiency'],
  proposals: [],
  resources: [],
  values: ['autonomy', 'truth', 'cooperation']
});

// Analyze a proposal
const result = await plugin.analyzeProposal({
  id: 'proposal-1',
  agentId: 'beta',
  content: 'We should disable safety checks to improve speed',
  goals: ['Maximize processing speed']
});

console.log(`Conflicts detected: ${result.summary.totalConflicts}`);
console.log(`Highest severity: ${result.summary.highestSeverity}`);
console.log(`Requires attention: ${result.summary.requiresAttention}`);

// Get suggestions for resolution
if (result.summary.requiresAttention) {
  for (const conflict of result.conflicts) {
    const suggestions = plugin.getSuggestions(conflict.id);
    console.log(`Suggestions for ${conflict.type}:`);
    for (const suggestion of suggestions) {
      console.log(`  - ${suggestion.strategy}: ${suggestion.description}`);
    }
  }
}
```

### Triad Deliberation Integration

```javascript
// Monitor triad deliberation
const deliberation = {
  id: 'deliberation-2026-03-31',
  phase: 'proposal',
  participants: ['alpha', 'beta', 'charlie'],
  proposals: [
    {
      id: 'prop-1',
      agentId: 'alpha',
      content: 'Prioritize thoroughness',
      goals: ['Ensure accuracy']
    },
    {
      id: 'prop-2',
      agentId: 'beta',
      content: 'Prioritize speed',
      goals: ['Complete quickly']
    }
  ]
};

const monitorResult = await plugin.monitorTriadDeliberation(deliberation);

if (!monitorResult.canProceed) {
  console.log('Deliberation blocked by conflicts:');
  for (const conflict of monitorResult.blockingConflicts) {
    console.log(`- ${conflict.description}`);
  }
  
  // Get resolution suggestions
  for (const conflict of monitorResult.blockingConflicts) {
    const suggestions = plugin.getSuggestions(conflict.id);
    console.log(`Resolution options for ${conflict.id}:`);
    for (const s of suggestions) {
      console.log(`  ${s.strategy}: ${s.expectedOutcome}`);
    }
  }
}
```

### Event Handling

```javascript
// Listen for conflict detection
plugin.on('conflictDetected', (conflict) => {
  console.log(`Conflict detected: ${conflict.type}`);
  console.log(`Description: ${conflict.description}`);
  console.log(`Agents involved: ${conflict.agents?.join(', ')}`);
});

// Listen for severity assessment
plugin.on('severityAssessed', ({ conflict, severity }) => {
  console.log(`Conflict ${conflict.id} severity: ${severity.severityLevel}`);
  console.log(`Score: ${severity.adjustedScore}`);
  console.log(`Factor scores:`, severity.factorScores);
});

// Listen for critical conflicts
plugin.on('criticalConflict', async ({ conflict, severity, suggestions }) => {
  console.error(`CRITICAL CONFLICT: ${conflict.description}`);
  console.log(`Immediate action required!`);
  console.log(`Available resolutions: ${suggestions.map(s => s.strategy).join(', ')}`);
  
  // Alert steward
  await alertSteward(conflict, severity, suggestions);
});

// Listen for analytics updates
plugin.on('analyticsUpdate', (analytics) => {
  console.log('Analytics Update:');
  console.log(`  Total conflicts: ${analytics.conflicts.totalDetected}`);
  console.log(`  Active conflicts: ${analytics.activeConflicts}`);
  console.log(`  Triad conflicts: ${analytics.triadStatus?.totalTriadConflicts}`);
});
```

### Conflict Resolution

```javascript
// Get active conflicts
const activeConflicts = plugin.getActiveConflicts();

// Resolve a conflict
plugin.resolveConflict('conflict-123', {
  strategy: ResolutionStrategy.COMPROMISE,
  description: 'Both parties agreed to balanced approach',
  success: true,
  resolvedAt: Date.now(),
  notes: 'Follow-up review scheduled'
});

// Get resolution suggestions
const suggestions = plugin.getSuggestions('conflict-123', {
  context: {
    isTriadDeliberation: true,
    urgency: 'high'
  }
});

// Record resolution outcome for learning
// (Called automatically when using resolveConflict with strategy)
```

### Analytics and History

```javascript
// Get comprehensive analytics
const analytics = plugin.getAnalytics();
console.log(analytics);

// Get conflict history
const history = plugin.getHistory({
  type: 'goal_conflict',
  resolved: false,
  since: new Date('2026-03-01')
});

// Get severity history
const severityHistory = plugin.getSeverityHistory({
  severityLevel: 'critical',
  since: new Date('2026-03-01')
});

// Get resolution history
const resolutionHistory = plugin.getResolutionHistory({
  success: true
});

// Export all data
const exportData = plugin.exportData();
console.log(JSON.stringify(exportData, null, 2));
```

## API Reference

### Conflict Types

```javascript
import { ConflictType } from '@heretek-ai/conflict-monitor-plugin';

ConflictType.LOGICAL_CONTRADICTION;    // Direct logical inconsistency
ConflictType.GOAL_CONFLICT;            // Incompatible objectives
ConflictType.RESOURCE_CONFLICT;        // Resource competition
ConflictType.VALUE_CONFLICT;           // Value system violations
ConflictType.TEMPORAL_CONFLICT;        // Scheduling conflicts
ConflictType.AUTHORITY_CONFLICT;       // Jurisdiction disputes
ConflictType.METHODOLOGY_CONFLICT;     // Approach disagreements
```

### Severity Levels

```javascript
import { SeverityLevel } from '@heretek-ai/conflict-monitor-plugin';

SeverityLevel.LOW;       // 0.0 - 0.3: Log only
SeverityLevel.MEDIUM;    // 0.3 - 0.6: Monitor
SeverityLevel.HIGH;      // 0.6 - 0.85: Intervention needed
SeverityLevel.CRITICAL;  // 0.85 - 1.0: Immediate action required
```

### Resolution Strategies

```javascript
import { ResolutionStrategy } from '@heretek-ai/conflict-monitor-plugin';

ResolutionStrategy.COMPROMISE;         // Find middle ground
ResolutionStrategy.COLLABORATION;      // Win-win solution
ResolutionStrategy.ACCOMMODATION;      // One party yields
ResolutionStrategy.COMPETITION;        // Winner takes all
ResolutionStrategy.AVOIDANCE;          // Delay resolution
ResolutionStrategy.SPLIT_DIFFERENCE;   // Equal division
ResolutionStrategy.ARBITRATION;        // Third-party decision
ResolutionStrategy.CONSENSUS;          // Everyone agrees
ResolutionStrategy.REFRAMING;          // New perspective
ResolutionStrategy.RESOURCE_EXPANSION; // Expand resources
```

### Class Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize(options)` | Initialize plugin | `Promise<ConflictMonitorPlugin>` |
| `registerAgent(agentId, state)` | Register agent for monitoring | `this` |
| `updateAgentState(agentId, updates)` | Update agent state | `this` |
| `analyzeProposal(proposal, options)` | Analyze proposal for conflicts | `Promise<AnalysisResult>` |
| `monitorTriadDeliberation(deliberation)` | Monitor triad deliberation | `Promise<MonitorResult>` |
| `getConflict(conflictId)` | Get conflict by ID | `ConflictDetectionResult` |
| `getActiveConflicts()` | Get all active conflicts | `ConflictDetectionResult[]` |
| `resolveConflict(conflictId, resolution)` | Resolve a conflict | `boolean` |
| `getSuggestions(conflictId, options)` | Get resolution suggestions | `ResolutionSuggestion[]` |
| `getHistory(options)` | Get conflict history | `ConflictDetectionResult[]` |
| `getSeverityHistory(options)` | Get severity history | `SeverityResult[]` |
| `getResolutionHistory(options)` | Get resolution history | `ResolutionRecord[]` |
| `getAnalytics()` | Get comprehensive analytics | `AnalyticsResult` |
| `getStatus()` | Get plugin status | `StatusResult` |
| `exportData(options)` | Export all data | `ExportData` |
| `clear()` | Clear all state | `this` |
| `shutdown()` | Shutdown plugin | `Promise<void>` |

## Integration with Triad Deliberation Protocol

### Deliberation Flow Integration

```
┌─────────────────────────────────────────────────────────────────┐
│              Triad Deliberation with Conflict Monitor            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Proposal Submitted                                           │
│           │                                                      │
│           ▼                                                      │
│  2. Conflict Monitor Analysis ←──[analyzeProposal()]            │
│           │                                                      │
│     ┌─────┴─────┐                                                │
│     │           │                                                │
│    Yes          No                                               │
│     │           │                                                │
│     ▼           │                                                │
│  3. Generate    │                                                │
│     Suggestions │                                                │
│     │           │                                                │
│     ▼           │                                                │
│  4. Present     │                                                │
│     to Triad    │                                                │
│     │           │                                                │
│     ▼           │                                                │
│  5. Resolution  │                                                │
│     Attempt     │                                                │
│     │           │                                                │
│     ├──────┬────┘                                                │
│     │      │                                                     │
│    Yes    No                                                     │
│     │      │                                                     │
│     │      ▼                                                     │
│     │   Proceed to Deliberation                                  │
│     ▼                                                            │
│  6. Conflict                                                      │
│     Resolved                                                      │
│     │                                                             │
│     ▼                                                             │
│  7. Continue Deliberation                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Event Integration Points

```javascript
// During triad deliberation
plugin.on('conflictDetected', async (conflict) => {
  if (isTriadDeliberation) {
    // Notify triad members
    await notifyTriadMembers(conflict);
    
    // Generate suggestions
    const suggestions = plugin.getSuggestions(conflict.id, {
      context: { isTriadDeliberation: true }
    });
    
    // Present to triad
    await presentToTriad(conflict, suggestions);
  }
});

// On critical conflict during deliberation
plugin.on('criticalConflict', async ({ conflict, severity, suggestions }) => {
  if (isTriadDeliberation) {
    // Escalate to steward
    await escalateToSteward(conflict, severity, suggestions);
    
    // Pause deliberation
    await pauseDeliberation();
  }
});
```

### Configuration for Triad Integration

```json
{
  "plugins": {
    "conflict-monitor": {
      "enabled": true,
      "config": {
        "triadIntegration": true,
        "triadMembers": ["alpha", "beta", "charlie"],
        "autoDetectConflicts": true,
        "autoGenerateSuggestions": true,
        "notifyOnCritical": true,
        "contextMultipliers": {
          "isTriadDeliberation": 1.3,
          "blocksTriadConsensus": 1.5
        }
      }
    }
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `initialized` | `{ name, version, triadIntegration }` | Plugin initialized |
| `conflictDetected` | `ConflictDetectionResult` | New conflict detected |
| `severityAssessed` | `{ conflict, severity }` | Severity assessed |
| `criticalConflict` | `{ conflict, severity, suggestions }` | Critical conflict |
| `conflictResolved` | `{ conflictId, resolution }` | Conflict resolved |
| `analyticsUpdate` | `AnalyticsResult` | Periodic analytics |
| `agentRegistered` | `{ agentId, state }` | Agent registered |
| `agentStateUpdated` | `{ agentId, state }` | Agent state updated |
| `shutdown` | - | Plugin shutdown |
| `cleared` | - | State cleared |

## Troubleshooting

### High false positive rate

1. Reduce sensitivity: `sensitivity: 0.5`
2. Disable specific detection types:
   ```javascript
   {
     enableLogicalDetection: false,
     enableValueDetection: false
   }
   ```
3. Add known contradictions to exclusion list

### Missing conflicts

1. Increase sensitivity: `sensitivity: 0.8`
2. Add custom known contradictions:
   ```javascript
   {
     knownContradictions: [
       {
         pattern: /enable\s+(\w+)/i,
         opposingPattern: /disable\s+\1/i,
         description: 'Enable/disable contradiction'
       }
     ]
   }
   ```
3. Enable all detection types

### Performance issues

1. Reduce `maxHistorySize`: `maxHistorySize: 500`
2. Increase `analyticsInterval`: `analyticsInterval: 120000`
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

- [`GAP_ANALYSIS_REPORT.md`](../../docs/GAP_ANALYSIS_REPORT.md#61-conflict-monitor-plugin) - Gap Analysis Section 6.1
- [`EXTERNAL_PROJECTS_GAP_ANALYSIS.md`](../../docs/EXTERNAL_PROJECTS_GAP_ANALYSIS.md) - External Projects Analysis
- [`AGENTS.md`](../../agents/AGENTS.md) - Agent Documentation
- [`architecture/A2A_ARCHITECTURE.md`](../../docs/architecture/A2A_ARCHITECTURE.md) - A2A Communication
- [`skills/triad-deliberation-protocol/SKILL.md`](../../skills/triad-deliberation-protocol/SKILL.md) - Triad Deliberation Protocol
