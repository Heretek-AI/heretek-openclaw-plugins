const SkillExtensionsPlugin = require('./index.js.bak');
module.exports = {
  register(api) {
    const plugin = new SkillExtensionsPlugin(api.config || {});
    if (plugin.getStatus) api.registerTool('skill-extensions-status', { description: 'Get skill extensions status', handler: () => plugin.getStatus() });
    console.log('[skill-extensions] Plugin registered');
  }
};
