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

    const res = await fetch(backendUrl(`/v1/assessment/${id}/export`), {
      method: "POST",
      headers: {
        "X-API-Key": ctx.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const blob = await res.blob();
    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    const contentDisposition = res.headers.get("content-disposition");

    if (contentType) headers.set("Content-Type", contentType);
    if (contentDisposition)
      headers.set("Content-Disposition", contentDisposition);

    return new NextResponse(blob, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: "Failed to export assessment" },
      { status: 502 }
    );
  }
}
