import { createClient } from "@supabase/supabase-js";

const TTL_MS = 24 * 60 * 60 * 1000;

function getIdempotencyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function checkIdempotency(
  key: string | null
): Promise<{ body: unknown; status: number } | null> {
  if (!key) return null;
  const supabase = getIdempotencyClient();
  const { data, error } = await supabase
    .from("idempotency_cache")
    .select("body, status_code, created_at")
    .eq("key", key)
    .single();
  if (error || !data) return null;
  const row = data as { body: unknown; status_code: number; created_at: string };
  const age = Date.now() - new Date(row.created_at).getTime();
  if (age > TTL_MS) return null;
  return { body: row.body, status: row.status_code };
}

export async function storeIdempotency(
  key: string,
  body: unknown,
  status: number
): Promise<void> {
  const supabase = getIdempotencyClient();
  await supabase
    .from("idempotency_cache")
    .upsert({ key, body, status_code: status, created_at: new Date().toISOString() });
}
