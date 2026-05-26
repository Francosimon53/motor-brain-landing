// Single source of truth for who may use the Consola de Revisión Clínica:
// a valid Supabase session AND an email present in the `reviewers` allowlist.
// Used to gate both the /revision route (server component) and every
// /api/revision/* handler. All queries run with the user's session so RLS
// applies on top of these checks.

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessResult =
  | { ok: true; userId: string; email: string; supabase: SupabaseClient }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/**
 * Resolves the caller's reviewer access. Returns the authenticated Supabase
 * client on success so callers reuse the same session for RLS-scoped queries.
 */
export async function getReviewerAccess(): Promise<AccessResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, reason: "unauthenticated" };
  }

  // RLS lets a user read only their own reviewers row, so a returned row
  // means the caller is on the allowlist.
  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!reviewer) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true, userId: user.id, email: user.email, supabase };
}

/**
 * API-route guard. Returns a JSON error response when access is denied,
 * otherwise the successful access context. Usage:
 *   const access = await requireReviewerApi();
 *   if ("error" in access) return access.error;
 */
export async function requireReviewerApi(): Promise<
  | { error: NextResponse }
  | { userId: string; email: string; supabase: SupabaseClient }
> {
  const access = await getReviewerAccess();
  if (!access.ok) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    const message =
      access.reason === "unauthenticated" ? "Unauthorized" : "No autorizado";
    return { error: NextResponse.json({ error: message }, { status }) };
  }
  return {
    userId: access.userId,
    email: access.email,
    supabase: access.supabase,
  };
}
