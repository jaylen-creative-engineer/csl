import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  checkIdempotency: vi.fn(),
  requireAuth: vi.fn(),
  scoreSubmission: vi.fn(),
  storeIdempotency: vi.fn(),
}));

vi.mock("@/lib/api/idempotency.js", () => ({
  checkIdempotency: routeMocks.checkIdempotency,
  storeIdempotency: routeMocks.storeIdempotency,
}));

vi.mock("@/lib/api/require-auth.js", () => ({
  requireAuth: routeMocks.requireAuth,
}));

vi.mock("@/lib/api/route-services.js", () => ({
  getRouteServices: () => ({
    challenge: {
      scoreSubmission: routeMocks.scoreSubmission,
    },
  }),
}));

const scoreRoute = await import("../../../app/api/v1/submissions/[submissionId]/score/route.js");

function paramsFor(submissionId: string) {
  return { params: Promise.resolve({ submissionId }) };
}

function scoreRequest(body: unknown, idempotencyKey = "score-key") {
  return new Request("http://test/api/v1/submissions/submission-1/score", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/v1/submissions/[submissionId]/score idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireAuth.mockResolvedValue({
      ok: true,
      user: { id: "user:judge" },
      supabase: {},
    });
    routeMocks.checkIdempotency.mockResolvedValue(null);
    routeMocks.storeIdempotency.mockResolvedValue(undefined);
  });

  it("requires auth before checking idempotent replay state", async () => {
    routeMocks.requireAuth.mockResolvedValue({
      ok: false,
      response: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    });

    const res = await scoreRoute.POST(
      scoreRequest(
        {
          judgeId: "judge:1",
          criteriaScores: [{ criteriaName: "Creativity", score: 90 }],
          rationale: "Strong concept",
        },
        "unauthorized-key"
      ),
      paramsFor("submission:1")
    );

    expect(res.status).toBe(401);
    expect(routeMocks.checkIdempotency).not.toHaveBeenCalled();
    expect(routeMocks.scoreSubmission).not.toHaveBeenCalled();
    expect(routeMocks.storeIdempotency).not.toHaveBeenCalled();
  });

  it("replays a cached score response without parsing the body or scoring again", async () => {
    routeMocks.checkIdempotency.mockResolvedValue({
      body: { ok: true, data: { id: "submission:score:cached" } },
      status: 202,
    });

    const res = await scoreRoute.POST(
      scoreRequest("not-json", "cached-key"),
      paramsFor("submission:1")
    );

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: { id: "submission:score:cached" },
    });
    expect(routeMocks.checkIdempotency).toHaveBeenCalledWith("cached-key");
    expect(routeMocks.scoreSubmission).not.toHaveBeenCalled();
    expect(routeMocks.storeIdempotency).not.toHaveBeenCalled();
  });

  it("stores the successful score response for future retries", async () => {
    const scoredSubmission = {
      id: "submission:1",
      score: 86,
      scores: [{ judgeId: "judge:1" }],
    };
    routeMocks.scoreSubmission.mockResolvedValue(scoredSubmission);

    const res = await scoreRoute.POST(
      scoreRequest({
        judgeId: " judge:1 ",
        criteriaScores: [{ criteriaName: "Creativity", score: 86 }],
        rationale: " Strong concept ",
      }),
      paramsFor("submission:1")
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, data: scoredSubmission });
    expect(routeMocks.scoreSubmission).toHaveBeenCalledWith("submission:1", {
      judgeId: "judge:1",
      criteriaScores: [{ criteriaName: "Creativity", score: 86 }],
      rationale: "Strong concept",
    });
    expect(routeMocks.storeIdempotency).toHaveBeenCalledWith(
      "score-key",
      { ok: true, data: scoredSubmission },
      200
    );
  });
});
