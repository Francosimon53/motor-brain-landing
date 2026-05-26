"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Mode = "magic" | "signin" | "signup";

// Reads the same-origin `next` redirect target from the URL, ignoring
// absolute/off-site values to avoid open-redirects.
function getNext(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") ? next : null;
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const next = getNext();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push(next ?? "/dashboard");
        router.refresh();
      }
    } else if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        setMessage("Revisa tu correo para confirmar tu cuenta.");
      } else {
        router.push(next ?? "/dashboard");
        router.refresh();
      }
    } else {
      const callback = `${window.location.origin}/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ""
      }`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback },
      });
      if (error) setError(error.message);
      else setSent(true);
    }

    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50";

  // Confirmation state after a magic link is sent.
  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
        <div className="w-full max-w-md text-center">
          <a
            href="/"
            className="mb-8 block text-2xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Motor Brain
            </span>
          </a>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-gray-400">
              Enviamos un enlace de acceso a{" "}
              <span className="text-gray-200">{email}</span>. Ábrelo en este
              dispositivo para entrar.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setMessage("");
                setError("");
              }}
              className="mt-6 text-sm text-gray-400 transition hover:text-white"
            >
              &larr; Usar otro correo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-md">
        <a
          href="/"
          className="mb-8 block text-center text-2xl font-bold tracking-tight"
        >
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Motor Brain
          </span>
        </a>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="mb-6 text-center text-xl font-bold">
            {mode === "signin"
              ? "Inicia sesión"
              : mode === "signup"
                ? "Crea tu cuenta"
                : "Entrar con enlace mágico"}
          </h1>

          {/* Mode tabs */}
          <div className="mb-6 flex gap-1 rounded-lg bg-white/5 p-1">
            {(["magic", "signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setMessage("");
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  mode === m
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "magic"
                  ? "Enlace mágico"
                  : m === "signin"
                    ? "Iniciar sesión"
                    : "Registrarse"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Dra. Jane Smith"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            {mode !== "magic" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Cargando..."
                : mode === "signin"
                  ? "Iniciar sesión"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : "Enviar enlace mágico"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          <a href="/" className="transition hover:text-gray-300">
            &larr; Volver al inicio
          </a>
        </p>
      </div>
    </div>
  );
}
