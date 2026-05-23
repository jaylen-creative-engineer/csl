import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "../lib/supabase/admin.js";
import type { Database } from "../lib/supabase/database.types.js";

/** Fresh Supabase admin client for isolated integration tests. */
export function createTestSupabaseClient(): SupabaseClient<Database> {
  return createSupabaseAdminClient();
}
