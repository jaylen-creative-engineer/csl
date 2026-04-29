import { describe, it, expect, beforeEach } from "vitest";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { ReviewService } from "./review.service.js";

const LEAGUE_ID = "league:test";
const PARTICIPANT_ID = "participant:test";

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe("ReviewService", () => {
  let challengeService: ChallengeService;
  let reviewService: ReviewService;

  beforeEach(() => {
    challengeService = new ChallengeService();
    reviewService = new ReviewService(challengeService);
  });

  it("generates criterion-level review for a scored submission", () => {
    const challenge = challengeService.createChallenge({
      leagueId: LEAGUE_ID,
      title: "Review Test",
      prompt: "Prompt",
      deadline: deadline(24),
      scoringCriteria: [
        { name: "Originality", weight: 0.5 },
        { name: "Execution", weight: 0.5 },
      ],
    });
    challengeService.openChallenge(challenge.id);

    const submission = challengeService.submitEntry(challenge.id, PARTICIPANT_ID, {
      artifact: { url: "https://example.com/review-test" },
      isPublic: true,
    });

    challengeService.closeForJudging(challenge.id);
    challengeService.scoreSubmission(submission.id, {
      judgeId: "judge:review",
      rationale: "Scored for review",
      criteriaScores: [
        { criteriaName: "Originality", score: 82 },
        { criteriaName: "Execution", score: 66 },
      ],
    });

    const review = reviewService.reviewSubmission(submission.id);

    expect(review.submissionId).toBe(submission.id);
    expect(review.criterionReviews).toHaveLength(2);
    expect(review.criterionReviews.every((c) => c.recommendedActions.length > 0)).toBe(true);
  });

  it("rejects review when submission is unscored", () => {
    const challenge = challengeService.createChallenge({
      leagueId: LEAGUE_ID,
      title: "Unscored Review Test",
      prompt: "Prompt",
      deadline: deadline(24),
    });
    challengeService.openChallenge(challenge.id);
    const submission = challengeService.submitEntry(challenge.id, PARTICIPANT_ID, {
      artifact: { url: "https://example.com/unscored" },
      isPublic: true,
    });

    expect(() => reviewService.reviewSubmission(submission.id)).toThrow(
      "Cannot generate AI review for unscored submission"
    );
  });

  it("returns revision actions derived from weak criteria", () => {
    const challenge = challengeService.createChallenge({
      leagueId: LEAGUE_ID,
      title: "Revision Action Test",
      prompt: "Prompt",
      deadline: deadline(24),
      scoringCriteria: [{ name: "Clarity", weight: 1 }],
    });
    challengeService.openChallenge(challenge.id);

    const submission = challengeService.submitEntry(challenge.id, PARTICIPANT_ID, {
      artifact: { url: "https://example.com/clarity-test" },
      isPublic: true,
    });

    challengeService.closeForJudging(challenge.id);
    challengeService.scoreSubmission(submission.id, {
      judgeId: "judge:review",
      rationale: "Needs work",
      criteriaScores: [{ criteriaName: "Clarity", score: 58 }],
    });

    const actions = reviewService.generateRevisionActions(submission.id);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some((a) => a.criteriaName === "Clarity")).toBe(true);
  });
});
