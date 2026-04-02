/**
 * Collective Communications Plugin - Entry Point
 */

import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { collectiveCommsPlugin } from "./src/channel.js";
import type { 
  CollectiveCommsConfig,
  CommunicationGraph,
  RoomConfig,
  AgentConfig 
} from "./src/types.js";

export default defineChannelPluginEntry({
  id: "collective-comms",
  name: "Collective Communications",
  description: "Multi-channel unified inbox with triad-aware message routing and visual agent-room assignment",
  plugin: collectiveCommsPlugin,
  
  registerCliMetadata(api) {
    api.registerCli(
      ({ program }) => {
        program
          .command("collective-comms")
          .description("Collective Communications management");
        
        program
          .command("collective-comms:status")
          .description("Show communication graph status");
        
        program
          .command("collective-comms:rooms")
          .description("List all configured rooms");
        
        program
          .command("collective-comms:agents")
          .description("List all agents and their assignments");
        
        program
          .command("collective-comms:graph")
          .option("--json", "Output as JSON")
          .description("Generate communication graph");
      },
      {
        descriptors: [
          {
            name: "collective-comms",
            description: "Collective Communications management",
            hasSubcommands: true,
          },
        ],
      },
    );
  },
  
  registerFull(api) {
    // Register HTTP routes for web-based graph UI
    api.registerHttpRoute({
      path: "/collective-comms/graph",
      auth: "plugin",
      handler: async (req, res) => {
        // Return communication graph for visualization
        const graph = await collectiveCommsPlugin.capabilities?.['graph:generate']?.();
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(graph, null, 2));
        return true;
      },
    });
    
    // Room management API
    api.registerHttpRoute({
      path: "/collective-comms/rooms",
      auth: "plugin",
      handler: async (req, res) => {
        if (req.method === 'GET') {
          // List rooms
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ rooms: [] })); // Would fetch from config
          return true;
        }
        
        if (req.method === 'POST') {
          // Create room
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const roomData = JSON.parse(body);
              const result = await collectiveCommsPlugin.capabilities?.['room:create']?.(roomData);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
            return true;
          });
          return; // Don't end immediately
        }
        
        res.statusCode = 405;
        res.end('Method not allowed');
        return true;
      },
    });
    
    // Agent assignment API
    api.registerHttpRoute({
      path: "/collective-comms/agents/:agentId/assign",
      auth: "plugin",
      handler: async (req, res) => {
        if (req.method === 'POST') {
          const agentId = (req.url || '').split('/')[3];
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { roomId } = JSON.parse(body);
              const result = await collectiveCommsPlugin.capabilities?.['agent:assign']?.(agentId, roomId);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
            return true;
          });
          return;
        }
        
        res.statusCode = 405;
        res.end('Method not allowed');
        return true;
      },
    });
    
    // Message routing decision API
    api.registerHttpRoute({
      path: "/collective-comms/route",
      auth: "plugin",
      handler: async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const ctx = JSON.parse(body);
              const decision = await collectiveCommsPlugin.capabilities?.['routing:decide']?.(ctx);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(decision));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
            return true;
          });
          return;
        }
        
        res.statusCode = 405;
        res.end('Method not allowed');
        return true;
      },
    });
  },
});

// Export types for other plugins
export type { 
  CollectiveCommsConfig,
  CommunicationGraph,
  RoomConfig,
  AgentConfig,
  PlatformType,
  AgentRole,
  RoomPurpose,
  RoutingDecision,
  GraphNode,
  GraphEdge,
} from "./src/types.js";

// Export plugin for direct imports
export { collectiveCommsPlugin };
