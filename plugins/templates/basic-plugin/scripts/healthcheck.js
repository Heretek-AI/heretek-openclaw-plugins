#!/usr/bin/env node

/**
 * Health check script for {{pluginDisplayName}}
 */

import { createPlugin } from '../src/index.js';

async function healthCheck() {
  try {
    console.log('[{{pluginName}}] Running health check...');
    
    const plugin = await createPlugin();
    await plugin.initialize({ enabled: true });
    await plugin.start();
    
    const status = plugin.getStatus();
    
    if (status.running) {
      console.log('[{{pluginName}}] ✓ Plugin is healthy');
      await plugin.shutdown();
      process.exit(0);
    } else {
      console.error('[{{pluginName}}] ✗ Plugin is not running');
      await plugin.shutdown();
      process.exit(1);
    }
  } catch (error) {
    console.error('[{{pluginName}}] ✗ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
