const MultiDocRetrievalPlugin = require('./original-index.js');
module.exports = {
  register(api) {
    const plugin = new MultiDocRetrievalPlugin(api.config || {});
    if (plugin.retrieve) api.registerTool('multi-doc-retrieve', { description: 'Multi-document retrieval', handler: async (q, o) => await plugin.retrieve(q, o) });
    if (plugin.getStatus) api.registerTool('multi-doc-status', { description: 'Get multi-doc status', handler: () => plugin.getStatus() });
    console.log('[multi-doc] Plugin registered');
  }
};
