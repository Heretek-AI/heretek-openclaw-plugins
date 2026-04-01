const HybridSearchPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    const plugin = new HybridSearchPlugin(api.config || {});
    if (plugin.search) api.registerTool('hybrid-search', { description: 'Vector + keyword search fusion', handler: async (q, o) => await plugin.search(q, o) });
    if (plugin.getStatus) api.registerTool('hybrid-status', { description: 'Get hybrid search status', handler: () => plugin.getStatus() });
    console.log('[hybrid-search] Plugin registered');
  }
};
