// Shared types and constants for the Consola de Revisión Clínica.

export const AREA_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
export type AreaCode = (typeof AREA_CODES)[number];

// BCBA Task List (6th ed.) — Spanish titles.
export const AREA_TITLES: Record<AreaCode, string> = {
  A: "Fundamentos conductuales y filosóficos",
  B: "Conceptos y principios",
  C: "Medición y análisis de datos",
  D: "Diseño experimental",
  E: "Ética",
  F: "Evaluación del comportamiento",
  G: "Procedimientos de cambio de conducta",
  H: "Selección e implementación de intervenciones",
  I: "Supervisión y gestión",
};

export const DECISIONS = ["approved", "corrected", "rejected"] as const;
export type Decision = (typeof DECISIONS)[number];

export type FragmentStatus = "pending" | "approved" | "corrected" | "rejected";

export interface GoldFragment {
  id: string;
  fragment_text: string;
  proposed_area: AreaCode;
  reason: string | null;
  confidence: number | null;
  status: FragmentStatus;
  final_area: AreaCode | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface RobustnessRun {
  id: string;
  run_at: string;
  area: string | null;
  accuracy_before: number | null;
  accuracy_after: number | null;
  generated: number | null;
  rejected_dup: number | null;
  rejected_review: number | null;
  approved: number | null;
}

export interface WeaknessArea {
  code: AreaCode;
  title: string;
  precision: number | null; // 0..1, null when no run exists yet
  weak: boolean; // flagged "el loop atacará"
}

export interface QueueResponse {
  fragment: GoldFragment | null;
  remaining: number; // pending fragments still in the queue (incl. the returned one)
}

export interface DiffArea {
  code: AreaCode;
  title: string;
  before: number | null;
  after: number | null;
}

export interface DiffResponse {
  areas: DiffArea[];
  summary: {
    generated: number;
    rejected_dup: number;
    rejected_review: number;
    approved: number;
    overall_before: number | null;
    overall_after: number | null;
  };
}

// Precision thresholds (shared so the bar colors stay consistent).
export const WEAK_THRESHOLD = 0.75; // below this → red, "el loop atacará"
export const OK_THRESHOLD = 0.88; // at/above this → green; between → amber

/**
 * Reduces a list of robustness runs (any order) to the most recent run per
 * area, keyed by area code. Runs without an area are ignored.
 */
export function latestRunByArea(
  runs: RobustnessRun[]
): Map<string, RobustnessRun> {
  const latest = new Map<string, RobustnessRun>();
  for (const run of runs) {
    if (!run.area) continue;
    const current = latest.get(run.area);
    if (!current || new Date(run.run_at) > new Date(current.run_at)) {
      latest.set(run.area, run);
    }
  }
  return latest;
}
