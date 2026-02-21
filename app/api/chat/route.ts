import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.MOTOR_BRAIN_API_URL ||
  "https://web-production-16afd.up.railway.app";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("api_key")
    .eq("id", user.id)
    .single();

  if (!profile?.api_key) {
    return NextResponse.json({ error: "No API key found" }, { status: 400 });
  }

  const body = await request.json();

  const response = await fetch(`${API_URL}/predecir/rag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": profile.api_key,
    },
    body: JSON.stringify({
      mensajes: body.mensajes || [],
      contexto_pdf: body.contexto_pdf || "",
    }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
