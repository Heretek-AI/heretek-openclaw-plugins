#!/usr/bin/env node
/**
 * SwarmClaw Integration Health Check Script
 * 
 * Usage: node scripts/healthcheck.js
 */

import { createPlugin } from '../src/index.js';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const logLevel = process.env.LOG_LEVEL || 'info';
const currentLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.info;

function log(level, message, data = {}) {
  if (LOG_LEVELS[level] <= currentLevel) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`, Object.keys(data).length ? data : '');
  }
}

async function runHealthCheck() {
  log('info', 'Starting SwarmClaw Integration Health Check');
  log('info', '============================================');

  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    providers: {},
    overall: 'unknown',
    duration: 0
  };

  let healthyCount = 0;
  let unhealthyCount = 0;

  try {
    // Initialize plugin without starting health monitoring (we'll do manual checks)
    const plugin = await createPlugin({ startHealthMonitoring: false });
    
    log('info', `Plugin initialized: ${plugin.name} v${plugin.version}`);
    log('info', `Providers configured: ${plugin.getStatus().providers.length}`);
    log('info', `Failover order: ${plugin.getFailoverOrder().join(' → ')}`);

    // Check each provider
    for (const providerType of plugin.getFailoverOrder()) {
      log('info', `Checking provider: ${providerType}`);
      
      const provider = plugin.failoverManager.providers.get(providerType);
      if (!provider) {
        log('warn', `Provider ${providerType} not found`);
        results.providers[providerType] = {
          status: 'not_configured',
          message: 'Provider not registered'
        };
        continue;
      }

      // Check configuration
      const isConfigured = provider.isConfigured();
      if (!isConfigured) {
        log('warn', `Provider ${providerType} not properly configured`);
        results.providers[providerType] = {
          status: 'not_configured',
          message: 'Missing API key or disabled'
        };
        unhealthyCount++;
        continue;
      }

      // Perform health check
      try {
        const healthCheckResult = await performProviderHealthCheck(provider);
        
        if (healthCheckResult.healthy) {
          log('info', `Provider ${providerType}: HEALTHY (latency: ${healthCheckResult.latency}ms)`);
          results.providers[providerType] = {
            status: 'healthy',
            latency: healthCheckResult.latency,
            message: 'Health check passed'
          };
          healthyCount++;
        } else {
          log('warn', `Provider ${providerType}: UNHEALTHY - ${healthCheckResult.error}`);
          results.providers[providerType] = {
            status: 'unhealthy',
            message: healthCheckResult.error
          };
          unhealthyCount++;
        }
      } catch (error) {
        log('error', `Provider ${providerType} health check failed: ${error.message}`);
        results.providers[providerType] = {
          status: 'error',
          message: error.message
        };
        unhealthyCount++;
      }
    }

    // Determine overall status
    const totalProviders = healthyCount + unhealthyCount;
    if (totalProviders === 0) {
      results.overall = 'no_providers';
    } else if (healthyCount === 0) {
      results.overall = 'unhealthy';
    } else if (healthyCount < totalProviders) {
      results.overall = 'degraded';
    } else {
      results.overall = 'healthy';
    }

    results.duration = Date.now() - startTime;
    results.healthyCount = healthyCount;
    results.unhealthyCount = unhealthyCount;
    results.totalProviders = totalProviders;

    // Print summary
    log('info', '');
    log('info', '============================================');
    log('info', 'Health Check Summary');
    log('info', '============================================');
    log('info', `Overall Status: ${results.overall.toUpperCase()}`);
    log('info', `Healthy: ${healthyCount}/${totalProviders}`);
    log('info', `Duration: ${results.duration}ms`);
    log('info', '');

    // Print detailed results
    log('info', 'Provider Details:');
    for (const [type, result] of Object.entries(results.providers)) {
      const icon = result.status === 'healthy' ? '✅' : result.status === 'unhealthy' ? '❌' : '⚠️';
      log('info', `  ${icon} ${type}: ${result.status} - ${result.message || ''}`);
    }

    // Exit with appropriate code
    if (results.overall === 'unhealthy' || results.overall === 'no_providers') {
      process.exit(1);
    } else if (results.overall === 'degraded') {
      process.exit(0); // Degraded is still operational
    } else {
      process.exit(0);
    }

  } catch (error) {
    log('error', `Health check failed: ${error.message}`);
    log('error', error.stack);
    process.exit(1);
  }
}

async function performProviderHealthCheck(provider) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = provider.getFullUrl(provider.healthEndpoint);
    const headers = provider.getHeaders();

    // Special handling for different providers
    if (provider.type === 'anthropic') {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: provider.models[0],
          max_tokens_to_sample: 1,
          prompt: '\n\nHuman:\n\nAssistant:'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return {
        healthy: response.ok || response.status === 400,
        latency: 0
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return {
      healthy: response.ok,
      latency: 0
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { healthy: false, error: 'Health check timeout' };
    }
    return { healthy: false, error: error.message };
  }
}

// Run health check
runHealthCheck().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
