"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "magic";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push("/dashboard");
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
        setMessage("Check your email to confirm your account.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setError(error.message);
      else setMessage("Check your email for the login link.");
    }

    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50";

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
              ? "Sign in to your account"
              : mode === "signup"
                ? "Create your account"
                : "Sign in with magic link"}
          </h1>

          {/* Mode tabs */}
          <div className="mb-6 flex gap-1 rounded-lg bg-white/5 p-1">
            {(["signin", "signup", "magic"] as Mode[]).map((m) => (
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
                {m === "signin"
                  ? "Sign In"
                  : m === "signup"
                    ? "Sign Up"
                    : "Magic Link"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Dr. Jane Smith"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="you@agency.com"
              />
            </div>

            {mode !== "magic" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Password
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
                ? "Loading..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Magic Link"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          <a href="/" className="transition hover:text-gray-300">
            &larr; Back to home
          </a>
        </p>
      </div>
    </div>
  );
}
