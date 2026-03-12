import { NextRequest, NextResponse } from "next/server";
import { buildCatalog, searchAgents } from "@/lib/agents/catalog";
import type { Division } from "@/types/agent";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") || undefined;
  const divisionsParam = searchParams.get("divisions");
  const divisions = divisionsParam
    ? (divisionsParam.split(",") as Division[])
    : undefined;

  const catalog = buildCatalog();
  const agents = searchAgents(catalog, query, divisions);

  return NextResponse.json({
    agents,
    divisions: catalog.divisions,
    total: catalog.total,
    filtered: agents.length,
  });
}
