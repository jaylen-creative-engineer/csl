/** True when Vitest/BDD can run integration tests against Supabase (service role). */
export function hasSupabaseTestEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
