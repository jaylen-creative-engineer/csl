import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkIdempotency, storeIdempotency } from "./idempotency.js";
import { hasSupabaseTestEnv } from "../../test/supabase-env.js";

function createIdempotencyTestClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe("checkIdempotency", () => {
  it("short-circuits when no idempotency key is provided", async () => {
    await expect(checkIdempotency(null)).resolves.toBeNull();
  });
});

describe.skipIf(!hasSupabaseTestEnv())("Postgres-backed idempotency cache", () => {
  let client: SupabaseClient;
  let keys: string[];

  beforeEach(() => {
    client = createIdempotencyTestClient();
    keys = [];
  });

  afterEach(async () => {
    if (keys.length === 0) return;
    await client.from("idempotency_cache").delete().in("key", keys);
  });

  function nextKey(): string {
    const key = `test-idempotency-${randomUUID()}`;
    keys.push(key);
    return key;
  }

  it("returns null when a key has not been cached", async () => {
    await expect(checkIdempotency(nextKey())).resolves.toBeNull();
  });

  it("round-trips stored response body and status", async () => {
    const key = nextKey();
    const body = { ok: true, submissionId: "submission:test", nested: { attempt: 1 } };

    await storeIdempotency(key, body, 201);

    await expect(checkIdempotency(key)).resolves.toEqual({ body, status: 201 });
  });

  it("overwrites an existing key with the latest response", async () => {
    const key = nextKey();

    await storeIdempotency(key, { ok: true, attempt: 1 }, 201);
    await storeIdempotency(key, { ok: true, attempt: 2 }, 202);

    await expect(checkIdempotency(key)).resolves.toEqual({
      body: { ok: true, attempt: 2 },
      status: 202,
    });
  });

  it("treats cached responses older than the TTL as misses", async () => {
    const key = nextKey();
    await storeIdempotency(key, { ok: true }, 200);

    const staleTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const { error } = await client
      .from("idempotency_cache")
      .update({ created_at: staleTimestamp })
      .eq("key", key);
    expect(error).toBeNull();

    await expect(checkIdempotency(key)).resolves.toBeNull();
  });
});
