"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Bot,
  Send,
  User,
  ChevronDown,
} from "lucide-react";
import { DIVISION_LABELS, type Division } from "@/types/agent";

interface TeamAgent {
  agent_id: string;
  agent: {
    id: string;
    slug: string;
    name: string;
    emoji: string;
    color: string;
    division: string;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent_id: string | null;
  created_at: string;
}

export default function ChatPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const supabase = useMemo(() => createClient(), []);

  const [teamName, setTeamName] = useState("");
  const [agents, setAgents] = useState<TeamAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<TeamAgent | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load team and agents
  useEffect(() => {
    async function load() {
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();
      if (team) setTeamName(team.name);

      const { data: teamAgents } = await supabase
        .from("team_agents")
        .select(
          "agent_id, agent:agents(id, slug, name, emoji, color, division)"
        )
        .eq("team_id", teamId)
        .order("sort_order");

      const mapped = (teamAgents ?? []).map(
        (row: Record<string, unknown>) => ({
          ...(row as unknown as TeamAgent),
          agent: Array.isArray(row.agent) ? row.agent[0] : row.agent,
        })
      ) as TeamAgent[];

      setAgents(mapped);
      if (mapped.length > 0) setSelectedAgent(mapped[0]);
    }
    load();
  }, [supabase, teamId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const agentMap = useMemo(() => {
    const map = new Map<string, TeamAgent["agent"]>();
    for (const ta of agents) {
      map.set(ta.agent_id, ta.agent);
    }
    return map;
  }, [agents]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedAgent || streaming) return;

    const userMsg = input.trim();
    setInput("");
    setStreaming(true);
    setStreamText("");

    // Optimistic user message
    const tempUserMsg: Message = {
      id: "temp-" + Date.now(),
      role: "user",
      content: userMsg,
      agent_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userMsg,
          agent_id: selectedAgent.agent_id,
          team_id: teamId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accum = "";
      let newConvId = conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);
            if (event.type === "conversation_id") {
              newConvId = event.id;
              setConversationId(event.id);
            } else if (event.type === "text") {
              accum += event.text;
              setStreamText(accum);
            } else if (event.type === "done") {
              // Final: add assistant message
              const assistantMsg: Message = {
                id: "msg-" + Date.now(),
                role: "assistant",
                content: accum,
                agent_id: selectedAgent.agent_id,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, assistantMsg]);
              setStreamText("");
            } else if (event.type === "error") {
              console.error("Stream error:", event.message);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, selectedAgent, streaming, conversationId, teamId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href={`/teams/${teamId}`}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{teamName}</p>
        </div>

        {/* Agent selector */}
        <div className="relative">
          <button
            onClick={() => setShowAgentPicker(!showAgentPicker)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            {selectedAgent && (
              <>
                <span>{selectedAgent.agent.emoji || "🤖"}</span>
                <span className="font-medium">{selectedAgent.agent.name}</span>
              </>
            )}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          {showAgentPicker && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto p-1">
                {agents.map((ta) => (
                  <button
                    key={ta.agent_id}
                    onClick={() => {
                      setSelectedAgent(ta);
                      setShowAgentPicker(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${
                      selectedAgent?.agent_id === ta.agent_id
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <span>{ta.agent.emoji || "🤖"}</span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">{ta.agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DIVISION_LABELS[ta.agent.division as Division] ??
                          ta.agent.division}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="size-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold mb-1">
              Chat with {selectedAgent?.agent.name ?? "your team"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Send a message to start a conversation. You can switch between
              agents in your team using the dropdown above.
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => {
            const agent = msg.agent_id ? agentMap.get(msg.agent_id) : null;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="flex size-8 items-center justify-center rounded-full shrink-0 text-sm"
                    style={{
                      backgroundColor: (agent?.color ?? "#6366F1") + "20",
                    }}
                  >
                    {agent?.emoji || "🤖"}
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" && agent && (
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {agent.name}
                    </p>
                  )}
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 shrink-0">
                    <User className="size-4 text-primary" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming indicator */}
          {streaming && streamText && (
            <div className="flex gap-3">
              <div
                className="flex size-8 items-center justify-center rounded-full shrink-0 text-sm"
                style={{
                  backgroundColor:
                    (selectedAgent?.agent.color ?? "#6366F1") + "20",
                }}
              >
                {selectedAgent?.agent.emoji || "🤖"}
              </div>
              <div className="rounded-2xl bg-muted px-4 py-2.5 max-w-[80%]">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {selectedAgent?.agent.name}
                </p>
                <div className="text-sm whitespace-pre-wrap">{streamText}</div>
              </div>
            </div>
          )}

          {streaming && !streamText && (
            <div className="flex gap-3">
              <div
                className="flex size-8 items-center justify-center rounded-full shrink-0 text-sm animate-pulse"
                style={{
                  backgroundColor:
                    (selectedAgent?.agent.color ?? "#6366F1") + "20",
                }}
              >
                {selectedAgent?.agent.emoji || "🤖"}
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedAgent
                ? `Message ${selectedAgent.agent.name}...`
                : "Select an agent to chat..."
            }
            disabled={!selectedAgent || streaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 max-h-32"
            style={{
              height: "auto",
              minHeight: "42px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedAgent || streaming}
            className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
