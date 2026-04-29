import { describe, it, expect, beforeEach } from "vitest";
import { ChallengeService } from "./challenge.service.js";
import { ChallengeStatus } from "./types.js";

const LEAGUE_ID = "league:1";

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe("ChallengeService", () => {
  let service: ChallengeService;

  beforeEach(() => {
    service = new ChallengeService();
  });

  describe("createChallenge", () => {
    it("creates a challenge in draft state", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      expect(challenge.status).toBe(ChallengeStatus.Draft);
      expect(challenge.title).toBe("Brand Refresh in 48h");
      expect(service.getChallenge(challenge.id)).toBeDefined();
    });
  });

  describe("state transitions", () => {
    it("transitions draft → open → judging → complete", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      expect(challenge.status).toBe(ChallengeStatus.Draft);

      const opened = service.openChallenge(challenge.id);
      expect(opened.status).toBe(ChallengeStatus.Open);

      const judging = service.closeForJudging(challenge.id);
      expect(judging.status).toBe(ChallengeStatus.Judging);

      const completed = service.completeChallenge(challenge.id);
      expect(completed.status).toBe(ChallengeStatus.Complete);
    });

    it("cannot open a challenge that is already open", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Test",
        prompt: "Test prompt",
        deadline: deadline(24),
      });
      service.openChallenge(challenge.id);

      expect(() => service.openChallenge(challenge.id)).toThrow();
    });

    it("cannot complete a challenge that is not in judging state", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Test",
        prompt: "Test prompt",
        deadline: deadline(24),
      });
      service.openChallenge(challenge.id);

      expect(() => service.completeChallenge(challenge.id)).toThrow();
    });
  });

  describe("submitEntry", () => {
    it("accepts a submission to an open challenge", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });
      service.openChallenge(challenge.id);

      const submission = service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://alex.design/brand-refresh" },
      });

      expect(submission.challengeId).toBe(challenge.id);
      expect(submission.participantId).toBe("participant:1");
      expect(submission.isPublic).toBe(true);
    });

    it("rejects submission to a draft challenge", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      expect(() =>
        service.submitEntry(challenge.id, "participant:1", {
          artifact: { url: "https://alex.design/brand-refresh" },
        })
      ).toThrow("challenge not open");
    });

    it("rejects submission to a judging challenge", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });
      service.openChallenge(challenge.id);
      service.closeForJudging(challenge.id);

      expect(() =>
        service.submitEntry(challenge.id, "participant:1", {
          artifact: { url: "https://alex.design/brand-refresh" },
        })
      ).toThrow("challenge not open");
    });

    it("creates a revision linked to the original submission while open", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Revision Sprint",
        prompt: "Create and refine",
        deadline: deadline(48),
      });
      service.openChallenge(challenge.id);

      const v1 = service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://alex.design/v1" },
      });
      const v2 = service.submitRevision(v1.id, {
        artifact: { url: "https://alex.design/v2" },
      });

      expect(v2.revisionNumber).toBe(2);
      expect(v2.parentSubmissionId).toBe(v1.id);
      expect(v2.rootSubmissionId).toBe(v1.id);
      expect(v2.participantId).toBe(v1.participantId);
      expect(v2.challengeId).toBe(v1.challengeId);
    });

    it("rejects revision when challenge is no longer open", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Closed Revision Sprint",
        prompt: "Create and refine",
        deadline: deadline(48),
      });
      service.openChallenge(challenge.id);
      const v1 = service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://alex.design/v1" },
      });
      service.closeForJudging(challenge.id);

      expect(() =>
        service.submitRevision(v1.id, {
          artifact: { url: "https://alex.design/v2" },
        })
      ).toThrow("challenge not open");
    });
  });

  describe("scoreSubmission and leaderboard", () => {
    it("scores a submission and retrieves sorted leaderboard", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh",
        prompt: "Prompt",
        deadline: deadline(48),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Execution", weight: 0.5 },
        ],
      });
      service.openChallenge(challenge.id);

      const s1 = service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://alex.design/entry" },
      });
      const s2 = service.submitEntry(challenge.id, "participant:2", {
        artifact: { url: "https://sam.design/entry" },
      });

      service.closeForJudging(challenge.id);

      service.scoreSubmission(s1.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 80 },
          { criteriaName: "Execution", score: 70 },
        ],
        rationale: "Strong concept, solid execution",
      });

      service.scoreSubmission(s2.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 90 },
          { criteriaName: "Execution", score: 85 },
        ],
        rationale: "Exceptional creativity and execution",
      });

      const leaderboard = service.getLeaderboard(challenge.id);
      expect(leaderboard).toHaveLength(2);
      // s2 has higher score (87.5) than s1 (75)
      expect(leaderboard[0]?.participantId).toBe("participant:2");
      expect(leaderboard[1]?.participantId).toBe("participant:1");
    });

    it("produces a deterministic leaderboard for equal scores", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Tiebreaker Test",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      service.openChallenge(challenge.id);

      const s1 = service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://p1.design/entry" },
      });
      const s2 = service.submitEntry(challenge.id, "participant:2", {
        artifact: { url: "https://p2.design/entry" },
      });

      service.closeForJudging(challenge.id);

      service.scoreSubmission(s1.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 75 }],
        rationale: "Good",
      });
      service.scoreSubmission(s2.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 75 }],
        rationale: "Also good",
      });

      const leaderboard1 = service.getLeaderboard(challenge.id);
      const leaderboard2 = service.getLeaderboard(challenge.id);

      expect(leaderboard1.map((s) => s.id)).toEqual(leaderboard2.map((s) => s.id));
    });

    it("excludes unscored submissions from the leaderboard", () => {
      const challenge = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Mixed Scored",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      service.openChallenge(challenge.id);

      const s1 = service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://p1.design/entry" },
      });
      service.submitEntry(challenge.id, "participant:2", {
        artifact: { url: "https://p2.design/entry" },
      });

      service.closeForJudging(challenge.id);

      service.scoreSubmission(s1.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 80 }],
        rationale: "Good",
      });

      const leaderboard = service.getLeaderboard(challenge.id);
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0]?.participantId).toBe("participant:1");
    });
  });

  describe("diffChallenges", () => {
    it("detects title and prompt changes between challenges", () => {
      const a = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh v1",
        prompt: "Original prompt",
        deadline: deadline(24),
        scoringCriteria: [{ name: "Creativity", weight: 1 }],
      });
      const b = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh v2",
        prompt: "Updated prompt",
        deadline: deadline(24),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Impact", weight: 0.5 },
        ],
      });

      const diff = service.diffChallenges(a.id, b.id);
      expect(diff.titleChanged).toBe(true);
      expect(diff.promptChanged).toBe(true);
      expect(diff.criteriaAdded).toHaveLength(1);
      expect(diff.criteriaAdded[0]?.name).toBe("Impact");
      expect(diff.criteriaRemoved).toHaveLength(0);
    });

    it("reports no differences for identical challenges", () => {
      const a = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Same",
        prompt: "Same prompt",
        deadline: "2026-06-01T00:00:00.000Z",
      });
      const b = service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Same",
        prompt: "Same prompt",
        deadline: "2026-06-01T00:00:00.000Z",
      });

      const diff = service.diffChallenges(a.id, b.id);
      expect(diff.titleChanged).toBe(false);
      expect(diff.promptChanged).toBe(false);
      expect(diff.deadlineChanged).toBe(false);
      expect(diff.criteriaAdded).toHaveLength(0);
      expect(diff.criteriaRemoved).toHaveLength(0);
    });
  });
});
