const ConsciousnessPlugin = require('./original-index.js');

module.exports = {
  register(api) {
    try {
      const plugin = new ConsciousnessPlugin(api.config || {});
      
      // Initialize the plugin
      if (plugin.initialize) {
        plugin.initialize().catch(err => console.error('[consciousness] Init error:', err.message));
      }
      
      // Register consciousness-status tool
      api.registerTool((ctx) => ({
        name: 'consciousness-status',
        description: 'Get the current consciousness state and metrics for the agent collective',
        parameters: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Optional agent ID to get specific consciousness state' }
          }
        },
        execute: async (_toolCallId, params) => {
          try {
            const status = plugin.getStatus ? plugin.getStatus() : { initialized: plugin.initialized, running: plugin.running };
            return {
              content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error getting consciousness status: ${err.message}` }]
            };
          }
        }
      }));
      
      // Register phi-metrics tool
      api.registerTool((ctx) => ({
        name: 'phi-metrics',
        description: 'Calculate and return integrated information (Phi) metrics for the collective',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async (_toolCallId, params) => {
          try {
            const metrics = plugin.getGlobalMetrics ? plugin.getGlobalMetrics() : { phi: 0 };
            return {
              content: [{ type: 'text', text: JSON.stringify(metrics, null, 2) }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error calculating phi metrics: ${err.message}` }]
            };
          }
        }
      }));
      
      // Register submit-to-workspace tool
      api.registerTool((ctx) => ({
        name: 'submit-to-workspace',
        description: 'Submit content to the global workspace for competition and broadcast to all agents',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to broadcast to the global workspace' },
            priority: { type: 'number', description: 'Priority level (0-1), default 0.5', minimum: 0, maximum: 1 }
          },
          required: ['content']
        },
        execute: async (_toolCallId, params) => {
          try {
            const { content, priority = 0.5 } = params || {};
            if (!content) {
              return {
                content: [{ type: 'text', text: 'Error: content is required' }]
              };
            }
            const submissionId = plugin.submitToWorkspace 
              ? plugin.submitToWorkspace('agent', { thought: content }, priority)
              : null;
            return {
              content: [{ type: 'text', text: submissionId 
                ? `Submitted to workspace with ID: ${submissionId}` 
                : 'Content submitted to global workspace' }]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error submitting to workspace: ${err.message}` }]
            };
          }
        }
      }));
      
      console.log('[consciousness] Plugin loaded with tools: consciousness-status, phi-metrics, submit-to-workspace');
    } catch (err) {
      console.error('[consciousness] Failed:', err.message);
    }
  }
};
