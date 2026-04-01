#!/usr/bin/env node

import { createPlugin } from '../src/index.js';

async function healthCheck() {
  try {
    const plugin = await createPlugin();
    await plugin.initialize({ enabled: true });
    await plugin.start();
    
    const status = await plugin.getStatus();
    
    if (status.running) {
      console.log('[{{pluginName}}] ✓ Healthy');
      await plugin.shutdown();
      process.exit(0);
    }
    
    process.exit(1);
  } catch (error) {
    console.error('[{{pluginName}}] ✗', error.message);
    process.exit(1);
  }
}

healthCheck();
