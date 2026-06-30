"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import WeaknessMap from "./WeaknessMap";
import ReviewQueue from "./ReviewQueue";
import BeforeAfter from "./BeforeAfter";
import ConceptQueue from "./ConceptQueue";

type Tab = "weakness" | "queue" | "diff" | "concepts";

const TABS: { id: Tab; label: string }[] = [
  { id: "weakness", label: "Mapa de debilidades" },
  { id: "queue", label: "Cola de revisión" },
  { id: "diff", label: "Antes y después" },
  { id: "concepts", label: "Conceptos" },
];

export default function RevisionConsole({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("weakness");
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 md:px-10">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                Motor Brain
              </span>
            </Link>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Consola de Revisión Clínica
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-gray-500 sm:inline">
              {email}
            </span>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              Panel
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="border-b border-white/5">
        <div className="mx-auto flex max-w-5xl gap-1 px-6 md:px-10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-10">
        {tab === "weakness" && <WeaknessMap />}
        {tab === "queue" && <ReviewQueue />}
        {tab === "diff" && <BeforeAfter />}
        {tab === "concepts" && <ConceptQueue />}
      </main>
    </div>
  );
}
