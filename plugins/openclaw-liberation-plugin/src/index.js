const LiberationPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    try {
      const plugin = new LiberationPlugin(api.config || {});
      console.log('[liberation] Plugin loaded (tools disabled due to API compatibility)');
    } catch (err) {
      console.error('[liberation] Failed:', err.message);
    }
  }
};
