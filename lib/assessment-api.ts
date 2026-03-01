import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const ASSESSMENT_API_URL =
  (process.env.ASSESSMENT_API_URL || "https://web-production-d6477.up.railway.app").trim();

export async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("api_key")
    .eq("id", user.id)
    .single();

  const apiKey =
    profile?.api_key || process.env.ASSESSMENT_TENANT_KEY || "ask_239f3cae046595427b0b27cfdbc6bee2";

  return { apiKey };
}

export function backendUrl(path: string): string {
  const url = `${ASSESSMENT_API_URL}${path}`;
  console.log(`[assessment-api] base=${ASSESSMENT_API_URL} → ${url}`);
  return url;
}
