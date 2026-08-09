import { describe, expect, it } from "vitest";

import { aggregateScore } from "./challenge.service.js";
import type { Score } from "./types.js";

function score(totalScore: number, overrides: Partial<Score> = {}): Score {
  return {
    id: `score:${totalScore}`,
    submissionId: "submission:1",
    judgeId: "judge:1",
    criteriaScores: [{ criteriaName: "Creativity", score: 0 }],
    totalScore,
    rationale: "Fixture score",
    scoredAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("aggregateScore", () => {
  it("returns zero for submissions without scores", () => {
    expect(aggregateScore([])).toBe(0);
  });

  it("returns a single judge score verbatim", () => {
    expect(aggregateScore([score(91.25)])).toBe(91.25);
  });

  it("averages multiple judge total scores and preserves fractional results", () => {
    expect(aggregateScore([score(80), score(80), score(100)])).toBeCloseTo(260 / 3, 6);
  });

  it("uses totalScore only and is independent of score order", () => {
    const scores = [
      score(90, {
        id: "score:a",
        judgeId: "judge:low-criteria",
        criteriaScores: [{ criteriaName: "Execution", score: 10 }],
        rationale: "Low criteria score should not be recomputed",
      }),
      score(70, {
        id: "score:b",
        judgeId: "judge:high-criteria",
        criteriaScores: [{ criteriaName: "Execution", score: 100 }],
        rationale: "High criteria score should not be recomputed",
      }),
    ];

    expect(aggregateScore(scores)).toBe(80);
    expect(aggregateScore([...scores].reverse())).toBe(80);
  });
});
