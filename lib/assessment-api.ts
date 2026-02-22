import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const ASSESSMENT_API_URL =
  process.env.ASSESSMENT_API_URL ||
  "https://web-production-d6477.up.railway.app";

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

  if (!profile?.api_key) {
    return {
      error: NextResponse.json(
        { error: "No API key configured. Check your profile." },
        { status: 403 }
      ),
    };
  }

  return { apiKey: profile.api_key as string };
}

export function backendUrl(path: string): string {
  return `${ASSESSMENT_API_URL}${path}`;
}
