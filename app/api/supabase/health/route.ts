import { createSupabaseServerClient } from "@/lib/supabase/server.js";

/**
 * Smoke test: server client + Auth API round-trip to your Supabase project.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      return Response.json(
        { ok: false, step: "auth.getSession", error: error.message },
        { status: 502 }
      );
    }
    return Response.json({
      ok: true,
      message: "Supabase client initialized and Auth API responded.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
