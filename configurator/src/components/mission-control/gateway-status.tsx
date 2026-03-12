"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMissionControlStore } from "@/lib/store/mission-control";
import { useGateway } from "@/lib/openclaw/use-gateway";
import type { ConnectionState } from "@/lib/openclaw/types";

const STATE_CONFIG: Record<
  ConnectionState,
  { label: string; dotClass: string; textClass: string }
> = {
  disconnected: {
    label: "Disconnected",
    dotClass: "bg-zinc-500",
    textClass: "text-zinc-400",
  },
  connecting: {
    label: "Connecting...",
    dotClass: "bg-yellow-500 animate-pulse",
    textClass: "text-yellow-500",
  },
  handshaking: {
    label: "Handshaking...",
    dotClass: "bg-yellow-500 animate-pulse",
    textClass: "text-yellow-500",
  },
  connected: {
    label: "Connected",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-500",
  },
  reconnecting: {
    label: "Reconnecting...",
    dotClass: "bg-amber-500 animate-pulse",
    textClass: "text-amber-500",
  },
  error: {
    label: "Error",
    dotClass: "bg-red-500",
    textClass: "text-red-500",
  },
};

export function GatewayStatus() {
  const connectionState = useMissionControlStore((s) => s.connectionState);
  const gatewayUrl = useMissionControlStore((s) => s.gatewayUrl);
  const gatewayHealth = useMissionControlStore((s) => s.gatewayHealth);
  const { connect, disconnect } = useGateway();

  const [urlInput, setUrlInput] = useState(gatewayUrl);
  const [expanded, setExpanded] = useState(false);

  const config = STATE_CONFIG[connectionState];
  const isConnected = connectionState === "connected";

  return (
    <Card size="sm">
      <CardContent>
        {/* Compact view */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm"
          >
            <span className={cn("size-2 rounded-full", config.dotClass)} />
            <span className={cn("font-medium", config.textClass)}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              OpenClaw Gateway
            </span>
            <svg
              className={cn(
                "size-3 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isConnected ? (
            <Button variant="outline" size="xs" onClick={disconnect}>
              Disconnect
            </Button>
          ) : connectionState === "disconnected" ||
            connectionState === "error" ? (
            <Button size="xs" onClick={() => connect(urlInput)}>
              Connect
            </Button>
          ) : null}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="ws://127.0.0.1:18789"
                className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs"
                disabled={isConnected}
              />
              {!isConnected && (
                <Button size="xs" onClick={() => connect(urlInput)}>
                  Connect
                </Button>
              )}
            </div>

            {gatewayHealth && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Version: </span>
                  <span className="font-mono">{gatewayHealth.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Agents: </span>
                  <span className="font-medium">{gatewayHealth.agents}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sessions: </span>
                  <span className="font-medium">{gatewayHealth.sessions}</span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              {isConnected
                ? "Live data from OpenClaw gateway"
                : "Using mock data. Connect to a running OpenClaw instance for live updates."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
