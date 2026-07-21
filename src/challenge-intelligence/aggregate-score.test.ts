import { describe, expect, it } from "vitest";
import { aggregateScore } from "./challenge.service.js";
import type { Score } from "./types.js";

function score(totalScore: number, judgeId = `judge-${totalScore}`): Score {
  return {
    id: `score-${judgeId}`,
    submissionId: "submission-1",
    judgeId,
    criteriaScores: [],
    totalScore,
    rationale: "Test score",
    scoredAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("aggregateScore", () => {
  it("returns zero when a submission has not been scored", () => {
    expect(aggregateScore([])).toBe(0);
  });

  it("uses the only judge score without changing it", () => {
    expect(aggregateScore([score(87)])).toBe(87);
  });

  it("averages total scores across multiple judges", () => {
    expect(aggregateScore([score(90), score(75), score(81)])).toBe(82);
  });

  it("preserves fractional averages for ranking stability", () => {
    expect(aggregateScore([score(100), score(99), score(99)])).toBeCloseTo(99.333333, 5);
  });

  it("is independent of judge score ordering", () => {
    const scores = [score(64, "judge-a"), score(92, "judge-b"), score(80, "judge-c")];

    expect(aggregateScore(scores)).toBe(aggregateScore([...scores].reverse()));
  });
});
