"use client";

import { useEffect, useState } from "react";
import type { DiffResponse } from "@/lib/revision";

function pct(v: number | null) {
  return v === null ? null : Math.round(v * 100);
}

export default function BeforeAfter() {
  const [data, setData] = useState<DiffResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/revision/diff")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
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

  if (!data) {
    return <p className="text-sm text-gray-500">Cargando comparación…</p>;
  }

  const s = data.summary;
  const before = pct(s.overall_before);
  const after = pct(s.overall_after);
  const delta =
    before !== null && after !== null ? after - before : null;

  const summaryStats = [
    { label: "Generados", value: s.generated, color: "text-sky-400" },
    { label: "Rechazados por duplicado", value: s.rejected_dup, color: "text-amber-400" },
    { label: "Rechazados por revisión", value: s.rejected_review, color: "text-red-400" },
    { label: "Aprobados", value: s.approved, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Antes y después</h2>
        <p className="mt-1 text-sm text-gray-400">
          Precisión por área antes y después del último ciclo de robustez.
        </p>
      </div>

      {/* Overall before → after */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-sm text-gray-400">Precisión global</p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-2xl font-extrabold text-gray-300">
            {before === null ? "—" : `${before}%`}
          </span>
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <span className="text-2xl font-extrabold text-emerald-400">
            {after === null ? "—" : `${after}%`}
          </span>
          {delta !== null && (
            <span
              className={`text-sm font-semibold ${
                delta >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {delta} pts
            </span>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryStats.map((i) => (
          <div
            key={i.label}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
          >
            <p className={`text-2xl font-extrabold ${i.color}`}>
              {i.value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{i.label}</p>
          </div>
        ))}
      </div>

      {/* Per-area before/after bars */}
      <div className="space-y-3">
        {data.areas.map((a) => {
          const b = pct(a.before);
          const af = pct(a.after);
          const hasData = b !== null || af !== null;
          return (
            <div
              key={a.code}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold">
                  {a.code}
                </span>
                <span className="truncate text-sm font-medium">{a.title}</span>
              </div>
              {hasData ? (
                <div className="mt-3 space-y-2">
                  <Bar label="Antes" value={b} className="bg-gray-500" />
                  <Bar label="Después" value={af} className="bg-emerald-500" />
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Sin datos todavía.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  className,
}: {
  label: string;
  value: number | null;
  className: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-gray-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${className}`}
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-gray-300">
        {value === null ? "—" : `${value}%`}
      </span>
    </div>
  );
}
