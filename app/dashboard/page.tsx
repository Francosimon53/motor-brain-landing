"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

interface UserProfile {
  full_name: string | null;
  api_key: string;
  tokens_used: number;
}

interface Document {
  id: string;
  filename: string;
  char_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data: prof } = await supabase
        .from("user_profiles")
        .select("full_name, api_key, tokens_used")
        .eq("id", user.id)
        .single();
      if (prof) setProfile(prof);

      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (docs) setDocuments(docs);

      const { count: dc } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setDocCount(dc || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: qc } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());
      setQueryCount(qc || 0);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyKey() {
    if (!profile?.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayName =
    profile?.full_name || email?.split("@")[0] || "there";

  const stats = [
    {
      label: "Queries today",
      value: queryCount,
      color: "text-violet-400",
    },
    {
      label: "Documents",
      value: docCount,
      color: "text-sky-400",
    },
    {
      label: "Tokens used",
      value: profile?.tokens_used ?? 0,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-gray-400">
          Here&apos;s an overview of your Motor Brain usage.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
          >
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${s.color}`}>
              {s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/chat"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
      >
        Go to Chat
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>

      {/* Recent Documents */}
      <section id="documents">
        <h2 className="mb-4 text-lg font-semibold">Recent Documents</h2>
        {documents.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-gray-500">
            No documents uploaded yet. Use the chat to upload your first PDF.
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-white/[0.02]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-sm font-medium">{doc.filename}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    {doc.char_count.toLocaleString()} chars
                  </span>
                  <span>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* API Keys */}
      <section id="api-keys">
        <h2 className="mb-4 text-lg font-semibold">API Key</h2>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          {profile?.api_key ? (
            <>
              <div className="flex items-center gap-3">
                <code className="flex-1 truncate rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-gray-300">
                  {profile.api_key}
                </code>
                <button
                  onClick={copyKey}
                  className="shrink-0 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-gray-400">
                  Example usage:
                </p>
                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black p-4 text-xs leading-relaxed text-gray-400">
                  <code>{`curl -X POST https://web-production-16afd.up.railway.app/v1/consulta \\
  -H "X-API-Key: ${profile.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"mensajes": [{"role": "user", "content": "What is DTT?"}]}'`}</code>
                </pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Your API key will appear here once your profile is set up.
            </p>
          )}
        </div>
      </section>

      {/* Settings placeholder */}
      <section id="settings">
        <h2 className="mb-4 text-lg font-semibold">Settings</h2>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="mt-0.5 text-sm text-gray-400">{email}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
