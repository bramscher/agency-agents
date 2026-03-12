"use client";

import { useEffect, useRef, useCallback } from "react";
import { GatewayClient } from "./gateway-client";
import { SessionManager } from "./session-manager";
import { useMissionControlStore } from "@/lib/store/mission-control";
import type {
  AgentEventPayload,
  ChatEventPayload,
  EventFrame,
} from "./types";

let sharedClient: GatewayClient | null = null;
let sharedManager: SessionManager | null = null;

/** Get or create the singleton gateway client */
function getClient(url: string, token?: string): GatewayClient {
  if (!sharedClient) {
    sharedClient = new GatewayClient({ url, token, reconnect: true });
  }
  return sharedClient;
}

/** Get or create the singleton session manager */
function getManager(client: GatewayClient): SessionManager {
  if (!sharedManager) {
    sharedManager = new SessionManager(client);
  }
  return sharedManager;
}

/**
 * React hook that manages the OpenClaw gateway connection
 * and wires events to the Mission Control Zustand store.
 */
export function useGateway() {
  const gatewayUrl = useMissionControlStore((s) => s.gatewayUrl);
  const setConnectionState = useMissionControlStore(
    (s) => s.setConnectionState
  );
  const setGatewayHealth = useMissionControlStore((s) => s.setGatewayHealth);
  const setGatewayAgents = useMissionControlStore((s) => s.setGatewayAgents);
  const setSessions = useMissionControlStore((s) => s.setSessions);
  const handleAgentEvent = useMissionControlStore((s) => s.handleAgentEvent);
  const handleChatEvent = useMissionControlStore((s) => s.handleChatEvent);
  const addActivity = useMissionControlStore((s) => s.addActivity);

  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const client = getClient(gatewayUrl);
    const manager = getManager(client);

    // Wire state changes to store
    const unsub1 = client.onStateChange((state) => {
      setConnectionState(state);

      if (state === "connected") {
        addActivity({
          type: "system",
          message: "Connected to OpenClaw gateway",
        });

        // Fetch initial data on connect
        manager.getHealth().then(setGatewayHealth).catch(() => {});
        manager.listAgents().then(setGatewayAgents).catch(() => {});
        manager.listSessions().then(setSessions).catch(() => {});
      } else if (state === "disconnected") {
        addActivity({
          type: "system",
          message: "Disconnected from gateway",
        });
      } else if (state === "error") {
        addActivity({
          type: "system",
          message: "Gateway connection error",
        });
      }
    });

    // Wire gateway events to store
    const unsub2 = client.on("agent.event", (evt: EventFrame) => {
      handleAgentEvent(evt.payload as unknown as AgentEventPayload);
    });

    const unsub3 = client.on("chat.event", (evt: EventFrame) => {
      handleChatEvent(evt.payload as unknown as ChatEventPayload);
    });

    const unsub4 = client.on("health.changed", (evt: EventFrame) => {
      setGatewayHealth(evt.payload as unknown as Parameters<typeof setGatewayHealth>[0]);
    });

    cleanupRef.current = [unsub1, unsub2, unsub3, unsub4];

    // Connect
    client.connect();

    return () => {
      for (const unsub of cleanupRef.current) unsub();
      cleanupRef.current = [];
    };
  }, [
    gatewayUrl,
    setConnectionState,
    setGatewayHealth,
    setGatewayAgents,
    setSessions,
    handleAgentEvent,
    handleChatEvent,
    addActivity,
  ]);

  const connect = useCallback(
    (url?: string) => {
      if (url) useMissionControlStore.getState().setGatewayUrl(url);
      // Recreate client with new URL if changed
      if (url && sharedClient) {
        sharedClient.disconnect();
        sharedClient = null;
        sharedManager = null;
      }
      const client = getClient(
        url ?? useMissionControlStore.getState().gatewayUrl
      );
      getManager(client);
      client.connect();
    },
    []
  );

  const disconnect = useCallback(() => {
    sharedClient?.disconnect();
  }, []);

  return {
    connect,
    disconnect,
    get client() {
      return sharedClient;
    },
    get manager() {
      return sharedManager;
    },
  };
}
