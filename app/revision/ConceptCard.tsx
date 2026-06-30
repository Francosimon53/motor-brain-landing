"use client";

import { useState } from "react";
import type { ConceptPair, ConceptRow } from "@/lib/concepts";

// One concept (ES/EN pair) with Approve / Reject / Correct actions.
// The pair payloads are free-form JSON: we never assume fixed keys — we walk the
// object and render each key as a labelled section. Correcting edits the same
// structure in place, preserving its shape.

type Mode = "view" | "rejecting" | "correcting";

export default function ConceptCard({
  concept,
  onDone,
}: {
  concept: ConceptRow;
  onDone: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reject state
  const [rejectReason, setRejectReason] = useState("");

  // Correct state — editable deep copies of each pair + a short "what was wrong".
  const [draftEs, setDraftEs] = useState<ConceptPair>(concept.pair_es);
  const [draftEn, setDraftEn] = useState<ConceptPair>(concept.pair_en);
  const [correctReason, setCorrectReason] = useState("");

  function startCorrecting() {
    setDraftEs(structuredClone(concept.pair_es));
    setDraftEn(structuredClone(concept.pair_en));
    setCorrectReason("");
    setError("");
    setMode("correcting");
  }

  async function post(body: Record<string, unknown>) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/revision/concepts/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: concept.id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar la decisión");
        return;
      }
      // Row left the pending queue → remove the card.
      onDone(concept.id);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  const title = concept.concepto_tipo || concept.slug;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-100">
            {title}
          </h3>
          {concept.concepto_tipo && concept.slug !== concept.concepto_tipo && (
            <p className="truncate text-xs text-gray-500">{concept.slug}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {concept.modelo && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
              {concept.modelo}
            </span>
          )}
          {concept.judge_score !== null && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300">
              juez {concept.judge_score}
            </span>
          )}
        </div>
      </div>

      {/* Concept body — two columns ES | EN */}
      <div className="grid gap-4 md:grid-cols-2">
        <PairColumn
          flag="🇪🇸"
          label="Español"
          pair={mode === "correcting" ? draftEs : concept.pair_es}
          editing={mode === "correcting"}
          onChange={setDraftEs}
        />
        <PairColumn
          flag="🇬🇧"
          label="English"
          pair={mode === "correcting" ? draftEn : concept.pair_en}
          editing={mode === "correcting"}
          onChange={setDraftEn}
        />
      </div>

      {/* Actions */}
      {mode === "view" && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => post({ action: "aprobar" })}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aprobar
          </button>
          <button
            onClick={startCorrecting}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Corregir
          </button>
          <button
            onClick={() => {
              setError("");
              setRejectReason("");
              setMode("rejecting");
            }}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      )}

      {/* Reject — motivo */}
      {mode === "rejecting" && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-red-300">
              Motivo del rechazo
            </label>
            <button
              onClick={() => setMode("view")}
              disabled={submitting}
              className="text-xs text-gray-500 transition hover:text-gray-300"
            >
              Cancelar
            </button>
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            placeholder="¿Por qué se rechaza este concepto?"
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-white/20 focus:outline-none"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() =>
                post({ action: "rechazar", motivo: rejectReason.trim() })
              }
              disabled={submitting || !rejectReason.trim()}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Guardando…" : "Confirmar rechazo"}
            </button>
          </div>
        </div>
      )}

      {/* Correct — edit + motivo */}
      {mode === "correcting" && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-amber-300">
              ¿Qué estaba mal? (nota corta)
            </label>
            <button
              onClick={() => setMode("view")}
              disabled={submitting}
              className="text-xs text-gray-500 transition hover:text-gray-300"
            >
              Cancelar
            </button>
          </div>
          <textarea
            value={correctReason}
            onChange={(e) => setCorrectReason(e.target.value)}
            rows={2}
            placeholder="Describe brevemente la corrección."
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-white/20 focus:outline-none"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() =>
                post({
                  action: "corregir",
                  motivo: correctReason.trim(),
                  pair_es: draftEs,
                  pair_en: draftEn,
                })
              }
              disabled={submitting || !correctReason.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Guardando…" : "Guardar corrección"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One language column: header + the generic key/value sections.
// ---------------------------------------------------------------------------
function PairColumn({
  flag,
  label,
  pair,
  editing,
  onChange,
}: {
  flag: string;
  label: string;
  pair: ConceptPair;
  editing: boolean;
  onChange: (next: ConceptPair) => void;
}) {
  const entries = Object.entries(pair ?? {});

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-violet-400">
        <span className="mr-1.5">{flag}</span>
        {label}
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Sin contenido.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div key={key}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {humanize(key)}
              </p>
              {editing ? (
                <ValueEditor
                  value={value}
                  onChange={(next) => onChange({ ...pair, [key]: next })}
                />
              ) : (
                <ValueView value={value} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only generic value renderer.
// ---------------------------------------------------------------------------
function ValueView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-sm text-gray-600">—</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-200">
        {value.map((item, i) => (
          <li key={i}>
            <ValueView value={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-2 border-l border-white/10 pl-3">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <p className="text-xs font-medium text-gray-500">{humanize(k)}</p>
            <ValueView value={v} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <span className="text-sm leading-relaxed text-gray-200">
      {String(value)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Editable generic value renderer — mirrors ValueView, preserving shape.
//   string/number/boolean → input/textarea
//   array of primitives   → textarea, one item per line
//   array of objects      → recurse per item
//   object                → recurse per key
// ---------------------------------------------------------------------------
function ValueEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  // Array
  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => !isObjectLike(v));
    if (allPrimitive) {
      // One item per line; blank lines are dropped on change.
      return (
        <textarea
          value={value.map((v) => String(v ?? "")).join("\n")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
            )
          }
          rows={Math.max(2, value.length)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-gray-100 focus:border-white/20 focus:outline-none"
        />
      );
    }
    return (
      <div className="space-y-2 border-l border-white/10 pl-3">
        {value.map((item, i) => (
          <ValueEditor
            key={i}
            value={item}
            onChange={(next) => {
              const copy = [...value];
              copy[i] = next;
              onChange(copy);
            }}
          />
        ))}
      </div>
    );
  }

  // Object
  if (isObjectLike(value)) {
    const obj = value as Record<string, unknown>;
    return (
      <div className="space-y-2 border-l border-white/10 pl-3">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k}>
            <p className="mb-1 text-xs font-medium text-gray-500">
              {humanize(k)}
            </p>
            <ValueEditor
              value={v}
              onChange={(next) => onChange({ ...obj, [k]: next })}
            />
          </div>
        ))}
      </div>
    );
  }

  // Primitive — preserve number type when the original was numeric.
  const wasNumber = typeof value === "number";
  return (
    <textarea
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => {
        const text = e.target.value;
        if (wasNumber && text.trim() !== "" && !Number.isNaN(Number(text))) {
          onChange(Number(text));
        } else {
          onChange(text);
        }
      }}
      rows={2}
      className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-gray-100 focus:border-white/20 focus:outline-none"
    />
  );
}

function isObjectLike(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Turn snake_case / camelCase keys into a readable label.
function humanize(key: string): string {
  const spaced = key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
