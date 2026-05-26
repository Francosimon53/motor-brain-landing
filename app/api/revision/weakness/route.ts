import { requireReviewerApi } from "@/lib/revision-access";
import { NextResponse } from "next/server";
import {
  AREA_CODES,
  AREA_TITLES,
  OK_THRESHOLD,
  latestRunByArea,
  type RobustnessRun,
  type WeaknessArea,
} from "@/lib/revision";

// GET /api/revision/weakness → per-area precision from the latest robustness
// run. Areas without any run return precision: null.
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

  const areas: WeaknessArea[] = AREA_CODES.map((code) => {
    const run = latest.get(code);
    const precision =
      run?.accuracy_after ?? run?.accuracy_before ?? null;
    return {
      code,
      title: AREA_TITLES[code],
      precision,
      weak: precision !== null && precision < OK_THRESHOLD,
    };
  });

  return NextResponse.json({ areas });
}
