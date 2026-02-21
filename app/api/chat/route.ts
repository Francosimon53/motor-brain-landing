import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.MOTOR_BRAIN_API_URL ||
  "https://abasensei-motor-brain-production.up.railway.app";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const mensajes = body.mensajes || [];
  const lastUserMsg = [...mensajes]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  const texto = lastUserMsg?.content || "";

  const response = await fetch(`${API_URL}/predecir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texto,
      contexto: body.contexto_pdf || undefined,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
