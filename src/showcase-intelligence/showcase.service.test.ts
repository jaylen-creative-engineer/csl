import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "./showcase.service.js";
import { Discipline } from "../league-model/types.js";
import { createTestSupabaseClient } from "../test/supabase-test.js";
import { hasSupabaseTestEnv } from "../test/supabase-env.js";

function setupServices() {
  const client = createTestSupabaseClient();
  const leagueModel = new LeagueModelService(client);
  const challengeService = new ChallengeService(client);
  const showcaseService = new ShowcaseService(leagueModel, challengeService);
  return { leagueModel, challengeService, showcaseService };
}

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe.skipIf(!hasSupabaseTestEnv())("ShowcaseService", () => {
  let suffix: string;

  beforeEach(() => {
    suffix = randomUUID().slice(0, 8);
  });

  describe("buildPortfolio", () => {
    it("builds a portfolio from public scored submissions", async () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = await leagueModel.createLeagueHost({
        name: "Jordan",
        organization: "Design Chicago",
      });
      const league = await leagueModel.createLeague({
        name: `Pixel League-${suffix}`,
        hostId: host.id,
      });
      const alex = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      await leagueModel.enrollParticipant(league.id, alex.id);

      for (let i = 0; i < 3; i++) {
        const challenge = await challengeService.createChallenge({
          leagueId: league.id,
          title: `Challenge ${i + 1}`,
          prompt: `Prompt ${i + 1}`,
          deadline: deadline(48),
          scoringCriteria: [
            { name: "Creativity", weight: 0.6 },
            { name: "Execution", weight: 0.4 },
          ],
        });
        await challengeService.openChallenge(challenge.id);
        const submission = await challengeService.submitEntry(challenge.id, alex.id, {
          artifact: { url: `https://alex.design/entry-${i}` },
          isPublic: true,
        });
        await challengeService.closeForJudging(challenge.id);
        await challengeService.scoreSubmission(submission.id, {
          judgeId: "judge:1",
          criteriaScores: [
            { criteriaName: "Creativity", score: 80 + i * 5 },
            { criteriaName: "Execution", score: 70 + i * 5 },
          ],
          rationale: `Good work on challenge ${i + 1}`,
        });
      }

      const portfolio = await showcaseService.buildPortfolio(alex.id);

      expect(portfolio.handle).toBe(`alex-${suffix}`);
      expect(portfolio.discipline).toBe(Discipline.Design);
      expect(portfolio.entries).toHaveLength(3);
      expect(portfolio.aggregateScore).toBeGreaterThan(0);
    });

    it("excludes private submissions from the portfolio", async () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = await leagueModel.createLeagueHost({
        name: "Jordan",
        organization: "Design Chicago",
      });
      const league = await leagueModel.createLeague({
        name: `Pixel League-${suffix}`,
        hostId: host.id,
      });
      const alex = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      await leagueModel.enrollParticipant(league.id, alex.id);

      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: "Private Test",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await challengeService.openChallenge(challenge.id);
      await challengeService.submitEntry(challenge.id, alex.id, {
        artifact: { url: "https://alex.design/private" },
        isPublic: false,
      });

      const portfolio = await showcaseService.buildPortfolio(alex.id);
      expect(portfolio.entries).toHaveLength(0);
    });

    it("throws when participant does not exist", async () => {
      const { showcaseService } = setupServices();
      await expect(showcaseService.buildPortfolio("participant:nonexistent")).rejects.toThrow(
        "Participant not found"
      );
    });
  });

  describe("getSkillSignals", () => {
    it("derives skill signals from scored submission criteria", async () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = await leagueModel.createLeagueHost({
        name: "Jordan",
        organization: "Design Chicago",
      });
      const league = await leagueModel.createLeague({
        name: `Pixel League-${suffix}`,
        hostId: host.id,
      });
      const alex = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      await leagueModel.enrollParticipant(league.id, alex.id);

      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: "Brand Refresh",
        prompt: "Prompt",
        deadline: deadline(24),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Typography", weight: 0.5 },
        ],
      });
      await challengeService.openChallenge(challenge.id);
      const submission = await challengeService.submitEntry(challenge.id, alex.id, {
        artifact: { url: "https://alex.design/brand" },
        isPublic: true,
      });
      await challengeService.closeForJudging(challenge.id);
      await challengeService.scoreSubmission(submission.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 90 },
          { criteriaName: "Typography", score: 85 },
        ],
        rationale: "Strong across both dimensions",
      });

      const signals = await showcaseService.getSkillSignals(alex.id);

      expect(signals).toHaveLength(2);
      const creativitySignal = signals.find((s) => s.domain === "Creativity");
      expect(creativitySignal?.averageScore).toBe(90);
      expect(creativitySignal?.discipline).toBe(Discipline.Design);
    });

    it("returns empty signals for participant with no scored submissions", async () => {
      const { leagueModel, showcaseService } = setupServices();
      const alex = await leagueModel.createParticipant({
        handle: `alex-${suffix}`,
        discipline: Discipline.Design,
      });
      const signals = await showcaseService.getSkillSignals(alex.id);
      expect(signals).toHaveLength(0);
    });
  });

  describe("getTopPerformers", () => {
    it("returns top performers ranked by aggregate score", async () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = await leagueModel.createLeagueHost({
        name: "Jordan",
        organization: "Design Chicago",
      });
      const league = await leagueModel.createLeague({
        name: `Pixel League-${suffix}`,
        hostId: host.id,
      });

      const participantDefs = [
        { handle: `alex-${suffix}`, score: 90 },
        { handle: `sam-${suffix}`, score: 70 },
        { handle: `casey-${suffix}`, score: 85 },
        { handle: `riley-${suffix}`, score: 60 },
        { handle: `morgan-${suffix}`, score: 95 },
      ];

      const participantEntries: Array<{ participantId: string; score: number }> = [];
      for (const p of participantDefs) {
        const participant = await leagueModel.createParticipant({
          handle: p.handle,
          discipline: Discipline.Design,
        });
        await leagueModel.enrollParticipant(league.id, participant.id);
        participantEntries.push({ participantId: participant.id, score: p.score });
      }

      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: "Big Sprint",
        prompt: "Prompt",
        deadline: deadline(48),
      });
      await challengeService.openChallenge(challenge.id);

      const submissions = [];
      for (const { participantId } of participantEntries) {
        submissions.push(
          await challengeService.submitEntry(challenge.id, participantId, {
            artifact: { url: `https://${participantId}.design/entry` },
            isPublic: true,
          })
        );
      }

      await challengeService.closeForJudging(challenge.id);

      for (let i = 0; i < submissions.length; i++) {
        await challengeService.scoreSubmission(submissions[i]!.id, {
          judgeId: "judge:1",
          criteriaScores: [{ criteriaName: "Overall", score: participantEntries[i]!.score }],
          rationale: "Scored",
        });
      }

      const top3 = await showcaseService.getTopPerformers(league.id, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0]?.handle).toBe(`morgan-${suffix}`);
      expect(top3[1]?.handle).toBe(`alex-${suffix}`);
      expect(top3[2]?.handle).toBe(`casey-${suffix}`);
    });

    it("respects the limit parameter", async () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = await leagueModel.createLeagueHost({
        name: "Jordan",
        organization: "Design Chicago",
      });
      const league = await leagueModel.createLeague({
        name: `Pixel League-${suffix}`,
        hostId: host.id,
      });

      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: "Sprint",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      await challengeService.openChallenge(challenge.id);

      const createdParticipants = [];
      for (let i = 0; i < 5; i++) {
        const p = await leagueModel.createParticipant({
          handle: `participant${i}-${suffix}`,
          discipline: Discipline.Code,
        });
        await leagueModel.enrollParticipant(league.id, p.id);
        createdParticipants.push(p);
      }

      const subs = [];
      for (let i = 0; i < createdParticipants.length; i++) {
        subs.push(
          await challengeService.submitEntry(challenge.id, createdParticipants[i]!.id, {
            artifact: { url: `https://p${i}.code/entry` },
          })
        );
      }

      await challengeService.closeForJudging(challenge.id);

      for (let i = 0; i < subs.length; i++) {
        await challengeService.scoreSubmission(subs[i]!.id, {
          judgeId: "judge:1",
          criteriaScores: [{ criteriaName: "Quality", score: 50 + i * 10 }],
          rationale: "Scored",
        });
      }

      const top2 = await showcaseService.getTopPerformers(league.id, 2);
      expect(top2).toHaveLength(2);
    });
  });
});
