// In-memory idempotency cache (placeholder — replace with Supabase-backed store pre-prod)
const cache = new Map<string, { body: unknown; status: number; ts: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

export function checkIdempotency(
  key: string | null
): { body: unknown; status: number } | null {
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.ts > TTL_MS) return null;
  return { body: entry.body, status: entry.status };
}

export function storeIdempotency(
  key: string,
  body: unknown,
  status: number
): void {
  cache.set(key, { body, status, ts: Date.now() });
}
