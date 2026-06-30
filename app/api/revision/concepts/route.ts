import { requireReviewerApi } from "@/lib/revision-access";
import { NextResponse } from "next/server";
import type { ConceptsResponse } from "@/lib/concepts";

// GET /api/revision/concepts → all pending concept_queue rows (oldest first).
// The list only ever shows 'pendiente'; rows leave the queue once decided.
export async function GET() {
  const access = await requireReviewerApi();
  if ("error" in access) return access.error;

  const { supabase } = access;

  const { data, error } = await supabase
    .from("concept_queue")
    .select("*")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const body: ConceptsResponse = { concepts: data ?? [] };
  return NextResponse.json(body);
}
