import { createSupabaseAdminClient } from "../supabase/admin.js";
import { createCslServices, type CslServices } from "../csl-services.js";

/**
 * Route handlers use the service-role client until Auth + RLS policies exist.
 * Replace with `createSupabaseServerClient()` + permission checks when ready.
 */
export function getRouteServices(): CslServices {
  return createCslServices(createSupabaseAdminClient());
}
