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
    const incomingForm = await request.formData();

    // Reconstruct FormData to ensure files forward correctly
    const outgoingForm = new FormData();
    for (const [key, value] of incomingForm.entries()) {
      if (value instanceof File) {
        // Re-wrap as File with explicit name to preserve metadata
        const bytes = await value.arrayBuffer();
        const blob = new Blob([bytes], { type: value.type || "application/octet-stream" });
        outgoingForm.append(key, blob, value.name);
      } else {
        outgoingForm.append(key, value);
      }
    }

    const url = backendUrl(`/v1/assessment/${id}/upload`);
    console.log(`Upload proxy → ${url} (files: ${incomingForm.getAll("files").length})`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "X-API-Key": ctx.apiKey },
      body: outgoingForm,
    });

    // Safely parse response (might not be JSON)
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`Upload response ${res.status}:`, data);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Upload proxy exception:", err);
    return NextResponse.json(
      {
        error: "Failed to upload document",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
