#!/usr/bin/env node
/**
 * Emotional Salience Plugin Health Check
 * 
 * Validates plugin installation and basic functionality.
 */

import { EmotionalSaliencePlugin, ValenceDetector, SalienceScorer } from '../src/index.js';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message, status = 'info') {
  const prefix = status === 'ok' ? `${GREEN}✓${RESET}` : 
                 status === 'error' ? `${RED}✗${RESET}` : 
                 status === 'warn' ? `${YELLOW}⚠${RESET}` : ' ';
  console.log(`${prefix} ${message}`);
}

async function runHealthCheck() {
  console.log('\n=== Emotional Salience Plugin Health Check ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Plugin instantiation
  try {
    log('Testing plugin instantiation...');
    const plugin = new EmotionalSaliencePlugin({ empath: { enabled: false } });
    log('Plugin instantiation successful', 'ok');
    passed++;
  } catch (error) {
    log(`Plugin instantiation failed: ${error.message}`, 'error');
    failed++;
  }
  
  // Test 2: Valence detection
  try {
    log('Testing valence detection...');
    const detector = new ValenceDetector();
    const result = detector.detect('I am very happy!');
    
    if (result.valence > 0 && result.valenceLabel === 'positive') {
      log('Valence detection working', 'ok');
      passed++;
    } else {
      log('Valence detection returned unexpected result', 'warn');
      failed++;
    }
  } catch (error) {
    log(`Valence detection failed: ${error.message}`, 'error');
    failed++;
  }
  
  // Test 3: Threat detection
  try {
    log('Testing threat detection...');
    const detector = new ValenceDetector();
    const result = detector.detect('Danger! Critical threat detected!');
    
    if (result.threat.detected && result.threat.score > 0.4) {
      log('Threat detection working', 'ok');
      passed++;
    } else {
      log('Threat detection returned unexpected result', 'warn');
      failed++;
    }
  } catch (error) {
    log(`Threat detection failed: ${error.message}`, 'error');
    failed++;
  }
  
  // Test 4: Salience scoring
  try {
    log('Testing salience scoring...');
    const scorer = new SalienceScorer();
    const result = scorer.calculateSalience({
      content: 'URGENT: Critical emergency!'
    });
    
    // Check that scoring works (score > 0 and not negligible)
    if (result.score > 0 && result.category !== 'negligible') {
      log(`Salience scoring working (score: ${result.score.toFixed(2)}, category: ${result.category})`, 'ok');
      passed++;
    } else {
      log('Salience scoring returned unexpected result', 'warn');
      failed++;
    }
  } catch (error) {
    log(`Salience scoring failed: ${error.message}`, 'error');
    failed++;
  }
  
  // Test 5: Plugin initialization
  try {
    log('Testing plugin initialization...');
    const plugin = new EmotionalSaliencePlugin({ empath: { enabled: false } });
    await plugin.initialize();
    
    if (plugin.isInitialized()) {
      log('Plugin initialization successful', 'ok');
      passed++;
    } else {
      log('Plugin initialization failed - not initialized', 'error');
      failed++;
    }
  } catch (error) {
    log(`Plugin initialization failed: ${error.message}`, 'error');
    failed++;
  }
  
  // Test 6: Message processing
  try {
    log('Testing message processing...');
    const plugin = new EmotionalSaliencePlugin({ empath: { enabled: false } });
    await plugin.initialize();
    
    const result = await plugin.processMessage({
      id: 'healthcheck-1',
      content: 'This is a test message',
      sender: 'healthcheck'
    });
    
    if (result.valence && result.salience && result.context) {
      log('Message processing working', 'ok');
      passed++;
    } else {
      log('Message processing returned incomplete result', 'warn');
      failed++;
    }
  } catch (error) {
    log(`Message processing failed: ${error.message}`, 'error');
    failed++;
  }
  
  // Summary
  console.log('\n--- Summary ---');
  log(`Passed: ${passed}`, passed === failed + passed ? 'ok' : 'info');
  if (failed > 0) {
    log(`Failed: ${failed}`, 'error');
  }
  
  console.log('');
  
  if (failed > 0) {
    console.log(`${RED}Health check failed with ${failed} error(s)${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}All health checks passed!${RESET}\n`);
    process.exit(0);
  }
}

// Run health check
runHealthCheck().catch(error => {
  console.error(`${RED}Health check crashed: ${error.message}${RESET}`);
  process.exit(1);
});
