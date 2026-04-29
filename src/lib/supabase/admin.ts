import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

/**
 * Optional service-role client for trusted server-only code (e.g. Storage uploads, admin APIs).
 * Never import this into Client Components or expose the key to the browser.
 */
// @lat: [[lat.md/current-system#Current system#Delivery surfaces#Supabase#createSupabaseAdminClient]]
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin client"
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
