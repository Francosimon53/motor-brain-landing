import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const USE_OLLAMA = process.env.USE_OLLAMA?.trim() === "true";
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").trim();
const OLLAMA_MODEL = (process.env.OLLAMA_MODEL || "motorbrain-aba").trim();
const RAILWAY_URL =
  (process.env.MOTOR_BRAIN_API_URL || "https://abasensei-motor-brain-production.up.railway.app").trim();

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
  const pdfContext = body.contexto_pdf || "";

  if (USE_OLLAMA) {
    return handleOllama(mensajes, pdfContext);
  }
  return handleRailway(mensajes, pdfContext);
}

async function handleOllama(
  mensajes: { role: string; content: string }[],
  pdfContext: string
) {
  const systemContent =
    "You are Motor Brain, an ABA (Applied Behavior Analysis) clinical assistant." +
    (pdfContext ? `\n\nPDF Context:\n${pdfContext}` : "");

  const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: systemContent }, ...mensajes],
      stream: false,
    }),
  });

  if (!ollamaRes.ok) {
    const err = await ollamaRes.text();
    return NextResponse.json(
      { error: "Ollama error", detail: err },
      { status: 502 }
    );
  }

  const ollamaData = await ollamaRes.json();
  return NextResponse.json({
    respuesta: ollamaData.message.content,
    clasificacion: null,
  });
}

async function handleRailway(
  mensajes: { role: string; content: string }[],
  pdfContext: string
) {
  const lastUserMsg = [...mensajes]
    .reverse()
    .find((m) => m.role === "user");
  const texto = lastUserMsg?.content || "";

  const response = await fetch(`${RAILWAY_URL}/predecir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texto,
      contexto: pdfContext || undefined,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
