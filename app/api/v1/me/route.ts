import { createSupabaseServerClient } from "@/lib/supabase/server.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin.js";

/**
 * GET /api/v1/me
 *
 * Returns the current authenticated user's participant record.
 * Responds with 401 if no valid session is present.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return jsonError("Unauthorized", 401);
  }

  // Use admin client to look up participant by user_id (bypasses RLS for this
  // trusted server-side read; the session check above enforces identity).
  const admin = createSupabaseAdminClient();
  const { data: participant, error: participantError } = await admin
    .from("participants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (participantError || !participant) {
    return jsonError("Participant profile not found", 404);
  }

  return jsonOk({ user: { id: user.id, email: user.email }, participant });
}
