"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

const API_DOCS = "https://abasensei-motor-brain-production.up.railway.app/docs";

/* ───────────────────────── Data ───────────────────────── */

const features = [
  {
    icon: (
      <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: "Real-time clinical queries",
    desc: "Intervention protocols, ABA principles, behavioral strategies backed by literature and your agency\u2019s own knowledge base.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: "Private knowledge base per agency",
    desc: "Index your PDFs, manuals, and protocols. FAISS isolated vector vault per tenant\u200A\u2014\u200Ayour data never touches another agency.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Clinical documentation",
    desc: "Session notes, progress reports, treatment plans meeting payer criteria for first-submission approval.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "HIPAA-compliant by design",
    desc: "VLayer Core sanitizes PHI in ~5ms. SHA-256 audit trail. Multi-tenant isolation. HIPAA 2026 ready.",
  },
];

const pipeline = [
  { label: "Request in", sub: "TLS 1.3", color: "text-gray-300" },
  { label: "VLayer sanitizes", sub: "~5 ms", color: "text-rose-400" },
  { label: "RAG searches", sub: "Isolated FAISS", color: "text-violet-400" },
  { label: "LLM generates", sub: "Clean text only", color: "text-sky-400" },
  { label: "Audit logged", sub: "SHA-256", color: "text-amber-400" },
  { label: "Response", sub: "Clinical + compliant", color: "text-emerald-400" },
];

const plans = [
  {
    name: "Pilot",
    price: "$0",
    period: "for 90 days",
    tagline: "For Florida ABA agencies",
    features: ["2,000 queries / mo", "10 PDF uploads", "BAA included", "Slack support"],
    cta: "Start Pilot",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$199",
    period: "/mo",
    tagline: "Growing agencies",
    features: ["5,000 queries / mo", "50 PDF uploads", "BAA included", "Email support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$399",
    period: "/mo",
    tagline: "Full clinical AI suite",
    features: ["15,000 queries / mo", "200 PDF uploads", "BAA included", "Email + Slack support", "Full dashboard + API"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "Large organizations",
    features: ["Unlimited queries", "Unlimited PDFs", "BAA included", "Dedicated support", "Self-hosted Docker option"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const security = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Embedded VLayer Core",
    desc: "PHI sanitized in ~5ms before any data reaches the LLM",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Full encryption",
    desc: "TLS 1.3 in transit, AES-256 at rest",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.625 12l-3-3m0 0l3-3m-3 3h7.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Immutable audit trail",
    desc: "SHA-256 hashed logs with 6-year retention",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
      </svg>
    ),
    title: "HIPAA 2026 Ready",
    desc: "15 new HIPAA 2026 requirements covered out of the box",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
      </svg>
    ),
    title: "BAA included",
    desc: "One vendor, one BAA\u200A\u2014\u200Asigned before your first query",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
      </svg>
    ),
    title: "Isolated multi-tenancy",
    desc: "Separate FAISS index per agency\u200A\u2014\u200Azero data leakage by architecture",
  },
];

const teamSizes = ["1\u20135 BCBAs", "6\u201315 BCBAs", "16\u201350 BCBAs", "50+ BCBAs"];

/* ───────────────────────── Component ───────────────────────── */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Nav ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">Motor Brain</span>
          </a>

          <div className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features" className="text-gray-400 transition hover:text-white">Features</a>
            <a href="#architecture" className="text-gray-400 transition hover:text-white">Architecture</a>
            <a href="#security" className="text-gray-400 transition hover:text-white">Security</a>
            <a href="#pricing" className="text-gray-400 transition hover:text-white">Pricing</a>
            <a
              href="#demo"
              className="rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-5 py-1.5 font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/20"
            >
              Request Demo
            </a>
          </div>

          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-gray-300 transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-gray-300 transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-gray-300 transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/5 bg-gray-950 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4 text-sm">
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-gray-400 transition hover:text-white">Features</a>
              <a href="#architecture" onClick={() => setMenuOpen(false)} className="text-gray-400 transition hover:text-white">Architecture</a>
              <a href="#security" onClick={() => setMenuOpen(false)} className="text-gray-400 transition hover:text-white">Security</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-gray-400 transition hover:text-white">Pricing</a>
              <a href="#demo" onClick={() => setMenuOpen(false)} className="text-violet-300 font-semibold">Request Demo</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <header className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-600/20 to-emerald-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-1.5 text-sm text-emerald-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            HIPAA-compliant by design &middot; BAA included
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Clinical AI for ABA agencies.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Secure by default.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
            Clinical queries, documentation, and a private knowledge base for BCBAs and RBTs&thinsp;&mdash;&thinsp;with embedded PHI sanitization in ~5ms. Every agency gets its own isolated vault.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
            >
              Request a Demo
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href={API_DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-3.5 font-semibold text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              View API Docs
            </a>
          </div>
        </div>
      </header>

      {/* ── Features ── */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Built for <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">clinical directors</span> and agency owners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
            Everything your clinical team needs&thinsp;&mdash;&thinsp;without building infrastructure or worrying about compliance.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition hover:border-violet-500/20 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture pipeline ── */}
      <section id="architecture" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">How every query stays compliant</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            Six stages. Zero PHI exposure. Full audit trail.
          </p>

          <div className="mt-14 flex flex-col items-center gap-0">
            {pipeline.map((step, i) => (
              <div key={step.label} className="flex w-full max-w-lg flex-col items-center">
                {/* Step box */}
                <div className="flex w-full items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-6 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold ${step.color}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="font-semibold">{step.label}</div>
                    <div className="text-xs text-gray-500">{step.sub}</div>
                  </div>
                </div>
                {/* Arrow connector */}
                {i < pipeline.length - 1 && (
                  <div className="flex h-8 items-center justify-center">
                    <svg className="h-5 w-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Security your compliance officer will <span className="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">love</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
            Every layer designed for HIPAA 2026. Not bolted on&thinsp;&mdash;&thinsp;built in.
          </p>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {security.map((s) => (
              <div key={s.title} className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Transparent pricing</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            BAA included on every plan. Start with a free 90-day pilot.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition ${
                  p.highlight
                    ? "border-violet-500/40 bg-violet-500/[0.06] shadow-lg shadow-violet-500/10"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{p.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  {p.period && <span className="text-sm text-gray-500">{p.period}</span>}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href={p.name === "Enterprise" ? "mailto:hello@abasensei.com" : "#demo"}
                  className={`mt-8 block w-full rounded-full py-2.5 text-center text-sm font-semibold transition ${
                    p.highlight
                      ? "bg-gradient-to-r from-violet-600 to-emerald-600 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/40"
                      : "border border-white/10 text-gray-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Form ── */}
      <section id="demo" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-xl px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Request a Demo + BAA</h2>
            <p className="mt-3 text-center text-gray-400">
              90 days free for ABA agencies in Florida
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setFormStatus("loading");
                setFormError("");

                const data = new FormData(e.currentTarget);
                const name = data.get("name")?.toString().trim() ?? "";
                const email = data.get("email")?.toString().trim() ?? "";
                const agency = data.get("agency")?.toString().trim() ?? "";
                const team_size = data.get("team_size")?.toString() ?? "";

                if (!name || !email || !agency || !team_size) {
                  setFormError("Please fill in all fields.");
                  setFormStatus("error");
                  return;
                }

                const { error } = await getSupabase()
                  .from("demo_requests")
                  .insert([{ name, email, agency, team_size }]);

                if (error) {
                  setFormError("Something went wrong. Please try again or email us directly.");
                  setFormStatus("error");
                } else {
                  setFormStatus("success");
                }
              }}
            >
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">Work email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  placeholder="jane@agency.com"
                />
              </div>
              <div>
                <label htmlFor="agency" className="mb-1.5 block text-sm font-medium text-gray-300">Agency name</label>
                <input
                  type="text"
                  id="agency"
                  name="agency"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  placeholder="Bright Horizons ABA"
                />
              </div>
              <div>
                <label htmlFor="team_size" className="mb-1.5 block text-sm font-medium text-gray-300">Clinical team size</label>
                <select
                  id="team_size"
                  name="team_size"
                  required
                  className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-gray-900">Select team size</option>
                  {teamSizes.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                  ))}
                </select>
              </div>
              {formStatus === "error" && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{formError}</p>
              )}

              <button
                type="submit"
                disabled={formStatus === "loading" || formStatus === "success"}
                className="w-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formStatus === "loading" ? "Sending..." : formStatus === "success" ? "Sent!" : "Request Free Demo \u2192"}
              </button>
            </form>

            {formStatus === "success" ? (
              <p className="mt-5 text-center text-sm text-emerald-400">
                Thank you! We&apos;ll be in touch within 24 hours with your BAA and demo access.
              </p>
            ) : (
              <p className="mt-5 text-center text-xs text-gray-500">
                No commitment &middot; BAA included &middot; Setup in 24hrs
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-sm text-gray-500 sm:flex-row">
          <span>&copy; 2026 ABA Sensei &middot; Motor Brain v2.2</span>
          <div className="flex flex-wrap justify-center gap-6">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              BAA Available
            </span>
            <a href={API_DOCS} target="_blank" rel="noopener noreferrer" className="transition hover:text-gray-300">
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
