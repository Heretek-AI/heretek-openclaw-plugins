/**
 * Collective Communications Channel Plugin
 * 
 * Multi-channel unified inbox with triad-aware message routing
 */

import {
  createChatChannelPlugin,
  createChannelPluginBase,
} from "openclaw/plugin-sdk/core";
import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import type { 
  CollectiveCommsConfig, 
  ResolvedAccount,
  MessageContext,
  RoutingDecision 
} from "./types";

/**
 * Resolve account configuration
 */
function resolveAccount(
  cfg: OpenClawConfig,
  accountId?: string | null,
): ResolvedAccount {
  const section = (cfg.channels as Record<string, any>)?.["collective-comms"];
  
  if (!section) {
    throw new Error("collective-comms: No configuration found");
  }

  return {
    accountId: accountId ?? null,
    config: section as CollectiveCommsConfig,
    enabled: section.platforms?.some(p => p.enabled) ?? false,
  };
}

/**
 * Inspect account status without exposing secrets
 */
function inspectAccount(
  cfg: OpenClawConfig,
  accountId?: string | null,
) {
  const section = (cfg.channels as Record<string, any>)?.["collective-comms"];
  
  if (!section) {
    return {
      enabled: false,
      configured: false,
      platformCount: 0,
      roomCount: 0,
      agentCount: 0,
    };
  }

  const enabledPlatforms = section.platforms?.filter((p: any) => p.enabled)?.length ?? 0;
  
  return {
    enabled: enabledPlatforms > 0,
    configured: true,
    platformCount: enabledPlatforms,
    roomCount: section.rooms?.length ?? 0,
    agentCount: section.agents?.length ?? 0,
  };
}

/**
 * Route message based on triad awareness and constitutional rules
 */
function routeMessage(
  ctx: MessageContext,
  config: CollectiveCommsConfig,
): RoutingDecision {
  const { fromAgent, content, roomId } = ctx;
  
  // Check if from a triad member
  const isTriadMember = config.agents
    .filter(a => a.role === 'triad')
    .some(a => a.id === fromAgent);

  const isOrchestrator = config.agents
    .some(a => a.id === fromAgent && a.role === 'orchestrator');

  // Find the room
  const room = config.rooms.find(r => r.id === roomId);
  
  if (!room) {
    return {
      action: 'block',
      reason: 'Unknown room',
    };
  }

  // Constitutional review check
  if (config.routing.constitutionalReview && !isOrchestrator) {
    // Check if message might need review (external actions, sensitive topics)
    const needsReview = [
      '/approve',
      'send email',
      'post to',
      'publish',
      'deploy',
    ].some(trigger => content.toLowerCase().includes(trigger));

    if (needsReview) {
      return {
        action: 'queue-for-review',
        reason: 'Constitutional review required for external action',
        requiresConstitutionalReview: true,
      };
    }
  }

  // Triad-only room check
  if (room.triadOnly && !isTriadMember && !isOrchestrator) {
    return {
      action: 'block',
      reason: 'Room is restricted to triad members only',
    };
  }

  // Check agent assignment
  if (fromAgent && room.assignedAgents.length > 0) {
    const isAssigned = room.assignedAgents.includes(fromAgent);
    if (!isAssigned && !isOrchestrator) {
      return {
        action: 'route',
        targetRooms: config.agents
          .find(a => a.id === fromAgent)?.defaultRooms,
        reason: `Agent ${fromAgent} not assigned to room ${room.name}, routing to default rooms`,
      };
    }
  }

  // Broadcast detection
  const isBroadcast = config.routing.broadcastChannels.includes(roomId);
  if (isBroadcast && content.startsWith('!broadcast')) {
    return {
      action: 'broadcast',
      targetRooms: config.routing.broadcastChannels,
      reason: 'Broadcast message to all channels',
    };
  }

  // Alert detection
  const isAlert = config.routing.alertChannels.includes(roomId);
  if (isAlert && (content.startsWith('!alert') || content.includes('🚨'))) {
    return {
      action: 'broadcast',
      targetRooms: config.routing.alertChannels,
      reason: 'Alert message to alert channels',
    };
  }

  // Default: deliver to room
  return {
    action: 'deliver',
    reason: 'Normal delivery',
  };
}

/**
 * Generate communication graph for visualization
 */
