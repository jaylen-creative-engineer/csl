import { describe, expect, it } from "vitest";
import { aggregateScore } from "./challenge.service.js";
import type { Score } from "./types.js";

function score(totalScore: number, judgeId = `judge:${totalScore}`): Score {
  return {
    id: `score:${judgeId}`,
    submissionId: "submission:1",
    judgeId,
    criteriaScores: [],
    totalScore,
    rationale: "Regression fixture",
    scoredAt: "2026-06-28T10:00:00.000Z",
  };
}

describe("aggregateScore", () => {
  it("returns zero when no judge scores exist", () => {
    expect(aggregateScore([])).toBe(0);
  });

  it("averages all judge total scores for leaderboard ranking", () => {
    expect(aggregateScore([score(90, "judge:a"), score(75, "judge:b"), score(81, "judge:c")])).toBe(82);
  });

  it("preserves fractional means instead of rounding before sorting", () => {
    expect(aggregateScore([score(100, "judge:a"), score(99, "judge:b"), score(99, "judge:c")])).toBeCloseTo(
      99.333333,
      5
    );
  });
});
