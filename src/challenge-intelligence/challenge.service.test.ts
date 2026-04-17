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
    it("creates a challenge in draft state", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      expect(challenge.status).toBe(ChallengeStatus.Draft);
      expect(challenge.title).toBe("Brand Refresh in 48h");
      expect(await service.getChallenge(challenge.id)).toBeDefined();
    });
  });

  describe("state transitions", () => {
    it("transitions draft → open → judging → complete", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      expect(challenge.status).toBe(ChallengeStatus.Draft);

      const opened = await service.openChallenge(challenge.id);
      expect(opened.status).toBe(ChallengeStatus.Open);

      const judging = await service.closeForJudging(challenge.id);
      expect(judging.status).toBe(ChallengeStatus.Judging);

      const completed = await service.completeChallenge(challenge.id);
      expect(completed.status).toBe(ChallengeStatus.Complete);
    });

    it("cannot open a challenge that is already open", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Test",
        prompt: "Test prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      await expect(service.openChallenge(challenge.id)).rejects.toThrow();
    });

    it("cannot complete a challenge that is not in judging state", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Test",
        prompt: "Test prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      await expect(service.completeChallenge(challenge.id)).rejects.toThrow();
    });
  });

  describe("submitEntry", () => {
    it("accepts a submission to an open challenge", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });
      await service.openChallenge(challenge.id);

      const submission = await service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://alex.design/brand-refresh" },
      });

      expect(submission.challengeId).toBe(challenge.id);
      expect(submission.participantId).toBe("participant:1");
      expect(submission.isPublic).toBe(true);
    });

    it("rejects submission to a draft challenge", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      await expect(
        service.submitEntry(challenge.id, "participant:1", {
          artifact: { url: "https://alex.design/brand-refresh" },
        })
      ).rejects.toThrow("challenge not open");
    });

    it("rejects submission to a judging challenge", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });
      await service.openChallenge(challenge.id);
      await service.closeForJudging(challenge.id);

      await expect(
        service.submitEntry(challenge.id, "participant:1", {
          artifact: { url: "https://alex.design/brand-refresh" },
        })
      ).rejects.toThrow("challenge not open");
    });
  });

  describe("scoreSubmission and leaderboard", () => {
    it("scores a submission and retrieves sorted leaderboard", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh",
        prompt: "Prompt",
        deadline: deadline(48),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Execution", weight: 0.5 },
        ],
      });
      await service.openChallenge(challenge.id);

      const s1 = await service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://alex.design/entry" },
      });
      const s2 = await service.submitEntry(challenge.id, "participant:2", {
        artifact: { url: "https://sam.design/entry" },
      });

      await service.closeForJudging(challenge.id);

      await service.scoreSubmission(s1.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 80 },
          { criteriaName: "Execution", score: 70 },
        ],
        rationale: "Strong concept, solid execution",
      });

      await service.scoreSubmission(s2.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 90 },
          { criteriaName: "Execution", score: 85 },
        ],
        rationale: "Exceptional creativity and execution",
      });

      const leaderboard = await service.getLeaderboard(challenge.id);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0]?.participantId).toBe("participant:2");
      expect(leaderboard[1]?.participantId).toBe("participant:1");
    });

    it("produces a deterministic leaderboard for equal scores", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Tiebreaker Test",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      const s1 = await service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://p1.design/entry" },
      });
      const s2 = await service.submitEntry(challenge.id, "participant:2", {
        artifact: { url: "https://p2.design/entry" },
      });

      await service.closeForJudging(challenge.id);

      await service.scoreSubmission(s1.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 75 }],
        rationale: "Good",
      });
      await service.scoreSubmission(s2.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 75 }],
        rationale: "Also good",
      });

      const leaderboard1 = await service.getLeaderboard(challenge.id);
      const leaderboard2 = await service.getLeaderboard(challenge.id);

      expect(leaderboard1.map((s) => s.id)).toEqual(leaderboard2.map((s) => s.id));
    });

    it("excludes unscored submissions from the leaderboard", async () => {
      const challenge = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Mixed Scored",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      const s1 = await service.submitEntry(challenge.id, "participant:1", {
        artifact: { url: "https://p1.design/entry" },
      });
      await service.submitEntry(challenge.id, "participant:2", {
        artifact: { url: "https://p2.design/entry" },
      });

      await service.closeForJudging(challenge.id);

      await service.scoreSubmission(s1.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 80 }],
        rationale: "Good",
      });

      const leaderboard = await service.getLeaderboard(challenge.id);
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0]?.participantId).toBe("participant:1");
    });
  });

  describe("diffChallenges", () => {
    it("detects title and prompt changes between challenges", async () => {
      const a = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh v1",
        prompt: "Original prompt",
        deadline: deadline(24),
        scoringCriteria: [{ name: "Creativity", weight: 1 }],
      });
      const b = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Brand Refresh v2",
        prompt: "Updated prompt",
        deadline: deadline(24),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Impact", weight: 0.5 },
        ],
      });

      const diff = await service.diffChallenges(a.id, b.id);
      expect(diff.titleChanged).toBe(true);
      expect(diff.promptChanged).toBe(true);
      expect(diff.criteriaAdded).toHaveLength(1);
      expect(diff.criteriaAdded[0]?.name).toBe("Impact");
      expect(diff.criteriaRemoved).toHaveLength(0);
    });

    it("reports no differences for identical challenges", async () => {
      const a = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Same",
        prompt: "Same prompt",
        deadline: "2026-06-01T00:00:00.000Z",
      });
      const b = await service.createChallenge({
        leagueId: LEAGUE_ID,
        title: "Same",
        prompt: "Same prompt",
        deadline: "2026-06-01T00:00:00.000Z",
      });

      const diff = await service.diffChallenges(a.id, b.id);
      expect(diff.titleChanged).toBe(false);
      expect(diff.promptChanged).toBe(false);
      expect(diff.deadlineChanged).toBe(false);
      expect(diff.criteriaAdded).toHaveLength(0);
      expect(diff.criteriaRemoved).toHaveLength(0);
    });
  });
});
