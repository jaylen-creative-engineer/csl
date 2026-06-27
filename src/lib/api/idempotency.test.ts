import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkIdempotency, storeIdempotency } from "./idempotency.js";

const mockSupabase = vi.hoisted(() => {
  const rows = new Map<
    string,
    { body: unknown; status_code: number; created_at: string }
  >();

  const createClient = vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table !== "idempotency_cache") {
        throw new Error(`Unexpected table: ${table}`);
      }

      let selectedKey: string | undefined;

      return {
        select: vi.fn(function (this: object) {
          return this;
        }),
        eq: vi.fn(function (this: object, column: string, value: string) {
          if (column !== "key") {
            throw new Error(`Unexpected filter column: ${column}`);
          }
          selectedKey = value;
          return this;
        }),
        single: vi.fn(async () => {
          const row = selectedKey ? rows.get(selectedKey) : undefined;
          if (!row) {
            return { data: null, error: { message: "No rows found" } };
          }
          return { data: row, error: null };
        }),
        upsert: vi.fn(async (row: { key: string; body: unknown; status_code: number; created_at: string }) => {
          rows.set(row.key, {
            body: row.body,
            status_code: row.status_code,
            created_at: row.created_at,
          });
          return { error: null };
        }),
      };
    }),
  }));

  return { rows, createClient };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockSupabase.createClient,
}));

const NOW = new Date("2026-06-27T10:00:00.000Z");
const OLD_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

describe("checkIdempotency", () => {
  beforeEach(() => {
    mockSupabase.rows.clear();
    mockSupabase.createClient.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.NEXT_PUBLIC_SUPABASE_URL = OLD_ENV.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = OLD_ENV.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("short-circuits when no idempotency key is provided", async () => {
    await expect(checkIdempotency(null)).resolves.toBeNull();

    expect(mockSupabase.createClient).not.toHaveBeenCalled();
  });

  function nextKey(): string {
    return `test-idempotency-${randomUUID()}`;
  }

  it("returns null when a key has not been cached", async () => {
    await expect(checkIdempotency(nextKey())).resolves.toBeNull();
  });

  it("round-trips stored response body and status", async () => {
    const key = nextKey();
    const body = { ok: true, submissionId: "submission:test", nested: { attempt: 1 } };

    await storeIdempotency(key, body, 201);

    await expect(checkIdempotency(key)).resolves.toEqual({ body, status: 201 });
    expect(mockSupabase.rows.get(key)?.created_at).toBe(NOW.toISOString());
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
    mockSupabase.rows.set(key, {
      body: { ok: true },
      status_code: 200,
      created_at: new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString(),
    });

    await expect(checkIdempotency(key)).resolves.toBeNull();
  });
});
