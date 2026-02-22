import { getAuthContext, backendUrl } from "@/lib/assessment-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;

    // Generate endpoint takes no request body — only path + query params
    const res = await fetch(backendUrl(`/v1/assessment/${id}/generate`), {
      method: "POST",
      headers: {
        "X-API-Key": ctx.apiKey,
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    console.log(`Generate response ${res.status}:`, data);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Generate proxy exception:", err);
    return NextResponse.json(
      {
        error: "Failed to generate assessment",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
