import { beforeEach, describe, expect, it, vi } from "vitest";

const { diffChallengesMock, requireAuthMock } = vi.hoisted(() => ({
  diffChallengesMock: vi.fn(),
  requireAuthMock: vi.fn(),
}));

vi.mock("@/lib/api/route-services.js", () => ({
  getRouteServices: () => ({
    challenge: {
      diffChallenges: diffChallengesMock,
    },
  }),
}));

vi.mock("@/lib/api/require-auth.js", () => ({
  requireAuth: requireAuthMock,
}));

const route = await import("../../../app/api/v1/challenges/diff/route.js");

function postDiffRequest(body?: unknown) {
  return new Request("http://test/api/v1/challenges/diff", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  diffChallengesMock.mockReset();
  requireAuthMock.mockReset();
});

describe("POST /api/v1/challenges/diff", () => {
  it("returns 422 when the body is missing or not an object", async () => {
    const missingBody = await route.POST(postDiffRequest());
    const stringBody = await route.POST(postDiffRequest("not an object"));

    expect(missingBody.status).toBe(422);
    expect(await missingBody.json()).toMatchObject({ ok: false });
    expect(stringBody.status).toBe(422);
    expect(await stringBody.json()).toMatchObject({ ok: false });
    expect(diffChallengesMock).not.toHaveBeenCalled();
  });

  it("returns 422 when either challenge id is missing or empty", async () => {
    const missingChallengeB = await route.POST(postDiffRequest({ challengeAId: "challenge:a" }));
    const emptyChallengeA = await route.POST(
      postDiffRequest({ challengeAId: "", challengeBId: "challenge:b" })
    );

    expect(missingChallengeB.status).toBe(422);
    expect(await missingChallengeB.json()).toMatchObject({ ok: false });
    expect(emptyChallengeA.status).toBe(422);
    expect(await emptyChallengeA.json()).toMatchObject({ ok: false });
    expect(diffChallengesMock).not.toHaveBeenCalled();
  });

  it("trims challenge ids before delegating and returns the diff", async () => {
    const diff = {
      addedCriteria: ["Craft"],
      removedCriteria: [],
      changed: [{ field: "brief", from: "short", to: "expanded" }],
    };
    diffChallengesMock.mockResolvedValue(diff);

    const response = await route.POST(
      postDiffRequest({
        challengeAId: "  challenge:a  ",
        challengeBId: "\nchallenge:b\t",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: diff });
    expect(diffChallengesMock).toHaveBeenCalledTimes(1);
    expect(diffChallengesMock).toHaveBeenCalledWith("challenge:a", "challenge:b");
  });

  it("maps service failures to a 400 response with the service message", async () => {
    diffChallengesMock.mockRejectedValue(new Error("Challenge not found"));

    const response = await route.POST(
      postDiffRequest({ challengeAId: "challenge:a", challengeBId: "challenge:missing" })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Challenge not found" });
    expect(diffChallengesMock).toHaveBeenCalledWith("challenge:a", "challenge:missing");
  });

  it("does not require auth for the current diff route contract", async () => {
    diffChallengesMock.mockResolvedValue({ changed: [] });

    const response = await route.POST(
      postDiffRequest({ challengeAId: "challenge:a", challengeBId: "challenge:b" })
    );

    expect(response.status).toBe(200);
    expect(requireAuthMock).not.toHaveBeenCalled();
  });
});
