import type {
  GatewayConfig,
  ConnectionState,
  ConnectParams,
  RequestFrame,
  ResponseFrame,
  EventFrame,
  GatewayFrame,
  HelloOkPayload,
} from "./types";

type EventHandler = (event: EventFrame) => void;
type StateHandler = (state: ConnectionState) => void;

const PROTOCOL_VERSION = 3;
const DEFAULT_RECONNECT_MS = 3000;
const DEFAULT_MAX_RECONNECT = 10;

/**
 * WebSocket client for the OpenClaw gateway.
 * Handles connection lifecycle, request/response correlation,
 * and event streaming.
 */
export class GatewayClient {
  private ws: WebSocket | null = null;
  private config: Required<GatewayConfig>;
  private state: ConnectionState = "disconnected";
  private requestId = 0;
  private pending = new Map<
    string,
    { resolve: (v: ResponseFrame) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
  >();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private stateHandlers = new Set<StateHandler>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private serverInfo: HelloOkPayload | null = null;

  constructor(config: GatewayConfig) {
    this.config = {
      url: config.url,
      token: config.token ?? "",
      reconnect: config.reconnect ?? true,
      reconnectIntervalMs: config.reconnectIntervalMs ?? DEFAULT_RECONNECT_MS,
      maxReconnectAttempts:
        config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT,
    };
  }

  // --- Public API ---

  getState(): ConnectionState {
    return this.state;
  }

  getServerInfo(): HelloOkPayload | null {
    return this.serverInfo;
  }

  /** Connect to the gateway WebSocket */
  connect(): void {
    if (this.state === "connected" || this.state === "connecting") return;
    this.setState("connecting");

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.setState("handshaking");
        this.sendHandshake();
      };

      this.ws.onmessage = (evt) => {
        this.handleMessage(evt.data as string);
      };

      this.ws.onclose = (evt) => {
        this.cleanup();
        if (evt.code !== 1000 && this.config.reconnect) {
          this.scheduleReconnect();
        } else {
          this.setState("disconnected");
        }
      };

      this.ws.onerror = () => {
        this.setState("error");
      };
    } catch {
      this.setState("error");
      if (this.config.reconnect) this.scheduleReconnect();
    }
  }

  /** Disconnect from the gateway */
  disconnect(): void {
    this.config.reconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, "client disconnect");
      this.ws = null;
    }
    this.cleanup();
    this.setState("disconnected");
  }

  /** Send an RPC request and wait for the response */
  async request(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs = 30000
  ): Promise<ResponseFrame> {
    if (this.state !== "connected") {
      throw new Error(`Gateway not connected (state: ${this.state})`);
    }

    const id = `req-${++this.requestId}`;
    const frame: RequestFrame = { type: "req", id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.send(frame);
    });
  }

  /** Subscribe to gateway events */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => this.eventHandlers.get(event)?.delete(handler);
  }

  /** Subscribe to connection state changes */
  onStateChange(handler: StateHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  // --- Internal ---

  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;
    this.state = newState;
    for (const handler of this.stateHandlers) {
      try {
        handler(newState);
      } catch {
        // ignore handler errors
      }
    }
  }

  private send(frame: GatewayFrame): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  private sendHandshake(): void {
    const params: ConnectParams = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: "agency-mission-control",
        displayName: "Agency Mission Control",
        version: "1.0.0",
        platform: typeof navigator !== "undefined" ? navigator.platform : "web",
        mode: "backend",
      },
      role: "operator",
      ...(this.config.token
        ? { auth: { token: this.config.token } }
        : {}),
    };

    const frame: RequestFrame = {
      type: "req",
      id: `req-${++this.requestId}`,
      method: "connect",
      params: params as unknown as Record<string, unknown>,
    };

    // Track the connect request so we can handle the hello-ok response
    this.pending.set(frame.id, {
      resolve: (res) => {
        if (res.ok) {
          this.serverInfo = res.payload as unknown as HelloOkPayload;
          this.reconnectAttempts = 0;
          this.setState("connected");
        } else {
          this.setState("error");
          this.ws?.close(4001, "handshake failed");
        }
      },
      reject: () => {
        this.setState("error");
      },
      timer: setTimeout(() => {
        this.pending.delete(frame.id);
        this.setState("error");
        this.ws?.close(4002, "handshake timeout");
      }, 10000),
    });

    this.send(frame);
  }

  private handleMessage(raw: string): void {
    let frame: GatewayFrame;
    try {
      frame = JSON.parse(raw) as GatewayFrame;
    } catch {
      return;
    }

    switch (frame.type) {
      case "res": {
        const pending = this.pending.get(frame.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(frame.id);
          pending.resolve(frame);
        }
        break;
      }
      case "event": {
        this.dispatchEvent(frame);
        break;
      }
      // ignore other frame types
    }
  }

  private dispatchEvent(event: EventFrame): void {
    // Dispatch to specific event handlers
    const handlers = this.eventHandlers.get(event.event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch {
          // ignore handler errors
        }
      }
    }

    // Also dispatch to wildcard handlers
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch {
          // ignore
        }
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState("error");
      return;
    }

    this.setState("reconnecting");
    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const backoff = Math.min(
      this.config.reconnectIntervalMs * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    const jitter = backoff * 0.2 * Math.random();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, backoff + jitter);
  }

  private cleanup(): void {
    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Connection closed"));
      this.pending.delete(id);
    }
    this.ws = null;
  }
}
