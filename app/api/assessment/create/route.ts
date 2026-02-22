import { getAuthContext, backendUrl } from "@/lib/assessment-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();

    const res = await fetch(backendUrl("/v1/assessment/create"), {
      method: "POST",
      headers: {
        "X-API-Key": ctx.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    console.log(`Create response ${res.status}:`, data);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Create proxy exception:", err);
    return NextResponse.json(
      {
        error: "Failed to create assessment",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
