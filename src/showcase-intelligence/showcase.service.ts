import type { LeagueId, ParticipantId } from "../league-model/types.js";
import type { LeagueModelService } from "../league-model/league-model.service.js";
import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { aggregateScore } from "../challenge-intelligence/challenge.service.js";
import type { Submission } from "../challenge-intelligence/types.js";
import type { Portfolio, PublicProfile, ShowcaseEntry, ShowcaseFeedOptions, SkillSignal } from "./types.js";

// @lat: [[lat.md/domain-model#Domain model#Domain services (implementation)#ShowcaseService]]
export class ShowcaseService {
  constructor(
    private readonly leagueModel: LeagueModelService,
    private readonly challengeService: ChallengeService
  ) {}

  async buildPortfolio(participantId: ParticipantId): Promise<Portfolio> {
    const participant = await this.leagueModel.getParticipant(participantId);
    if (!participant) {
      throw new Error(`Participant not found: ${participantId}`);
    }

    const submissions = (await this.challengeService.getSubmissionsForParticipant(participantId)).filter(
      (s) => s.isPublic
    );

    const entries: ShowcaseEntry[] = [];
    for (const submission of submissions) {
      const challenge = await this.challengeService.getChallenge(submission.challengeId);
      const agg = submissionAggregateScore(submission);
      entries.push({
        submission,
        participantHandle: participant.handle,
        discipline: participant.discipline,
        challengeTitle: challenge?.title ?? "Unknown Challenge",
        score: agg > 0 ? agg : undefined,
      });
    }

    const skillSignals = await this.getSkillSignals(participantId);

    const scoredEntries = entries.filter((e) => e.score !== undefined);
    const aggregatePortfolioScore =
      scoredEntries.length > 0
        ? scoredEntries.reduce((sum, e) => sum + (e.score ?? 0), 0) / scoredEntries.length
        : 0;

    return {
      participantId,
      handle: participant.handle,
      discipline: participant.discipline,
      entries,
      skillSignals,
      aggregateScore: aggregatePortfolioScore,
      generatedAt: new Date().toISOString(),
    };
  }

  async getSkillSignals(participantId: ParticipantId): Promise<SkillSignal[]> {
    const participant = await this.leagueModel.getParticipant(participantId);
    if (!participant) return [];

    const submissions = (
      await this.challengeService.getSubmissionsForParticipant(participantId)
    ).filter((s) => s.isPublic && (s.scores?.length ?? 0) > 0);

    const domainMap = new Map<string, { scores: number[] }>();

    for (const submission of submissions) {
      // Aggregate criteria scores across all judges per criterion name
      const criteriaTotals = new Map<string, number[]>();
      for (const score of submission.scores ?? []) {
        for (const cs of score.criteriaScores) {
          const existing = criteriaTotals.get(cs.criteriaName);
          if (existing) existing.push(cs.score);
          else criteriaTotals.set(cs.criteriaName, [cs.score]);
        }
      }

      for (const [criteriaName, criteriaScores] of criteriaTotals) {
        const avg = criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length;
        const existing = domainMap.get(criteriaName);
        if (existing) existing.scores.push(avg);
        else domainMap.set(criteriaName, { scores: [avg] });
      }
    }

    return Array.from(domainMap.entries()).map(([domain, { scores }]) => ({
      participantId,
      discipline: participant.discipline,
      domain,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      sampleCount: scores.length,
    }));
  }

  async getTopPerformers(leagueId: LeagueId, limit: number): Promise<PublicProfile[]> {
    const participants = await this.leagueModel.listParticipants(leagueId);

    const profiles: PublicProfile[] = [];
    for (const participant of participants) {
      const submissions = (
        await this.challengeService.getSubmissionsForParticipant(participant.id)
      ).filter((s) => s.isPublic);

      const scoredSubmissions = submissions.filter((s) => (s.scores?.length ?? 0) > 0);
      const participantAggregate =
        scoredSubmissions.length > 0
          ? scoredSubmissions.reduce((sum, s) => sum + submissionAggregateScore(s), 0) /
            scoredSubmissions.length
          : 0;

      const leagueIds = participant.leagueMemberships.map((m) => m.leagueId);

      profiles.push({
        participantId: participant.id,
        handle: participant.handle,
        discipline: participant.discipline,
        aggregateScore: participantAggregate,
        submissionCount: submissions.length,
        leagueIds,
      });
    }

    return profiles
      .sort((a, b) => {
        if (b.aggregateScore !== a.aggregateScore) return b.aggregateScore - a.aggregateScore;
        return a.handle.localeCompare(b.handle);
      })
      .slice(0, limit);
  }

  // Gap 8: cursor-based paginated showcase feed
  async getShowcaseFeed(
    leagueId: LeagueId,
    options: ShowcaseFeedOptions = {}
  ): Promise<{ entries: ShowcaseEntry[]; nextCursor: string | null }> {
    const { limit = 20, cursor } = options;

    const participants = await this.leagueModel.listParticipants(leagueId);
    const allEntries: ShowcaseEntry[] = [];

    for (const participant of participants) {
      const submissions = (
        await this.challengeService.getSubmissionsForParticipant(participant.id)
      ).filter((s) => s.isPublic);

      for (const submission of submissions) {
        const challenge = await this.challengeService.getChallenge(submission.challengeId);
        const agg = submissionAggregateScore(submission);
        allEntries.push({
          submission,
          participantHandle: participant.handle,
          discipline: participant.discipline,
          challengeTitle: challenge?.title ?? "Unknown Challenge",
          score: agg > 0 ? agg : undefined,
        });
      }
    }

    // Sort newest-first
    const sorted = allEntries.sort(
      (a, b) =>
        new Date(b.submission.submittedAt).getTime() -
        new Date(a.submission.submittedAt).getTime()
    );

    // Apply cursor filter: return entries submitted strictly before the cursor timestamp
    const afterCursor = cursor
      ? sorted.filter(
          (e) => new Date(e.submission.submittedAt).getTime() < new Date(cursor).getTime()
        )
      : sorted;

    const page = afterCursor.slice(0, limit);
    const nextCursor =
      page.length === limit && afterCursor.length > limit
        ? page[page.length - 1]!.submission.submittedAt
        : null;

    return { entries: page, nextCursor };
  }
}

function submissionAggregateScore(submission: Submission): number {
  return aggregateScore(submission.scores ?? []);
}
