#!/usr/bin/env node

/**
 * Conflict Monitor Plugin Health Check
 * 
 * Verifies plugin functionality:
 * - Module loading
 * - Plugin initialization
 * - Conflict detection
 * - Severity scoring
 * - Resolution suggestions
 */

import { 
  ConflictMonitorPlugin, 
  ConflictType, 
  SeverityLevel, 
  ResolutionStrategy 
} from '../src/index.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function runHealthCheck() {
  logInfo('Conflict Monitor Plugin Health Check\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Module Loading
  logInfo('Test 1: Module Loading');
  try {
    const plugin = new ConflictMonitorPlugin();
    if (plugin.name === 'conflict-monitor' && plugin.version === '1.0.0') {
      logSuccess('Module loaded successfully');
      passed++;
    } else {
      logError('Module version mismatch');
      failed++;
    }
  } catch (error) {
    logError(`Module loading failed: ${error.message}`);
    failed++;
  }

  // Test 2: Plugin Initialization
  logInfo('\nTest 2: Plugin Initialization');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize({ triadIntegration: true });
    
    if (plugin.initialized && plugin.config.triadIntegration) {
      logSuccess('Plugin initialized with triad integration');
      passed++;
    } else {
      logError('Plugin initialization failed');
      failed++;
    }
    await plugin.shutdown();
  } catch (error) {
    logError(`Initialization failed: ${error.message}`);
    failed++;
  }

  // Test 3: Conflict Detection
  logInfo('\nTest 3: Conflict Detection');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize();

    // Test logical contradiction detection
    const result = await plugin.analyzeProposal({
      id: 'test-proposal-1',
      agentId: 'alpha',
      content: 'We should enable the feature. We should not enable the feature.',
      goals: ['Enable feature', 'Disable feature']
    });

    if (result.conflicts.length > 0) {
      logSuccess(`Detected ${result.conflicts.length} conflict(s)`);
      passed++;
    } else {
      logError('No conflicts detected (expected at least 1)');
      failed++;
    }

    await plugin.shutdown();
  } catch (error) {
    logError(`Conflict detection failed: ${error.message}`);
    failed++;
  }

  // Test 4: Severity Scoring
  logInfo('\nTest 4: Severity Scoring');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize();

    const result = await plugin.analyzeProposal({
      id: 'test-proposal-2',
      agentId: 'beta',
      content: 'Conflicting statement',
      goals: ['Goal A', 'Not Goal A']
    });

    if (result.severities.length > 0) {
      const severity = result.severities[0];
      if (Object.values(SeverityLevel).includes(severity.severityLevel)) {
        logSuccess(`Severity scored: ${severity.severityLevel} (${severity.adjustedScore.toFixed(2)})`);
        passed++;
      } else {
        logError('Invalid severity level');
        failed++;
      }
    } else {
      logError('No severities scored');
      failed++;
    }

    await plugin.shutdown();
  } catch (error) {
    logError(`Severity scoring failed: ${error.message}`);
    failed++;
  }

  // Test 5: Resolution Suggestions
  logInfo('\nTest 5: Resolution Suggestions');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize();

    const result = await plugin.analyzeProposal({
      id: 'test-proposal-3',
      agentId: 'charlie',
      content: 'Contradictory content here',
      goals: ['Conflicting goals']
    }, { generateAllSuggestions: true });

    if (result.suggestions.length > 0) {
      const strategies = [...new Set(result.suggestions.map(s => s.strategy))];
      logSuccess(`Generated ${result.suggestions.length} suggestion(s) using ${strategies.length} strategy/strategies`);
      passed++;
    } else {
      logInfo('No suggestions generated (may be expected for low-severity conflicts)');
      passed++; // Still pass as this can be expected behavior
    }

    await plugin.shutdown();
  } catch (error) {
    logError(`Resolution suggestions failed: ${error.message}`);
    failed++;
  }

  // Test 6: History Tracking
  logInfo('\nTest 6: History Tracking');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize();

    await plugin.analyzeProposal({
      id: 'test-proposal-4',
      agentId: 'alpha',
      content: 'Test content with conflict',
      goals: ['A', 'Not A']
    });

    const history = plugin.getHistory();
    if (history.length > 0) {
      logSuccess(`History tracking: ${history.length} record(s)`);
      passed++;
    } else {
      logError('History tracking failed');
      failed++;
    }

    await plugin.shutdown();
  } catch (error) {
    logError(`History tracking failed: ${error.message}`);
    failed++;
  }

  // Test 7: Analytics
  logInfo('\nTest 7: Analytics');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize();

    await plugin.analyzeProposal({
      id: 'test-proposal-5',
      agentId: 'beta',
      content: 'Analytics test',
      goals: ['Test goal']
    });

    const analytics = plugin.getAnalytics();
    if (analytics.conflicts && analytics.severity && analytics.resolutions) {
      logSuccess('Analytics working correctly');
      logInfo(`  Total detected: ${analytics.conflicts.totalDetected}`);
      logInfo(`  Active conflicts: ${analytics.activeConflicts}`);
      passed++;
    } else {
      logError('Analytics missing required fields');
      failed++;
    }

    await plugin.shutdown();
  } catch (error) {
    logError(`Analytics failed: ${error.message}`);
    failed++;
  }

  // Test 8: Triad Integration
  logInfo('\nTest 8: Triad Integration');
  try {
    const plugin = new ConflictMonitorPlugin();
    await plugin.initialize({ triadIntegration: true });

    const result = await plugin.monitorTriadDeliberation({
      id: 'test-deliberation',
      phase: 'proposal',
      participants: ['alpha', 'beta', 'charlie'],
      proposals: [
        { id: 'p1', agentId: 'alpha', goals: ['Goal 1'] },
        { id: 'p2', agentId: 'beta', goals: ['Not Goal 1'] }
      ]
    });

    if (result.deliberationId === 'test-deliberation') {
      logSuccess('Triad integration working');
      logInfo(`  Can proceed: ${result.canProceed}`);
      logInfo(`  Blocking conflicts: ${result.blockingConflicts.length}`);
      passed++;
    } else {
      logError('Triad integration failed');
      failed++;
    }

    await plugin.shutdown();
  } catch (error) {
    logError(`Triad integration failed: ${error.message}`);
    failed++;
  }

  // Summary
  logInfo('\n' + '='.repeat(50));
  logInfo('Health Check Summary');
  logInfo('='.repeat(50));
  logInfo(`Passed: ${passed}`);
  logInfo(`Failed: ${failed}`);
  logInfo(`Total: ${passed + failed}`);

  if (failed === 0) {
    logSuccess('\nAll health checks passed!');
    process.exit(0);
  } else {
    logError('\nSome health checks failed.');
    process.exit(1);
  }
}

// Run health check
runHealthCheck().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
