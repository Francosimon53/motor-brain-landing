import { redirect } from "next/navigation";
import Link from "next/link";
import { getReviewerAccess } from "@/lib/revision-access";
import RevisionConsole from "./RevisionConsole";

// Server-gated entry point. Logged-out → existing login. Logged-in but not on
// the reviewers allowlist → a clean "No autorizado" view. Reviewers → console.
export default async function RevisionPage() {
  const access = await getReviewerAccess();

  if (!access.ok && access.reason === "unauthenticated") {
    redirect("/login?next=/revision");
  }

  if (!access.ok) {
    return <NoAutorizado />;
  }

  return <RevisionConsole email={access.email} />;
}

function NoAutorizado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          className="mb-8 block text-2xl font-bold tracking-tight"
        >
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Motor Brain
          </span>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">No autorizado</h1>
          <p className="mt-2 text-sm text-gray-400">
            Tu cuenta no tiene acceso a la Consola de Revisión Clínica. Si crees
            que esto es un error, contacta al administrador.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            &larr; Volver al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
