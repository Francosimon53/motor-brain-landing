import { requireReviewerApi } from "@/lib/revision-access";
import { NextResponse } from "next/server";
import type { QueueResponse } from "@/lib/revision";

// GET /api/revision/queue → next single pending fragment + remaining count.
export async function GET() {
  const access = await requireReviewerApi();
  if ("error" in access) return access.error;

  const { supabase } = access;

  const { count } = await supabase
    .from("gold_fragments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data, error } = await supabase
    .from("gold_fragments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const body: QueueResponse = {
    fragment: data ?? null,
    remaining: count ?? 0,
  };
  return NextResponse.json(body);
}
