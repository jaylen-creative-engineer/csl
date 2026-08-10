import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types.js";
import { ChallengeService, aggregateScore } from "./challenge.service.js";
import { ChallengeStatus, type Challenge, type Score, type ScoreInput } from "./types.js";

function score(id: string, totalScore: number): Score {
  return {
    id,
    submissionId: "submission:1",
    judgeId: `judge:${id}`,
    criteriaScores: [{ criteriaName: "craft", score: totalScore }],
    totalScore,
    rationale: "Clear scoring rationale",
    scoredAt: "2026-06-01T00:00:00.000Z",
  };
}

function challenge(scoringCriteria: Challenge["scoringCriteria"]): Challenge {
  return {
    id: "challenge:1",
    leagueId: "league:1",
    title: "Brand sprint",
    prompt: "Create a campaign concept",
    deadline: "2026-06-15T00:00:00.000Z",
    status: ChallengeStatus.Judging,
    scoringCriteria,
    createdAt: "2026-06-01T00:00:00.000Z",
  };
}

function computeTotalScore(input: ScoreInput, targetChallenge: Challenge): number {
  const service = new ChallengeService(undefined as unknown as SupabaseClient<Database>);
  const scoringService = service as unknown as {
    computeTotalScore(input: ScoreInput, challenge: Challenge): number;
  };
  return scoringService.computeTotalScore(input, targetChallenge);
}

describe("aggregateScore", () => {
  it("returns 0 when a submission has not been scored", () => {
    expect(aggregateScore([])).toBe(0);
  });

  it("returns the judge score for a single score", () => {
    expect(aggregateScore([score("score:1", 82)])).toBe(82);
  });

  it("averages all judge scores without depending on order", () => {
    const scores = [score("score:1", 80), score("score:2", 70), score("score:3", 90)];

    expect(aggregateScore(scores)).toBe(80);
    expect(aggregateScore([...scores].reverse())).toBe(80);
  });
});

describe("ChallengeService scoring totals", () => {
  it("averages criteria scores when the challenge has no weighting rubric", () => {
    const total = computeTotalScore(
      {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "concept", score: 60 },
          { criteriaName: "craft", score: 80 },
        ],
        rationale: "Balanced entry",
      },
      challenge([])
    );

    expect(total).toBe(70);
  });

  it("returns 0 when there is no rubric and no criteria scores", () => {
    const total = computeTotalScore(
      {
        judgeId: "judge:1",
        criteriaScores: [],
        rationale: "No criteria provided",
      },
      challenge([])
    );

    expect(total).toBe(0);
  });

  it("applies rubric weights to matching criteria scores", () => {
    const total = computeTotalScore(
      {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "concept", score: 100 },
          { criteriaName: "craft", score: 50 },
        ],
        rationale: "Strong concept, mixed craft",
      },
      challenge([
        { name: "concept", weight: 0.7 },
        { name: "craft", weight: 0.3 },
      ])
    );

    expect(total).toBe(85);
  });

  it("treats criteria outside the challenge rubric as zero-weight contributions", () => {
    const total = computeTotalScore(
      {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "concept", score: 100 },
          { criteriaName: "unexpected", score: 100 },
        ],
        rationale: "Includes an extra criterion",
      },
      challenge([{ name: "concept", weight: 0.5 }])
    );

    expect(total).toBe(50);
  });
});
