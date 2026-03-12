import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL =
  process.env.OPENCLAW_GATEWAY_URL ?? "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? "";

/**
 * GET /api/gateway - Health check / status
 */
export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/healthz`, {
      headers: GATEWAY_TOKEN
        ? { Authorization: `Bearer ${GATEWAY_TOKEN}` }
        : {},
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { connected: false, error: `Gateway returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ connected: true, ...data });
  } catch {
    return NextResponse.json(
      { connected: false, error: "Gateway unreachable" },
      { status: 503 }
    );
  }
}

/**
 * POST /api/gateway - Proxy RPC calls to the gateway's tools/invoke endpoint
 *
 * Body: { method: string, params: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    if (!method) {
      return NextResponse.json(
        { error: "Missing 'method' in request body" },
        { status: 400 }
      );
    }

    const res = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GATEWAY_TOKEN
          ? { Authorization: `Bearer ${GATEWAY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        tool: method,
        action: "json",
        args: params ?? {},
        sessionKey: "main",
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, payload: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 }
    );
  }
}
