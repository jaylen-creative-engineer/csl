import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "../lib/supabase/admin.js";
import type { Database } from "../lib/supabase/database.types.js";
import { resetIdCounters } from "../lib/supabase/ids.js";

/** Fresh Supabase admin client and ID counters for isolated integration tests. */
export function createTestSupabaseClient(): SupabaseClient<Database> {
  resetIdCounters();
  return createSupabaseAdminClient();
}
