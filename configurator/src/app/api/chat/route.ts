import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Admin client for writing messages (bypasses RLS)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const {
    conversation_id,
    message,
    agent_id,
    team_id,
  }: {
    conversation_id?: string;
    message: string;
    agent_id: string;
    team_id: string;
  } = body;

  if (!message || !agent_id || !team_id) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Fetch the agent's system prompt
  const { data: agent, error: agentErr } = await admin
    .from("agents")
    .select("id, name, system_prompt, default_model")
    .eq("id", agent_id)
    .single();

  if (agentErr || !agent) {
    return new Response("Agent not found", { status: 404 });
  }

  // Create or fetch conversation
  let convId = conversation_id;
  if (!convId) {
    const { data: conv, error: convErr } = await admin
      .from("conversations")
      .insert({
        team_id,
        user_id: user.id,
        title: message.slice(0, 80),
        primary_agent_id: agent_id,
      })
      .select("id")
      .single();

    if (convErr || !conv) {
      return new Response("Failed to create conversation", { status: 500 });
    }
    convId = conv.id;
  }

  // Save user message
  await admin.from("messages").insert({
    conversation_id: convId,
    role: "user",
    content: message,
  });

  // Fetch conversation history
  const { data: history } = await admin
    .from("messages")
    .select("role, content, agent_id")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true });

  const messages: Anthropic.MessageParam[] = (history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Stream from Anthropic
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        // Send conversation_id as first event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "conversation_id", id: convId })}\n\n`
          )
        );

        const response = anthropic.messages.stream({
          model: agent.default_model || "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: agent.system_prompt || `You are ${agent.name}, an AI assistant.`,
          messages,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
              )
            );
          }
        }

        const finalMessage = await response.finalMessage();

        // Save assistant message
        await admin.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: fullResponse,
          agent_id: agent_id,
          token_count_input: finalMessage.usage.input_tokens,
          token_count_output: finalMessage.usage.output_tokens,
          model_used: agent.default_model || "claude-sonnet-4-20250514",
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", conversation_id: convId })}\n\n`
          )
        );
      } catch (err) {
        console.error("Anthropic API error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Failed to generate response" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
