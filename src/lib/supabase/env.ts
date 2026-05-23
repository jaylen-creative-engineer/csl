/**
 * Supabase dashboard labels the public client key as "anon" or "publishable"; support both.
 */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Returns true when the minimum Supabase environment variables are present for
 * the admin (service-role) client used by the CLI and server-side services.
 * When false, the CLI falls back to local-store mode (no network calls required).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
