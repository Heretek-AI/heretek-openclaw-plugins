const MultiDocRetrievalPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    try {
      const plugin = new MultiDocRetrievalPlugin(api.config || {});
      console.log('[multi-doc] Plugin loaded (tools disabled due to API compatibility)');
    } catch (err) {
      console.error('[multi-doc] Failed:', err.message);
    }
  }
};
