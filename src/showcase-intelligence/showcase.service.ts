import type { LeagueId, ParticipantId } from "../league-model/types.js";
import type { LeagueModelService } from "../league-model/league-model.service.js";
import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import type { Portfolio, PublicProfile, ShowcaseEntry, SkillSignal } from "./types.js";

export class ShowcaseService {
  constructor(
    private readonly leagueModel: LeagueModelService,
    private readonly challengeService: ChallengeService
  ) {}

  buildPortfolio(participantId: ParticipantId): Portfolio {
    const participant = this.leagueModel.getParticipant(participantId);
    if (!participant) {
      throw new Error(`Participant not found: ${participantId}`);
    }

    const submissions = this.challengeService
      .getSubmissionsForParticipant(participantId)
      .filter((s) => s.isPublic);

    const entries: ShowcaseEntry[] = submissions.map((submission) => {
      const challenge = this.challengeService.getChallenge(submission.challengeId);
      return {
        submission,
        participantHandle: participant.handle,
        discipline: participant.discipline,
        challengeTitle: challenge?.title ?? "Unknown Challenge",
        score: submission.score?.totalScore,
      };
    });

    const skillSignals = this.getSkillSignals(participantId);

    const scoredEntries = entries.filter((e) => e.score !== undefined);
    const aggregateScore =
      scoredEntries.length > 0
        ? scoredEntries.reduce((sum, e) => sum + (e.score ?? 0), 0) / scoredEntries.length
        : 0;

    return {
      participantId,
      handle: participant.handle,
      discipline: participant.discipline,
      entries,
      skillSignals,
      aggregateScore,
      generatedAt: new Date().toISOString(),
    };
  }

  getSkillSignals(participantId: ParticipantId): SkillSignal[] {
    const participant = this.leagueModel.getParticipant(participantId);
    if (!participant) return [];

    const submissions = this.challengeService
      .getSubmissionsForParticipant(participantId)
      .filter((s) => s.isPublic && s.score !== undefined);

    // Aggregate per criteria domain
    const domainMap = new Map<string, { scores: number[] }>();

    for (const submission of submissions) {
      if (!submission.score) continue;
      for (const cs of submission.score.criteriaScores) {
        const existing = domainMap.get(cs.criteriaName);
        if (existing) {
          existing.scores.push(cs.score);
        } else {
          domainMap.set(cs.criteriaName, { scores: [cs.score] });
        }
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

  getTopPerformers(leagueId: LeagueId, limit: number): PublicProfile[] {
    const participants = this.leagueModel.listParticipants(leagueId);

    const profiles: PublicProfile[] = participants.map((participant) => {
      const submissions = this.challengeService
        .getSubmissionsForParticipant(participant.id)
        .filter((s) => s.isPublic);

      const scoredSubmissions = submissions.filter((s) => s.score !== undefined);
      const aggregateScore =
        scoredSubmissions.length > 0
          ? scoredSubmissions.reduce((sum, s) => sum + (s.score?.totalScore ?? 0), 0) /
            scoredSubmissions.length
          : 0;

      const leagueIds = participant.leagueMemberships.map((m) => m.leagueId);

      return {
        participantId: participant.id,
        handle: participant.handle,
        discipline: participant.discipline,
        aggregateScore,
        submissionCount: submissions.length,
        leagueIds,
      };
    });

    return profiles
      .sort((a, b) => {
        if (b.aggregateScore !== a.aggregateScore) return b.aggregateScore - a.aggregateScore;
        // Deterministic tiebreak by handle
        return a.handle.localeCompare(b.handle);
      })
      .slice(0, limit);
  }

  getShowcaseFeed(leagueId: LeagueId): ShowcaseEntry[] {
    const participants = this.leagueModel.listParticipants(leagueId);
    const entries: ShowcaseEntry[] = [];

    for (const participant of participants) {
      const submissions = this.challengeService
        .getSubmissionsForParticipant(participant.id)
        .filter((s) => s.isPublic);

      for (const submission of submissions) {
        const challenge = this.challengeService.getChallenge(submission.challengeId);
        entries.push({
          submission,
          participantHandle: participant.handle,
          discipline: participant.discipline,
          challengeTitle: challenge?.title ?? "Unknown Challenge",
          score: submission.score?.totalScore,
        });
      }
    }

    // Most recent first
    return entries.sort(
      (a, b) =>
        new Date(b.submission.submittedAt).getTime() -
        new Date(a.submission.submittedAt).getTime()
    );
  }
}
