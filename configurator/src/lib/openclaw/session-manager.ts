import { GatewayClient } from "./gateway-client";
import type {
  AgentInfo,
  AgentRunParams,
  AgentRunResult,
  SessionInfo,
  GatewayHealth,
  ResponseFrame,
} from "./types";

/**
 * Higher-level session and agent management built on top of GatewayClient.
 * Provides typed methods for common operations.
 */
export class SessionManager {
  constructor(private client: GatewayClient) {}

  // --- Health ---

  async getHealth(): Promise<GatewayHealth> {
    const res = await this.client.request("health");
    this.assertOk(res, "health");
    return res.payload as unknown as GatewayHealth;
  }

  // --- Agents ---

  async listAgents(): Promise<AgentInfo[]> {
    const res = await this.client.request("agents.list");
    this.assertOk(res, "agents.list");
    return (res.payload?.agents ?? []) as AgentInfo[];
  }

  async getAgentIdentity(agentId: string): Promise<Record<string, unknown>> {
    const res = await this.client.request("agent.identity", { agentId });
    this.assertOk(res, "agent.identity");
    return res.payload ?? {};
  }

  // --- Agent Execution ---

  /** Send a task/message to an agent and get a runId back */
  async runAgent(params: AgentRunParams): Promise<AgentRunResult> {
    const res = await this.client.request("agent", params as unknown as Record<string, unknown>);
    this.assertOk(res, "agent");
    return res.payload as unknown as AgentRunResult;
  }

  /** Wait for a running agent task to complete */
  async waitForRun(
    runId: string,
    timeoutMs = 120000
  ): Promise<Record<string, unknown>> {
    const res = await this.client.request(
      "agent.wait",
      { runId, timeoutMs },
      timeoutMs + 5000
    );
    this.assertOk(res, "agent.wait");
    return res.payload ?? {};
  }

  /** Send a chat message within a session */
  async chatSend(
    message: string,
    sessionKey: string,
    idempotencyKey?: string
  ): Promise<AgentRunResult> {
    const res = await this.client.request("chat.send", {
      message,
      sessionKey,
      idempotencyKey: idempotencyKey ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    this.assertOk(res, "chat.send");
    return res.payload as unknown as AgentRunResult;
  }

  /** Abort an in-flight agent run */
  async chatAbort(runId: string): Promise<void> {
    const res = await this.client.request("chat.abort", { runId });
    this.assertOk(res, "chat.abort");
  }

  // --- Sessions ---

  async listSessions(): Promise<SessionInfo[]> {
    const res = await this.client.request("sessions.list");
    this.assertOk(res, "sessions.list");
    return (res.payload?.sessions ?? []) as SessionInfo[];
  }

  async resetSession(sessionKey: string): Promise<void> {
    const res = await this.client.request("sessions.reset", { sessionKey });
    this.assertOk(res, "sessions.reset");
  }

  async deleteSession(sessionKey: string): Promise<void> {
    const res = await this.client.request("sessions.delete", { sessionKey });
    this.assertOk(res, "sessions.delete");
  }

  // --- Inter-Agent Communication ---

  /** Send a handoff message from one agent session to another */
  async sendHandoff(
    fromSessionKey: string,
    toAgentId: string,
    context: string
  ): Promise<AgentRunResult> {
    return this.runAgent({
      message: context,
      agentId: toAgentId,
      sessionKey: `${toAgentId}:handoff-from-${fromSessionKey}`,
      label: `Handoff from ${fromSessionKey}`,
      extraSystemPrompt:
        "This is an inter-agent handoff. The context below comes from another agent. Review and continue the work.",
    });
  }

  // --- Models ---

  async listModels(): Promise<unknown[]> {
    const res = await this.client.request("models.list");
    this.assertOk(res, "models.list");
    return (res.payload?.models ?? []) as unknown[];
  }

  // --- Helpers ---

  private assertOk(res: ResponseFrame, method: string): void {
    if (!res.ok) {
      const errMsg = res.error?.message ?? "Unknown error";
      const code = res.error?.code ?? "UNKNOWN";
      throw new Error(`[${method}] ${code}: ${errMsg}`);
    }
  }
}
