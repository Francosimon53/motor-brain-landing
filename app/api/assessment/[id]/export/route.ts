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
    const format = body.format || "pdf";

    const res = await fetch(backendUrl(`/v1/assessment/${id}/export`), {
      method: "POST",
      headers: {
        "X-API-Key": ctx.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errData;
      try {
        errData = JSON.parse(errText);
      } catch {
        errData = { error: errText || "Export failed" };
      }
      return NextResponse.json(errData, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "";

    // Backend returns JSON with a file_path (Supabase Storage URL)
    if (contentType.includes("application/json")) {
      const data = await res.json();
      const fileUrl =
        data.file_path || data.url || data.download_url || data.file_url;

      if (fileUrl) {
        // Fetch the actual file from Supabase Storage
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
          return NextResponse.json(
            { error: "Failed to download file from storage" },
            { status: 502 }
          );
        }

        const fileBlob = await fileRes.blob();
        const ext = format === "pdf" ? "pdf" : "docx";
        const headers = new Headers();
        const fileContentType = fileRes.headers.get("content-type");
        if (fileContentType) headers.set("Content-Type", fileContentType);
        headers.set(
          "Content-Disposition",
          `attachment; filename="assessment.${ext}"`
        );

        return new NextResponse(fileBlob, { status: 200, headers });
      }

      // No file URL — return the JSON so the frontend can handle it
      return NextResponse.json(data);
    }

    // Backend returned a direct file stream
    const blob = await res.blob();
    const headers = new Headers();
    if (contentType) headers.set("Content-Type", contentType);
    const contentDisposition = res.headers.get("content-disposition");
    if (contentDisposition)
      headers.set("Content-Disposition", contentDisposition);

    return new NextResponse(blob, { status: 200, headers });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Failed to export assessment" },
      { status: 502 }
    );
  }
}