function generateCommunicationGraph(
  config: CollectiveCommsConfig,
) {
  const nodes: Array<{ id: string; type: string; label: string; data: any }> = [];
  const edges: Array<{ source: string; target: string; type: string; label?: string }> = [];

  // Add platform nodes
  config.platforms.forEach(platform => {
    nodes.push({
      id: `platform:${platform.id}`,
      type: 'platform',
      label: `${platform.type} (${platform.enabled ? 'active' : 'inactive'})`,
      data: platform,
    });
  });

  // Add room nodes
  config.rooms.forEach(room => {
    nodes.push({
      id: `room:${room.id}`,
      type: 'room',
      label: `${room.name} [${room.purpose}]`,
      data: room,
    });

    // Connect room to platform
    edges.push({
      source: `room:${room.id}`,
      target: `platform:${room.platform}`,
      type: 'belongs-to',
    });
  });

  // Add agent nodes
  config.agents.forEach(agent => {
    nodes.push({
      id: `agent:${agent.id}`,
      type: 'agent',
      label: `${agent.name} (${agent.role})`,
      data: agent,
    });

    // Connect agent to assigned rooms
    agent.defaultRooms.forEach(roomId => {
      edges.push({
        source: `agent:${agent.id}`,
        target: `room:${roomId}`,
        type: 'assigned-to',
      });
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

// Export the channel plugin
export const collectiveCommsPlugin = createChatChannelPlugin<ResolvedAccount>({
  base: createChannelPluginBase({
    id: "collective-comms",
    setup: {
      resolveAccount,
      inspectAccount,
    },
  }),

  // DM security
  security: {
    dm: {
      channelKey: "collective-comms",
      resolvePolicy: (account) => account.config?.security?.dmPolicy ?? "allowlist",
      resolveAllowFrom: (account) => account.config?.security?.allowFrom ?? [],
      defaultPolicy: "allowlist",
    },
  },

  // Pairing flow
  pairing: {
    text: {
      idLabel: "Platform username or ID",
      message: "Send this code to verify your identity for Collective Communications:",
      notify: async ({ target, code }) => {
        // This would be implemented per-platform
        console.log(`[Collective Comms] Pairing code for ${target}: ${code}`);
      },
    },
  },

  // Threading
  threading: { 
    topLevelReplyToMode: "reply",
  },

  // Outbound messaging
  outbound: {
    attachedResults: {
      sendText: async (params) => {
        // Route message based on configuration
        // This is a placeholder - real implementation would dispatch to platform SDKs
        console.log(`[Collective Comms] Sending to ${params.to}: ${params.text.substring(0, 50)}...`);
        
        return { 
          messageId: `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          platform: params.to.split(':')[0],
          delivered: true,
        };
      },
    },
    base: {
      sendMedia: async (params) => {
        console.log(`[Collective Comms] Sending media to ${params.to}`);
        // Platform-specific media sending
      },
      sendPoll: async (params) => {
        console.log(`[Collective Comms] Creating poll in ${params.to}`);
        // Platform-specific poll creation
      },
    },
  },

  // Custom capabilities
  capabilities: {
    // Expose routing API to other plugins
    'routing:decide': async (ctx: MessageContext) => {
      const account = resolveAccount({} as OpenClawConfig);
      return routeMessage(ctx, account.config);
    },
    
    // Expose graph generation for UI
    'graph:generate': async () => {
      const account = resolveAccount({} as OpenClawConfig);
      return generateCommunicationGraph(account.config);
    },
    
    // Room management
    'room:create': async (roomData: Partial<any>) => {
      console.log('[Collective Comms] Creating room:', roomData);
      // Would update config and persist
      return { success: true, roomId: `room_${Date.now()}` };
    },
    
    'room:update': async (roomId: string, updates: Partial<any>) => {
      console.log(`[Collective Comms] Updating room ${roomId}:`, updates);
      return { success: true };
    },
    
    // Agent assignment
    'agent:assign': async (agentId: string, roomId: string) => {
      console.log(`[Collective Comms] Assigning ${agentId} to ${roomId}`);
      return { success: true };
    },
    
    'agent:unassign': async (agentId: string, roomId: string) => {
      console.log(`[Collective Comms] Unassigning ${agentId} from ${roomId}`);
      return { success: true };
    },
  },
});
