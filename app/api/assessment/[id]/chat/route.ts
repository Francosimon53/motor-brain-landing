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
    const body = await request.json();

    const res = await fetch(backendUrl(`/v1/assessment/${id}/chat`), {
      method: "POST",
      headers: {
        "X-API-Key": ctx.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 502 }
    );
  }
}
