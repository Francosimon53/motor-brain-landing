"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

/* ───────────────────────── Data ───────────────────────── */

const features = [
  {
    icon: (
      <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    title: "Session Notes by Voice or Text",
    desc: "Describe your session in Telegram\u200A\u2014\u200Aby voice note or text. Motor Brain generates a complete SOAP note with ABA terminology, CPT codes, and quantitative data. Ready to paste into CentralReach, Catalyst, or any system.",
    tag: "DTT \u00b7 NET \u00b7 Parent Training \u00b7 Supervision \u00b7 Auto-detects session type",
    live: true,
  },
  {
    icon: (
      <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    title: "Assessments That Get Approved",
    desc: "Upload your VB-MAPP, FBA, session notes, and treatment plans. Motor Brain analyzes everything and generates a complete assessment\u200A\u2014\u200Aformatted for your specific payer. No wizard. No forms. Just upload and talk.",
    tag: "Initial & Reassessment \u00b7 Payer-specific language \u00b7 DOCX/PDF export",
    live: false,
  },
  {
    icon: (
      <svg className="h-7 w-7 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: "Remembers Your Clients",
    desc: "Add a client once\u200A\u2014\u200AMotor Brain remembers their age, diagnosis, goals, and insurance. Every note automatically includes the right context. No more repeating the same information.",
    tag: null,
    live: true,
  },
  {
    icon: (
      <svg className="h-7 w-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: "Your ABA Knowledge Base",
    desc: "Ask any clinical question\u200A\u2014\u200Aintervention protocols, behavioral strategies, ethical guidelines. Backed by ABA literature and your agency\u2019s own documents.",
    tag: null,
    live: true,
  },
];

const steps = [
  {
    num: "01",
    label: "Record or type",
    desc: "After your session, send a voice note or text to Motor Brain on Telegram. Describe what happened\u200A\u2014\u200Ajust like you\u2019d tell a colleague.",
    color: "text-violet-400",
  },
  {
    num: "02",
    label: "Motor Brain generates",
    desc: "AI trained on ABA terminology creates a complete SOAP note with S/O/A/P sections, quantitative data, CPT codes, and clinical language that payers expect.",
    color: "text-sky-400",
  },
  {
    num: "03",
    label: "Copy and paste",
    desc: "Your note is ready. Copy it into CentralReach, Catalyst, Rethink, or any practice management system. Done in under a minute.",
    color: "text-emerald-400",
  },
];

const plans = [
  {
    name: "Individual BCBA",
    price: "$99",
    period: "/mo",
    tagline: "Everything you need",
    features: [
      "Unlimited SOAP notes",
      "Voice & text input",
      "Client memory (up to 50 clients)",
      "Assessment Engine (when available)",
      "HIPAA compliant",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$399",
    period: "/mo",
    tagline: "For your whole team",
    features: [
      "Everything in Individual",
      "Up to 10 BCBAs",
      "Unlimited clients",
      "Priority support",
      "Agency dashboard",
      "Custom payer templates",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
];

const stats = [
  { value: "30 sec", label: "per note" },
  { value: "5", label: "session types" },
  { value: "HIPAA", label: "compliant" },
  { value: "Zero", label: "data shared" },
];

const roles = ["Individual BCBA", "Agency", "Other"];

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
            <a href="#how-it-works" className="text-gray-400 transition hover:text-white">How it Works</a>
            <a href="#pricing" className="text-gray-400 transition hover:text-white">Pricing</a>
            <a
              href="#trial"
              className="rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-5 py-1.5 font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/20"
            >
              Start Free Trial
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
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-gray-400 transition hover:text-white">How it Works</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-gray-400 transition hover:text-white">Pricing</a>
              <a href="#trial" onClick={() => setMenuOpen(false)} className="text-violet-300 font-semibold">Start Free Trial</a>
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
            HIPAA-compliant &middot; Used by BCBAs in Florida
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Finish your session notes in 2&nbsp;minutes.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Assessments the insurance approves on the first try.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
            Motor Brain is the AI assistant built specifically for BCBAs. Send a voice note after each session&thinsp;&mdash;&thinsp;get a complete SOAP note in 30&nbsp;seconds. Upload your documents&thinsp;&mdash;&thinsp;get a full assessment ready for the payer.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#trial"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
            >
              Start Free &mdash; 14 Days
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-3.5 font-semibold text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              See it in action &darr;
            </a>
          </div>
        </div>
      </header>

      {/* ── Social Proof ── */}
      <section className="border-t border-white/5 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-lg leading-relaxed text-gray-400 md:text-xl">
            Built by a BCBA candidate who spent 3+ hours a day on documentation.<br className="hidden sm:block" />
            <span className="text-white">Motor Brain exists so you don&apos;t have to.</span>
          </p>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-5">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">{s.value}</div>
                <div className="mt-1 text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a BCBA needs. <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">Nothing they don&apos;t.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
            Two tools that give you back your evenings.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition hover:border-violet-500/20 hover:bg-white/[0.04]"
              >
                {!f.live && (
                  <div className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Coming Soon
                  </div>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
                {f.tag && (
                  <p className="mt-3 text-xs font-medium text-gray-500">{f.tag}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">From voice note to SOAP note in <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">30&nbsp;seconds</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            Three steps. That&apos;s it.
          </p>

          <div className="mt-14 flex flex-col items-center gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex w-full max-w-lg flex-col items-center">
                {/* Step box */}
                <div className="flex w-full items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-6 py-5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold ${step.color}`}>
                    {step.num}
                  </div>
                  <div>
                    <div className="font-semibold">{step.label}</div>
                    <div className="mt-1 text-sm leading-relaxed text-gray-400">{step.desc}</div>
                  </div>
                </div>
                {/* Arrow connector */}
                {i < steps.length - 1 && (
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
      <section className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            HIPAA compliant. <span className="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">Your data stays yours.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-gray-400 leading-relaxed">
            Motor Brain sanitizes all protected health information before it reaches any AI model. Every query is encrypted, logged, and auditable. Your clients&apos; data never leaves your isolated vault. BAA included with every plan.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["HIPAA 2026 Ready", "BAA Included", "PHI Sanitized", "Encrypted"].map((badge) => (
              <div key={badge} className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing. No surprises.</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            Start free for 14 days. Cancel anytime.
          </p>

          <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
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
                  href="#trial"
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

      {/* ── Trial Form ── */}
      <section id="trial" className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-xl px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Ready to get your evenings back?</h2>
            <p className="mt-3 text-center text-gray-400">
              Start your 14-day free trial. No credit card required.
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
                const role = data.get("role")?.toString() ?? "";

                if (!name || !email || !role) {
                  setFormError("Please fill in all fields.");
                  setFormStatus("error");
                  return;
                }

                const { error } = await getSupabase()
                  .from("demo_requests")
                  .insert([{ name, email, agency: role, team_size: role }]);

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
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
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
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-300">I am a...</label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-gray-900">Select one</option>
                  {roles.map((r) => (
                    <option key={r} value={r} className="bg-gray-900">{r}</option>
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
                {formStatus === "loading" ? "Sending..." : formStatus === "success" ? "You\u2019re in!" : "Start Free Trial \u2192"}
              </button>
            </form>

            {formStatus === "success" ? (
              <p className="mt-5 text-center text-sm text-emerald-400">
                Welcome! Check your email for setup instructions.
              </p>
            ) : (
              <p className="mt-5 text-center text-xs text-gray-500">
                Questions? Email simon@motorbrain.app
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-sm text-gray-500 sm:flex-row">
          <span>&copy; 2026 Motor Brain &middot; HIPAA Compliant</span>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="transition hover:text-gray-300">Terms</a>
            <a href="#" className="transition hover:text-gray-300">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
