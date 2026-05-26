import { requireReviewerApi } from "@/lib/revision-access";
import { NextRequest, NextResponse } from "next/server";
import { AREA_CODES, DECISIONS, type AreaCode, type Decision } from "@/lib/revision";

// POST /api/revision/decision
// Body: { fragment_id: string, decision: 'approved'|'corrected'|'rejected', final_area?: AreaCode }
// Records the human decision on a fragment and stamps the reviewer + time.
export async function POST(request: NextRequest) {
  const access = await requireReviewerApi();
  if ("error" in access) return access.error;

  const { supabase, userId } = access;

  let body: { fragment_id?: string; decision?: string; final_area?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fragment_id } = body;
  const decision = body.decision as Decision | undefined;
  const final_area = body.final_area as AreaCode | undefined;

  if (!fragment_id || typeof fragment_id !== "string") {
    return NextResponse.json({ error: "fragment_id requerido" }, { status: 400 });
  }
  if (!decision || !DECISIONS.includes(decision)) {
    return NextResponse.json(
      { error: "decision inválida (approved | corrected | rejected)" },
      { status: 400 }
    );
  }
  if (decision === "corrected" && (!final_area || !AREA_CODES.includes(final_area))) {
    return NextResponse.json(
      { error: "final_area (A–I) requerido al corregir" },
      { status: 400 }
    );
  }

  // Determine the recorded final area: confirmed area for approved,
  // the chosen area for corrected, null for rejected.
  let finalAreaValue: AreaCode | null = null;
  if (decision === "corrected") {
    finalAreaValue = final_area!;
  } else if (decision === "approved") {
    const { data: existing } = await supabase
      .from("gold_fragments")
      .select("proposed_area")
      .eq("id", fragment_id)
      .maybeSingle();
    finalAreaValue = (existing?.proposed_area as AreaCode) ?? null;
  }

  const { data, error } = await supabase
    .from("gold_fragments")
    .update({
      status: decision,
      final_area: finalAreaValue,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", fragment_id)
    .eq("status", "pending") // only act on still-pending fragments
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Fragmento no encontrado o ya revisado" },
      { status: 409 }
    );
  }

  return NextResponse.json({ fragment: data });
}
