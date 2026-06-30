"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConceptRow, ConceptsResponse } from "@/lib/concepts";
import ConceptCard from "./ConceptCard";

export default function ConceptQueue() {
  const [concepts, setConcepts] = useState<ConceptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchConcepts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/revision/concepts");
      const data: ConceptsResponse & { error?: string } = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setConcepts(data.concepts);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  // A decided concept leaves the pending queue → drop it from the list.
  const handleDone = useCallback((id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const note = (
    <p className="mt-2 text-center text-xs text-gray-500">
      Claude propone · el humano confirma. Aprobar marca la cola; la publicación a
      ABA Sensei es un paso aparte.
    </p>
  );

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando conceptos…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No hay conceptos pendientes</h3>
          <p className="mt-1 text-sm text-gray-400">
            Cuando el modelo genere nuevos pares de conceptos, aparecerán aquí
            para revisión.
          </p>
        </div>
        {note}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conceptos pendientes</h2>
        <span className="text-sm text-gray-500">
          {concepts.length}{" "}
          {concepts.length === 1 ? "concepto" : "conceptos"}
        </span>
      </div>

      <div className="space-y-5">
        {concepts.map((c) => (
          <ConceptCard key={c.id} concept={c} onDone={handleDone} />
        ))}
      </div>

      {note}
    </div>
  );
}
