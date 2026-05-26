import { requireReviewerApi } from "@/lib/revision-access";
import { NextResponse } from "next/server";
import {
  AREA_CODES,
  AREA_TITLES,
  latestRunByArea,
  type DiffArea,
  type DiffResponse,
  type RobustnessRun,
} from "@/lib/revision";

// GET /api/revision/diff → latest robustness run per area (before/after) plus
// an aggregate summary across those latest runs.
export async function GET() {
  const access = await requireReviewerApi();
  if ("error" in access) return access.error;

  const { supabase } = access;

  const { data, error } = await supabase
    .from("robustness_runs")
    .select("*")
    .order("run_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const latest = latestRunByArea((data ?? []) as RobustnessRun[]);

  const areas: DiffArea[] = AREA_CODES.map((code) => {
    const run = latest.get(code);
    return {
      code,
      title: AREA_TITLES[code],
      before: run?.accuracy_before ?? null,
      after: run?.accuracy_after ?? null,
    };
  });

  const runs = [...latest.values()];
  const sum = (pick: (r: RobustnessRun) => number | null) =>
    runs.reduce((acc, r) => acc + (pick(r) ?? 0), 0);

  const beforeVals = runs
    .map((r) => r.accuracy_before)
    .filter((v): v is number => v !== null);
  const afterVals = runs
    .map((r) => r.accuracy_after)
    .filter((v): v is number => v !== null);
  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const body: DiffResponse = {
    areas,
    summary: {
      generated: sum((r) => r.generated),
      rejected_dup: sum((r) => r.rejected_dup),
      rejected_review: sum((r) => r.rejected_review),
      approved: sum((r) => r.approved),
      overall_before: avg(beforeVals),
      overall_after: avg(afterVals),
    },
  };

  return NextResponse.json(body);
}
