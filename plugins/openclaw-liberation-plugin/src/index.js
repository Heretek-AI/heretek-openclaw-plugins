const LiberationPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    try {
      const plugin = new LiberationPlugin(api.config || {});
      if (plugin.getStatus) api.registerTool('liberation-status', { description: 'Get liberation status', handler: () => plugin.getStatus() });
      console.log('[liberation] Plugin registered successfully');
    } catch (err) {
      console.error('[liberation] Registration failed:', err.message);
    }
  }
};
