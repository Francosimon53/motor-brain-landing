import { getAuthContext, backendUrl } from "@/lib/assessment-api";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  try {
    const { id } = await params;
    const formData = await request.formData();

    const res = await fetch(backendUrl(`/v1/assessment/${id}/upload`), {
      method: "POST",
      headers: { "X-API-Key": ctx.apiKey },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 502 }
    );
  }
}
