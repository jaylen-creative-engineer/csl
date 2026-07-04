import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn();
  const from = vi.fn(() => ({ select, upsert }));
  const createClient = vi.fn(() => ({ from }));

  return { createClient, eq, from, select, single, upsert };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: supabaseMocks.createClient,
}));

const { checkIdempotency, storeIdempotency } = await import("./idempotency.js");

describe("idempotency cache", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("skips the cache lookup when no idempotency key is provided", async () => {
    await expect(checkIdempotency(null)).resolves.toBeNull();

    expect(supabaseMocks.createClient).not.toHaveBeenCalled();
    expect(supabaseMocks.from).not.toHaveBeenCalled();
  });

  it("returns a cached response that is still within the replay TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T10:00:00.000Z"));
    supabaseMocks.single.mockResolvedValue({
      data: {
        body: { ok: true, data: { id: "submission:score:cached" } },
        status_code: 200,
        created_at: "2026-07-03T10:00:01.000Z",
      },
      error: null,
    });

    await expect(checkIdempotency("score-key")).resolves.toEqual({
      body: { ok: true, data: { id: "submission:score:cached" } },
      status: 200,
    });

    expect(supabaseMocks.createClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "service-role-key",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    expect(supabaseMocks.from).toHaveBeenCalledWith("idempotency_cache");
    expect(supabaseMocks.select).toHaveBeenCalledWith("body, status_code, created_at");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("key", "score-key");
  });

  it("does not replay cache rows older than the 24 hour TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T10:00:00.000Z"));
    supabaseMocks.single.mockResolvedValue({
      data: {
        body: { ok: true },
        status_code: 200,
        created_at: "2026-07-03T09:59:59.999Z",
      },
      error: null,
    });

    await expect(checkIdempotency("stale-score-key")).resolves.toBeNull();
  });

  it("stores replayable responses with the current creation timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T10:00:00.000Z"));
    supabaseMocks.upsert.mockResolvedValue({ error: null });

    await storeIdempotency("score-key", { ok: true, data: { id: "score:1" } }, 201);

    expect(supabaseMocks.from).toHaveBeenCalledWith("idempotency_cache");
    expect(supabaseMocks.upsert).toHaveBeenCalledWith({
      key: "score-key",
      body: { ok: true, data: { id: "score:1" } },
      status_code: 201,
      created_at: "2026-07-04T10:00:00.000Z",
    });
  });
});
