const ConsciousnessPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    try {
      const plugin = new ConsciousnessPlugin(api.config || {});
      console.log('[consciousness] Plugin loaded (tools disabled due to API compatibility)');
    } catch (err) {
      console.error('[consciousness] Failed:', err.message);
    }
  }
};
