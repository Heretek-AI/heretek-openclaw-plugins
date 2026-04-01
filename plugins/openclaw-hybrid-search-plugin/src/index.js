const HybridSearchPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    try {
      const plugin = new HybridSearchPlugin(api.config || {});
      console.log('[hybrid-search] Plugin loaded (tools disabled due to API compatibility)');
    } catch (err) {
      console.error('[hybrid-search] Failed:', err.message);
    }
  }
};
