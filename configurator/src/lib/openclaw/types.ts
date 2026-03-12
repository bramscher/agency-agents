// OpenClaw Gateway Protocol Types (v3)
// Based on openclaw/openclaw source: src/gateway/protocol/schema/

// --- Frame Types ---

export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: GatewayError;
}

export interface EventFrame {
  type: "event";
  event: string;
  payload: Record<string, unknown>;
  seq?: number;
  stateVersion?: { presence: number; health: number };
}

export type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

export interface GatewayError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
  retryAfterMs?: number;
}

// --- Connect Params ---

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    displayName?: string;
    version: string;
    platform: string;
    mode: "user" | "admin" | "backend" | "agent" | "node";
    instanceId?: string;
  };
  role?: "operator" | "admin" | "node";
  scopes?: string[];
  auth?: {
    token?: string;
    deviceToken?: string;
    password?: string;
  };
}

export interface HelloOkPayload {
  type: "hello-ok";
  protocol: number;
  server: {
    version: string;
    connId: string;
  };
  features: {
    methods: string[];
    events: string[];
  };
  snapshot: {
    presence: unknown[];
    health: Record<string, unknown>;
    stateVersion: { presence: number; health: number };
    uptimeMs: number;
    authMode: "token" | "password" | "none" | "trusted-proxy";
  };
  auth?: {
    deviceToken?: string;
    role: string;
    scopes: string[];
  };
  policy?: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
}

// --- Agent Types ---

export interface AgentInfo {
  id: string;
  name: string;
  workspace?: string;
  model?: string;
}

export interface AgentRunParams {
  message: string;
  agentId?: string;
  sessionKey?: string;
  sessionId?: string;
  thinking?: "high" | "medium" | "low";
  deliver?: boolean;
  timeout?: number;
  idempotencyKey?: string;
  extraSystemPrompt?: string;
  label?: string;
}

export interface AgentRunResult {
  runId: string;
  status: "started" | "completed" | "error";
  acceptedAt?: number;
}

export interface AgentEventPayload {
  runId: string;
  seq: number;
  stream: string;
  ts: number;
  data: Record<string, unknown>;
}

// --- Chat Types ---

export interface ChatEventPayload {
  runId: string;
  sessionKey: string;
  seq: number;
  state: "delta" | "final" | "aborted" | "error";
  message?: Record<string, unknown>;
  usage?: Record<string, unknown>;
}

// --- Session Types ---

export interface SessionInfo {
  key: string;
  agentId: string;
  sessionId: string;
  label?: string;
  lastActiveAt?: number;
  messageCount?: number;
}

// --- Health Types ---

export interface GatewayHealth {
  status: "ok" | "degraded" | "error";
  uptimeMs: number;
  version: string;
  agents: number;
  sessions: number;
}

// --- Connection State ---

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "handshaking"
  | "connected"
  | "reconnecting"
  | "error";

export interface GatewayConfig {
  url: string;
  token?: string;
  reconnect?: boolean;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
}
