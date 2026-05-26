"use client";

import { useEffect, useState } from "react";
import {
  OK_THRESHOLD,
  WEAK_THRESHOLD,
  type WeaknessArea,
} from "@/lib/revision";

// Tailwind classes per precision band (red < 75% · amber 75–88% · green > 88%).
function bandClasses(precision: number | null) {
  if (precision === null) return { bar: "bg-gray-600", text: "text-gray-500" };
  if (precision < WEAK_THRESHOLD)
    return { bar: "bg-red-500", text: "text-red-400" };
  if (precision < OK_THRESHOLD)
    return { bar: "bg-amber-500", text: "text-amber-400" };
  return { bar: "bg-emerald-500", text: "text-emerald-400" };
}

export default function WeaknessMap() {
  const [areas, setAreas] = useState<WeaknessArea[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/revision/weakness")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setAreas(d.areas);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (!areas) {
    return <p className="text-sm text-gray-500">Cargando mapa…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Mapa de debilidades</h2>
        <p className="mt-1 text-sm text-gray-400">
          Precisión por área (BCBA, 6.ª ed.) según la última ejecución de
          robustez. Las áreas débiles son las que el loop atacará.
        </p>
      </div>

      <div className="space-y-3">
        {areas.map((a) => {
          const band = bandClasses(a.precision);
          const pct = a.precision === null ? null : Math.round(a.precision * 100);
          return (
            <div
              key={a.code}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold">
                    {a.code}
                  </span>
                  <span className="truncate text-sm font-medium">{a.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {a.weak && (
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-300">
                      el loop atacará
                    </span>
                  )}
                  <span className={`text-sm font-bold ${band.text}`}>
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full transition-all ${band.bar}`}
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>
              {a.precision === null && (
                <p className="mt-2 text-xs text-gray-500">Sin datos todavía.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> &lt;75%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 75–88%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> &gt;88%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-600" /> sin datos
        </span>
      </div>
    </div>
  );
}
