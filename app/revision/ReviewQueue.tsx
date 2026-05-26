"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AREA_CODES,
  AREA_TITLES,
  type AreaCode,
  type Decision,
  type GoldFragment,
  type QueueResponse,
} from "@/lib/revision";

interface Tally {
  approved: number;
  corrected: number;
  rejected: number;
}

export default function ReviewQueue() {
  const [fragment, setFragment] = useState<GoldFragment | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [tally, setTally] = useState<Tally>({
    approved: 0,
    corrected: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [error, setError] = useState("");

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setError("");
    setCorrecting(false);
    try {
      const res = await fetch("/api/revision/queue");
      const data: QueueResponse & { error?: string } = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setFragment(data.fragment);
      // Capture the queue size once, on first load, so "X de N" stays stable.
      setTotal((prev) => (prev === null ? data.remaining : prev));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNext();
  }, [fetchNext]);

  async function submit(decision: Decision, finalArea?: AreaCode) {
    if (!fragment || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/revision/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fragment_id: fragment.id,
          decision,
          final_area: finalArea,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar la decisión");
        return;
      }
      setTally((t) => ({ ...t, [decision]: t[decision] + 1 }));
      await fetchNext();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const processed = tally.approved + tally.corrected + tally.rejected;
  const position = Math.min(processed + 1, total ?? 0);

  const note = (
    <p className="mt-6 text-center text-xs text-gray-500">
      Claude pre-anota · el humano confirma. Motor Brain nunca etiqueta su propio
      gold.
    </p>
  );

  if (loading && !fragment) {
    return <p className="text-sm text-gray-500">Cargando cola…</p>;
  }

  if (error && !fragment) {
    return (
      <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
        {error}
      </p>
    );
  }

  // Empty queue → completion summary.
  if (!fragment) {
    return (
      <div className="space-y-6">
        <Tallies tally={tally} />
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Cola completada</h3>
          <p className="mt-1 text-sm text-gray-400">
            No quedan fragmentos pendientes. Revisaste {processed}{" "}
            {processed === 1 ? "fragmento" : "fragmentos"}.
          </p>
        </div>
        {note}
      </div>
    );
  }

  const confidencePct =
    fragment.confidence === null
      ? null
      : Math.round(fragment.confidence * 100);
  const progressPct = total ? (processed / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <Tallies tally={tally} />

      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            Fragmento {position} de {total ?? "?"}
          </span>
          <span className="text-gray-500">{processed} revisados</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Fragment card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-base leading-relaxed text-gray-100">
          {fragment.fragment_text}
        </p>

        <div className="mt-5 space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-violet-400">
                Área propuesta por Claude
              </span>
            </div>
            {confidencePct !== null && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300">
                confianza {confidencePct}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-sm font-bold text-violet-300">
              {fragment.proposed_area}
            </span>
            <span className="text-sm font-medium">
              {AREA_TITLES[fragment.proposed_area]}
            </span>
          </div>
          {fragment.reason && (
            <p className="text-sm text-gray-400">{fragment.reason}</p>
          )}
        </div>

        {/* Actions */}
        {!correcting ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => submit("approved")}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Aprobar
            </button>
            <button
              onClick={() => setCorrecting(true)}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Corregir
            </button>
            <button
              onClick={() => submit("rejected")}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-amber-300">
                Elige el área correcta:
              </p>
              <button
                onClick={() => setCorrecting(false)}
                disabled={submitting}
                className="text-xs text-gray-500 transition hover:text-gray-300"
              >
                Cancelar
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {AREA_CODES.map((code) => (
                <button
                  key={code}
                  onClick={() => submit("corrected", code)}
                  disabled={submitting || code === fragment.proposed_area}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left text-sm transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-bold">
                    {code}
                  </span>
                  <span className="truncate text-gray-300">
                    {AREA_TITLES[code]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      {note}
    </div>
  );
}

function Tallies({ tally }: { tally: Tally }) {
  const items = [
    { label: "Aprobados", value: tally.approved, color: "text-emerald-400" },
    { label: "Corregidos", value: tally.corrected, color: "text-amber-400" },
    { label: "Rechazados", value: tally.rejected, color: "text-red-400" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((i) => (
        <div
          key={i.label}
          className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
        >
          <p className={`text-2xl font-extrabold ${i.color}`}>{i.value}</p>
          <p className="mt-0.5 text-xs text-gray-400">{i.label}</p>
        </div>
      ))}
    </div>
  );
}
