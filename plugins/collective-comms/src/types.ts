/**
 * Collective Communications Plugin - Type Definitions
 */

export type PlatformType = 'matrix' | 'discord' | 'telegram' | 'signal' | 'whatsapp' | 'slack';

export type AgentRole = 'orchestrator' | 'triad' | 'advisory' | 'specialist' | 'operator';

export type RoomPurpose = 'deliberation' | 'broadcast' | 'alerts' | 'casual' | 'custom';

export type DeliberationMode = 'triad-only' | 'advisory-allowed' | 'open';

export interface PlatformConfig {
  id: string;
  type: PlatformType;
  enabled: boolean;
  token?: string;
  serverUrl?: string;
  credentials?: Record<string, string>;
}

export interface RoomConfig {
  id: string;
  name: string;
  platform: string;
  platformRoomId: string;
  purpose: RoomPurpose;
  assignedAgents: string[];
  triadOnly: boolean;
  allowBots: boolean;
  requireMention: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  defaultRooms: string[];
}

export interface RoutingConfig {
  deliberationMode: DeliberationMode;
  broadcastChannels: string[];
  alertChannels: string[];
  crossPlatformSync: boolean;
  constitutionalReview: boolean;
}

export interface SecurityConfig {
  dmPolicy: 'allowlist' | 'denylist' | 'open';
  allowFrom: string[];
  requirePairing: boolean;
}

export interface CollectiveCommsConfig {
  platforms: PlatformConfig[];
  rooms: RoomConfig[];
  agents: AgentConfig[];
  routing: RoutingConfig;
  security: SecurityConfig;
}

export interface MessageContext {
  messageId: string;
  fromAgent?: string;
  fromUser?: string;
  platform: string;
  roomId: string;
  timestamp: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface RoutingDecision {
  action: 'deliver' | 'route' | 'broadcast' | 'block' | 'queue-for-review';
  targetRooms?: string[];
  reason: string;
  requiresConstitutionalReview?: boolean;
}

export interface GraphNode {
  id: string;
  type: 'agent' | 'room' | 'platform';
  label: string;
  data: AgentConfig | RoomConfig | PlatformConfig;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'assigned-to' | 'routes-to' | 'belongs-to';
  label?: string;
}

export interface CommunicationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    lastUpdated: string;
    version: string;
  };
}
