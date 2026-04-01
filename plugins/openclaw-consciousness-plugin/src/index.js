const ConsciousnessPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    try {
      const plugin = new ConsciousnessPlugin(api.config || {});
      if (plugin.getGlobalMetrics) api.registerTool('consciousness-metrics', { description: 'Get consciousness metrics', handler: () => plugin.getGlobalMetrics() });
      if (plugin.getStatus) api.registerTool('consciousness-status', { description: 'Get consciousness plugin status', handler: () => plugin.getStatus() });
      console.log('[consciousness] Plugin registered successfully');
    } catch (err) {
      console.error('[consciousness] Registration failed:', err.message);
    }
  }
};
