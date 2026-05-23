import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { SkillIntentService } from "./skill-intent.service.js";
import { Discipline } from "../league-model/types.js";
import { createTestSupabaseClient } from "../test/supabase-test.js";
import { hasSupabaseTestEnv } from "../test/supabase-env.js";

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe.skipIf(!hasSupabaseTestEnv())("SkillIntentService", () => {
  let leagueModel: LeagueModelService;
  let challengeService: ChallengeService;
  let skillIntentService: SkillIntentService;
  let suffix: string;

  beforeEach(() => {
    suffix = randomUUID().slice(0, 8);
    const client = createTestSupabaseClient();
    leagueModel = new LeagueModelService(client);
    challengeService = new ChallengeService(client);
    skillIntentService = new SkillIntentService(client, challengeService);
  });

  describe("createSkillIntent / getSkillIntent", () => {
    it("persists and retrieves the latest declared skill intent", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });

      const intent = await skillIntentService.createSkillIntent(
        participant.id,
        "Brand identity systems",
        [Discipline.Design, Discipline.Illustration]
      );
      expect(intent.participantId).toBe(participant.id);
      expect(intent.skillLabel).toBe("Brand identity systems");
      expect(intent.targetDisciplines).toEqual([
        Discipline.Design,
        Discipline.Illustration,
      ]);

      const found = await skillIntentService.getSkillIntent(participant.id);
      expect(found?.id).toBe(intent.id);
    });

    it("returns the most recent intent when multiple are recorded", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `sam-${suffix}`,
        discipline: Discipline.Writing,
      });
      await skillIntentService.createSkillIntent(participant.id, "Narrative arc", []);
      await new Promise((r) => setTimeout(r, 10));
      const latest = await skillIntentService.createSkillIntent(
        participant.id,
        "Editorial voice",
        [Discipline.Writing]
      );

      const found = await skillIntentService.getSkillIntent(participant.id);
      expect(found?.id).toBe(latest.id);
      expect(found?.skillLabel).toBe("Editorial voice");
    });

    it("returns undefined when no intent has been declared", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `casey-${suffix}`,
        discipline: Discipline.Code,
      });
      const found = await skillIntentService.getSkillIntent(participant.id);
      expect(found).toBeUndefined();
    });
  });

  describe("getMasteryMap", () => {
    it("derives per-criterion averages across all scored submissions", async () => {
      const host = await leagueModel.createLeagueHost({
        name: `Host-${suffix}`,
        organization: "Org",
      });
      const league = await leagueModel.createLeague({
        name: `League-${suffix}`,
        hostId: host.id,
      });
      const participant = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      await leagueModel.enrollParticipant(league.id, participant.id);

      for (let i = 0; i < 2; i++) {
        const challenge = await challengeService.createChallenge({
          leagueId: league.id,
          title: `Sprint ${i + 1}-${suffix}`,
          prompt: "Prompt",
          deadline: deadline(48),
          scoringCriteria: [
            { name: "Creativity", weight: 0.5 },
            { name: "Execution", weight: 0.5 },
          ],
        });
        await challengeService.openChallenge(challenge.id);
        const sub = await challengeService.submitEntry(challenge.id, participant.id, {
          artifact: { url: `https://x/${i}` },
        });
        await challengeService.closeForJudging(challenge.id);
        await challengeService.scoreSubmission(sub.id, {
          judgeId: "judge:1",
          criteriaScores: [
            { criteriaName: "Creativity", score: 80 + i * 10 },
            { criteriaName: "Execution", score: 60 + i * 10 },
          ],
          rationale: "ok",
        });
      }

      const mastery = await skillIntentService.getMasteryMap(participant.id);
      const creativity = mastery.find((m) => m.criterion === "Creativity");
      const execution = mastery.find((m) => m.criterion === "Execution");

      expect(creativity?.avgScore).toBe(85);
      expect(creativity?.count).toBe(2);
      expect(execution?.avgScore).toBe(65);
      expect(execution?.count).toBe(2);
    });

    it("returns empty mastery for a participant with no scored work", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `solo-${suffix}`,
        discipline: Discipline.Code,
      });
      const mastery = await skillIntentService.getMasteryMap(participant.id);
      expect(mastery).toEqual([]);
    });
  });

  describe("getEvidenceTimeline", () => {
    it("returns scored submissions newest-first with criterion breakdown", async () => {
      const host = await leagueModel.createLeagueHost({
        name: `Host-${suffix}`,
        organization: "Org",
      });
      const league = await leagueModel.createLeague({
        name: `League-${suffix}`,
        hostId: host.id,
      });
      const participant = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      await leagueModel.enrollParticipant(league.id, participant.id);

      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: `Sprint-${suffix}`,
        prompt: "Prompt",
        deadline: deadline(24),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Execution", weight: 0.5 },
        ],
      });
      await challengeService.openChallenge(challenge.id);
      const sub = await challengeService.submitEntry(challenge.id, participant.id, {
        artifact: { url: `https://x/${suffix}` },
      });
      await challengeService.closeForJudging(challenge.id);
      await challengeService.scoreSubmission(sub.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 90 },
          { criteriaName: "Execution", score: 70 },
        ],
        rationale: "good",
      });

      const timeline = await skillIntentService.getEvidenceTimeline(participant.id);
      expect(timeline).toHaveLength(1);
      const [entry] = timeline;
      expect(entry?.submissionId).toBe(sub.id);
      expect(entry?.criterionBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ criterion: "Creativity", score: 90 }),
          expect.objectContaining({ criterion: "Execution", score: 70 }),
        ])
      );
      expect(entry?.score).toBeGreaterThan(0);
    });

    it("skips unscored submissions", async () => {
      const host = await leagueModel.createLeagueHost({
        name: `Host-${suffix}`,
        organization: "Org",
      });
      const league = await leagueModel.createLeague({
        name: `League-${suffix}`,
        hostId: host.id,
      });
      const participant = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      await leagueModel.enrollParticipant(league.id, participant.id);

      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: `Open-${suffix}`,
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await challengeService.openChallenge(challenge.id);
      await challengeService.submitEntry(challenge.id, participant.id, {
        artifact: { url: `https://x/${suffix}` },
      });

      const timeline = await skillIntentService.getEvidenceTimeline(participant.id);
      expect(timeline).toEqual([]);
    });
  });
});
