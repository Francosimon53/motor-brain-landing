import { requireReviewerApi } from "@/lib/revision-access";
import { NextRequest, NextResponse } from "next/server";
import {
  CONCEPT_ACTIONS,
  type ConceptAction,
  type ConceptPair,
} from "@/lib/concepts";

// POST /api/revision/concepts/decision
// Body: { id, action: 'aprobar'|'rechazar'|'corregir', motivo?, pair_es?, pair_en? }
//
// Records the reviewer's decision on a single concept and stamps reviewer + time.
// IMPORTANT: 'aprobar' only marks the queue row — it does NOT publish anything to
// ABA Sensei. Publishing is a separate step handled later.
type Body = {
  id?: string;
  action?: string;
  motivo?: string;
  pair_es?: ConceptPair;
  pair_en?: ConceptPair;
};

function isPlainObject(v: unknown): v is ConceptPair {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(request: NextRequest) {
  const access = await requireReviewerApi();
  if ("error" in access) return access.error;

  const { supabase, userId } = access;

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;
  const action = body.action as ConceptAction | undefined;
  const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }
  if (!action || !CONCEPT_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "action inválida (aprobar | rechazar | corregir)" },
      { status: 400 }
    );
  }

  const reviewedAt = new Date().toISOString();

  // Build the update payload per action.
  let update: Record<string, unknown>;

  if (action === "aprobar") {
    update = {
      estado: "aprobado",
      reviewer_id: userId,
      reviewed_at: reviewedAt,
    };
  } else if (action === "rechazar") {
    if (!motivo) {
      return NextResponse.json(
        { error: "motivo requerido al rechazar" },
        { status: 400 }
      );
    }
    update = {
      estado: "rechazado",
      reviewer_id: userId,
      reviewed_at: reviewedAt,
      notas: motivo,
    };
  } else {
    // corregir
    if (!isPlainObject(body.pair_es) || !isPlainObject(body.pair_en)) {
      return NextResponse.json(
        { error: "pair_es y pair_en (objeto) requeridos al corregir" },
        { status: 400 }
      );
    }
    if (!motivo) {
      return NextResponse.json(
        { error: "motivo requerido al corregir" },
        { status: 400 }
      );
    }

    // Read the current row to capture the authoritative "antes".
    const { data: current, error: readError } = await supabase
      .from("concept_queue")
      .select("pair_es, pair_en")
      .eq("id", id)
      .eq("estado", "pendiente")
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!current) {
      return NextResponse.json(
        { error: "Concepto no encontrado o ya revisado" },
        { status: 409 }
      );
    }

    update = {
      pair_es: body.pair_es,
      pair_en: body.pair_en,
      correccion: {
        antes: { pair_es: current.pair_es, pair_en: current.pair_en },
        despues: { pair_es: body.pair_es, pair_en: body.pair_en },
        motivo,
      },
      estado: "corregido",
      reviewer_id: userId,
      reviewed_at: reviewedAt,
    };
  }

  const { data, error } = await supabase
    .from("concept_queue")
    .update(update)
    .eq("id", id)
    .eq("estado", "pendiente") // only act on still-pending concepts
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Concepto no encontrado o ya revisado" },
      { status: 409 }
    );
  }

  return NextResponse.json({ concept: data });
}
