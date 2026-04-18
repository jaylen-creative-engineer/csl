import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey } from "./env.js";

/**
 * Supabase client for Client Components (browser). Session is stored in cookies via @supabase/ssr.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = getSupabasePublishableKey();
  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set"
    );
  }
  return createBrowserClient(url, publishableKey);
}
