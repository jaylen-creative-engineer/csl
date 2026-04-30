import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { ChallengeService } from "./challenge.service.js";
import { ChallengeStatus } from "./types.js";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { createTestSupabaseClient } from "../test/supabase-test.js";
import { hasSupabaseTestEnv } from "../test/supabase-env.js";

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe.skipIf(!hasSupabaseTestEnv())("ChallengeService", () => {
  let service: ChallengeService;
  let leagueModel: LeagueModelService;
  let leagueId: string;
  let suffix: string;

  beforeEach(async () => {
    suffix = randomUUID().slice(0, 8);
    const client = createTestSupabaseClient();
    leagueModel = new LeagueModelService(client);
    service = new ChallengeService(client);
    const host = await leagueModel.createLeagueHost({
      name: "Jordan",
      organization: "Design Chicago",
    });
    const league = await leagueModel.createLeague({
      name: `Test League-${suffix}`,
      hostId: host.id,
    });
    leagueId = league.id;
  });

  describe("createChallenge", () => {
    it("creates a challenge in draft state", async () => {
      const challenge = await service.createChallenge({
        leagueId,
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
        leagueId,
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
        leagueId,
        title: "Test",
        prompt: "Test prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      await expect(service.openChallenge(challenge.id)).rejects.toThrow();
    });

    it("cannot complete a challenge that is not in judging state", async () => {
      const challenge = await service.createChallenge({
        leagueId,
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
        leagueId,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });
      await service.openChallenge(challenge.id);

      const participant = await leagueModel.createParticipant({
        handle: `p-${suffix}`,
        discipline: "design" as any,
      });

      const submission = await service.submitEntry(challenge.id, participant.id, {
        artifact: { url: "https://alex.design/brand-refresh" },
      });

      expect(submission.challengeId).toBe(challenge.id);
      expect(submission.participantId).toBe(participant.id);
      expect(submission.isPublic).toBe(true);
    });

    it("rejects submission to a draft challenge", async () => {
      const challenge = await service.createChallenge({
        leagueId,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      const participant = await leagueModel.createParticipant({
        handle: `p-${suffix}`,
        discipline: "design" as any,
      });

      await expect(
        service.submitEntry(challenge.id, participant.id, {
          artifact: { url: "https://alex.design/brand-refresh" },
        })
      ).rejects.toThrow("challenge not open");
    });

    it("rejects submission to a judging challenge", async () => {
      const challenge = await service.createChallenge({
        leagueId,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });
      await service.openChallenge(challenge.id);
      await service.closeForJudging(challenge.id);

      const participant = await leagueModel.createParticipant({
        handle: `p-${suffix}`,
        discipline: "design" as any,
      });

      await expect(
        service.submitEntry(challenge.id, participant.id, {
          artifact: { url: "https://alex.design/brand-refresh" },
        })
      ).rejects.toThrow("challenge not open");
    });
  });

  describe("scoreSubmission and leaderboard", () => {
    it("scores a submission and retrieves sorted leaderboard", async () => {
      const challenge = await service.createChallenge({
        leagueId,
        title: "Brand Refresh",
        prompt: "Prompt",
        deadline: deadline(48),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Execution", weight: 0.5 },
        ],
      });
      await service.openChallenge(challenge.id);

      const p1 = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: "design" as any,
      });
      const p2 = await leagueModel.createParticipant({
        handle: `sam-${suffix}`,
        discipline: "design" as any,
      });

      const s1 = await service.submitEntry(challenge.id, p1.id, {
        artifact: { url: "https://alex.design/entry" },
      });
      const s2 = await service.submitEntry(challenge.id, p2.id, {
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
      expect(leaderboard[0]?.participantId).toBe(p2.id);
      expect(leaderboard[1]?.participantId).toBe(p1.id);
    });

    it("produces a deterministic leaderboard for equal scores", async () => {
      const challenge = await service.createChallenge({
        leagueId,
        title: "Tiebreaker Test",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      const p1 = await leagueModel.createParticipant({
        handle: `p1-${suffix}`,
        discipline: "design" as any,
      });
      const p2 = await leagueModel.createParticipant({
        handle: `p2-${suffix}`,
        discipline: "design" as any,
      });

      const s1 = await service.submitEntry(challenge.id, p1.id, {
        artifact: { url: "https://p1.design/entry" },
      });
      const s2 = await service.submitEntry(challenge.id, p2.id, {
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
        leagueId,
        title: "Mixed Scored",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await service.openChallenge(challenge.id);

      const p1 = await leagueModel.createParticipant({
        handle: `p1-${suffix}`,
        discipline: "design" as any,
      });
      const p2 = await leagueModel.createParticipant({
        handle: `p2-${suffix}`,
        discipline: "design" as any,
      });

      const s1 = await service.submitEntry(challenge.id, p1.id, {
        artifact: { url: "https://p1.design/entry" },
      });
      await service.submitEntry(challenge.id, p2.id, {
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
      expect(leaderboard[0]?.participantId).toBe(p1.id);
    });
  });

  describe("diffChallenges", () => {
    it("detects title and prompt changes between challenges", async () => {
      const a = await service.createChallenge({
        leagueId,
        title: "Brand Refresh v1",
        prompt: "Original prompt",
        deadline: deadline(24),
        scoringCriteria: [{ name: "Creativity", weight: 1 }],
      });
      const b = await service.createChallenge({
        leagueId,
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
        leagueId,
        title: "Same",
        prompt: "Same prompt",
        deadline: "2026-06-01T00:00:00.000Z",
      });
      const b = await service.createChallenge({
        leagueId,
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
