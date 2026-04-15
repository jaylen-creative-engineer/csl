import { describe, it, expect, beforeEach } from "vitest";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "./showcase.service.js";
import { Discipline } from "../league-model/types.js";

function setupServices() {
  const leagueModel = new LeagueModelService();
  const challengeService = new ChallengeService();
  const showcaseService = new ShowcaseService(leagueModel, challengeService);
  return { leagueModel, challengeService, showcaseService };
}

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe("ShowcaseService", () => {
  describe("buildPortfolio", () => {
    it("builds a portfolio from public scored submissions", () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = leagueModel.createLeague({ name: "Pixel League", hostId: host.id });
      const alex = leagueModel.createParticipant({ handle: "alex", discipline: Discipline.Design });
      leagueModel.enrollParticipant(league.id, alex.id);

      // Create 3 challenges and submit to each
      for (let i = 0; i < 3; i++) {
        const challenge = challengeService.createChallenge({
          leagueId: league.id,
          title: `Challenge ${i + 1}`,
          prompt: `Prompt ${i + 1}`,
          deadline: deadline(48),
          scoringCriteria: [
            { name: "Creativity", weight: 0.6 },
            { name: "Execution", weight: 0.4 },
          ],
        });
        challengeService.openChallenge(challenge.id);
        const submission = challengeService.submitEntry(challenge.id, alex.id, {
          artifact: { url: `https://alex.design/entry-${i}` },
          isPublic: true,
        });
        challengeService.closeForJudging(challenge.id);
        challengeService.scoreSubmission(submission.id, {
          judgeId: "judge:1",
          criteriaScores: [
            { criteriaName: "Creativity", score: 80 + i * 5 },
            { criteriaName: "Execution", score: 70 + i * 5 },
          ],
          rationale: `Good work on challenge ${i + 1}`,
        });
      }

      const portfolio = showcaseService.buildPortfolio(alex.id);

      expect(portfolio.handle).toBe("alex");
      expect(portfolio.discipline).toBe(Discipline.Design);
      expect(portfolio.entries).toHaveLength(3);
      expect(portfolio.aggregateScore).toBeGreaterThan(0);
    });

    it("excludes private submissions from the portfolio", () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = leagueModel.createLeague({ name: "Pixel League", hostId: host.id });
      const alex = leagueModel.createParticipant({ handle: "alex", discipline: Discipline.Design });
      leagueModel.enrollParticipant(league.id, alex.id);

      const challenge = challengeService.createChallenge({
        leagueId: league.id,
        title: "Private Test",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      challengeService.openChallenge(challenge.id);
      challengeService.submitEntry(challenge.id, alex.id, {
        artifact: { url: "https://alex.design/private" },
        isPublic: false,
      });

      const portfolio = showcaseService.buildPortfolio(alex.id);
      expect(portfolio.entries).toHaveLength(0);
    });

    it("throws when participant does not exist", () => {
      const { showcaseService } = setupServices();
      expect(() => showcaseService.buildPortfolio("participant:nonexistent")).toThrow(
        "Participant not found"
      );
    });
  });

  describe("getSkillSignals", () => {
    it("derives skill signals from scored submission criteria", () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = leagueModel.createLeague({ name: "Pixel League", hostId: host.id });
      const alex = leagueModel.createParticipant({ handle: "alex", discipline: Discipline.Design });
      leagueModel.enrollParticipant(league.id, alex.id);

      const challenge = challengeService.createChallenge({
        leagueId: league.id,
        title: "Brand Refresh",
        prompt: "Prompt",
        deadline: deadline(24),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Typography", weight: 0.5 },
        ],
      });
      challengeService.openChallenge(challenge.id);
      const submission = challengeService.submitEntry(challenge.id, alex.id, {
        artifact: { url: "https://alex.design/brand" },
        isPublic: true,
      });
      challengeService.closeForJudging(challenge.id);
      challengeService.scoreSubmission(submission.id, {
        judgeId: "judge:1",
        criteriaScores: [
          { criteriaName: "Creativity", score: 90 },
          { criteriaName: "Typography", score: 85 },
        ],
        rationale: "Strong across both dimensions",
      });

      const signals = showcaseService.getSkillSignals(alex.id);

      expect(signals).toHaveLength(2);
      const creativitySignal = signals.find((s) => s.domain === "Creativity");
      expect(creativitySignal?.averageScore).toBe(90);
      expect(creativitySignal?.discipline).toBe(Discipline.Design);
    });

    it("returns empty signals for participant with no scored submissions", () => {
      const { leagueModel, showcaseService } = setupServices();
      const alex = leagueModel.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const signals = showcaseService.getSkillSignals(alex.id);
      expect(signals).toHaveLength(0);
    });
  });

  describe("getTopPerformers", () => {
    it("returns top performers ranked by aggregate score", () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = leagueModel.createLeague({ name: "Pixel League", hostId: host.id });

      const participantDefs = [
        { handle: "alex", score: 90 },
        { handle: "sam", score: 70 },
        { handle: "casey", score: 85 },
        { handle: "riley", score: 60 },
        { handle: "morgan", score: 95 },
      ];

      // Create all participants and enroll them
      const participantEntries: Array<{ participantId: string; score: number }> = [];
      for (const p of participantDefs) {
        const participant = leagueModel.createParticipant({
          handle: p.handle,
          discipline: Discipline.Design,
        });
        leagueModel.enrollParticipant(league.id, participant.id);
        participantEntries.push({ participantId: participant.id, score: p.score });
      }

      // Single challenge — collect all submissions while open, then score all at once in judging
      const challenge = challengeService.createChallenge({
        leagueId: league.id,
        title: "Big Sprint",
        prompt: "Prompt",
        deadline: deadline(48),
      });
      challengeService.openChallenge(challenge.id);

      const submissions = participantEntries.map(({ participantId }) =>
        challengeService.submitEntry(challenge.id, participantId, {
          artifact: { url: `https://${participantId}.design/entry` },
          isPublic: true,
        })
      );

      challengeService.closeForJudging(challenge.id);

      for (let i = 0; i < submissions.length; i++) {
        challengeService.scoreSubmission(submissions[i]!.id, {
          judgeId: "judge:1",
          criteriaScores: [{ criteriaName: "Overall", score: participantEntries[i]!.score }],
          rationale: "Scored",
        });
      }

      const top3 = showcaseService.getTopPerformers(league.id, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0]?.handle).toBe("morgan"); // 95
      expect(top3[1]?.handle).toBe("alex");   // 90
      expect(top3[2]?.handle).toBe("casey");  // 85
    });

    it("respects the limit parameter", () => {
      const { leagueModel, challengeService, showcaseService } = setupServices();

      const host = leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = leagueModel.createLeague({ name: "Pixel League", hostId: host.id });

      const challenge = challengeService.createChallenge({
        leagueId: league.id,
        title: "Sprint",
        prompt: "Prompt",
        deadline: deadline(24),
      });
      challengeService.openChallenge(challenge.id);

      const createdParticipants = [];
      for (let i = 0; i < 5; i++) {
        const p = leagueModel.createParticipant({
          handle: `participant${i}`,
          discipline: Discipline.Code,
        });
        leagueModel.enrollParticipant(league.id, p.id);
        createdParticipants.push(p);
      }

      const subs = createdParticipants.map((p, i) =>
        challengeService.submitEntry(challenge.id, p.id, {
          artifact: { url: `https://p${i}.code/entry` },
        })
      );

      challengeService.closeForJudging(challenge.id);

      subs.forEach((sub, i) => {
        challengeService.scoreSubmission(sub.id, {
          judgeId: "judge:1",
          criteriaScores: [{ criteriaName: "Quality", score: 50 + i * 10 }],
          rationale: "Scored",
        });
      });

      const top2 = showcaseService.getTopPerformers(league.id, 2);
      expect(top2).toHaveLength(2);
    });
  });
});
