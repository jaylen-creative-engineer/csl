import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Score, Submission } from "./types.js";

const challengeMocks = {
  getLeaderboard: vi.fn(),
};

vi.mock("@/lib/api/route-services.js", () => ({
  getRouteServices: () => ({
    challenge: challengeMocks,
  }),
}));

const leaderboardRoute = await import(
  "../../app/api/v1/challenges/[challengeId]/leaderboard/route.js"
);

function paramsFor(challengeId: string) {
  return { params: Promise.resolve({ challengeId }) };
}

function score(id: string, totalScore: number): Score {
  return {
    id,
    submissionId: "submission:unused",
    judgeId: `judge:${id}`,
    criteriaScores: [],
    totalScore,
    rationale: "Scored",
    scoredAt: "2026-05-01T12:00:00.000Z",
  };
}

function submission(input: {
  id: string;
  participantId: string;
  scores: Score[];
}): Submission {
  return {
    id: input.id,
    challengeId: "challenge:1",
    participantId: input.participantId,
    artifact: { url: `https://entries.test/${input.id}` },
    isPublic: true,
    withdrawn: false,
    submittedAt: "2026-05-01T12:00:00.000Z",
    scores: input.scores,
  };
}

beforeEach(() => {
  challengeMocks.getLeaderboard.mockReset();
});

describe("GET /api/v1/challenges/[challengeId]/leaderboard", () => {
  it("returns ranked leaderboard entries with aggregate scores instead of raw submissions", async () => {
    challengeMocks.getLeaderboard.mockResolvedValue([
      submission({
        id: "submission:gold",
        participantId: "participant:gold",
        scores: [score("gold-1", 90), score("gold-2", 80)],
      }),
      submission({
        id: "submission:silver",
        participantId: "participant:silver",
        scores: [score("silver-1", 70)],
      }),
    ]);

    const res = await leaderboardRoute.GET(
      new Request("http://test/api/v1/challenges/challenge:1/leaderboard"),
      paramsFor("challenge:1")
    );

    expect(res.status).toBe(200);
    expect(challengeMocks.getLeaderboard).toHaveBeenCalledWith("challenge:1");
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      data: [
        {
          rank: 1,
          participantId: "participant:gold",
          score: 85,
          submissionId: "submission:gold",
        },
        {
          rank: 2,
          participantId: "participant:silver",
          score: 70,
          submissionId: "submission:silver",
        },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    });
  });

  it("preserves global rank when paginating leaderboard entries", async () => {
    challengeMocks.getLeaderboard.mockResolvedValue([
      submission({ id: "submission:1", participantId: "participant:1", scores: [score("1", 95)] }),
      submission({ id: "submission:2", participantId: "participant:2", scores: [score("2", 90)] }),
      submission({ id: "submission:3", participantId: "participant:3", scores: [score("3", 85)] }),
    ]);

    const res = await leaderboardRoute.GET(
      new Request("http://test/api/v1/challenges/challenge:1/leaderboard?page=2&limit=1"),
      paramsFor("challenge:1")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([
      {
        rank: 2,
        participantId: "participant:2",
        score: 90,
        submissionId: "submission:2",
      },
    ]);
    expect(body.meta).toEqual({ total: 3, page: 2, limit: 1 });
  });
});
