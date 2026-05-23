import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server.js";

type AuthSuccess = {
  ok: true;
  user: User;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

type AuthFailure = {
  ok: false;
  response: Response;
};

export type RequireAuthResult = AuthSuccess | AuthFailure;

/**
 * Validates the caller's Supabase Auth session from the request cookies.
 *
 * Usage in a route handler:
 *   const auth = await requireAuth(request);
 *   if (!auth.ok) return auth.response;
 *   const { user, supabase } = auth;
 */
export async function requireAuth(_request: Request): Promise<RequireAuthResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, user, supabase };
}
