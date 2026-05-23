/**
 * Local-store mode — all data persisted to .csl-data.json in the project root.
 * No Supabase connection required. Implements the same surface used by the CLI:
 * createParticipant, getParticipant, createLeague, listLeagues,
 * createChallenge, listChallenges, createSubmission, listSubmissions,
 * plus the subset of sponsor/showcase operations needed for the learner journey.
 */

import { getCollection, upsert, readStore } from "./file-store.js";
import {
  newHostId,
  newLeagueId,
  newParticipantId,
  newSeasonId,
  newChallengeId,
  newSubmissionId,
  newScoreId,
  newSponsorId,
  newSponsorAttachmentId,
} from "../supabase/ids.js";
import { NotFoundError, ConflictError, InvalidStateError } from "../errors.js";
import {
  Discipline,
  EnrollmentStatus,
  LeagueStatus,
  type CreateLeagueHostInput,
  type CreateLeagueInput,
  type CreateParticipantInput,
  type EnrollmentResult,
  type League,
  type LeagueHost,
  type LeagueId,
  type Participant,
  type ParticipantId,
} from "../../league-model/types.js";
import {
  ChallengeStatus,
  type Challenge,
  type ChallengeId,
  type CreateChallengeInput,
  type Score,
  type ScoreInput,
  type Submission,
  type SubmissionId,
  type SubmitEntryInput,
} from "../../challenge-intelligence/types.js";
import type {
  ChallengeBrief,
  CreateSponsorInput,
  Sponsor,
  SponsorAttachment,
  SponsorAttachmentId,
  SponsorId,
  SponsorOutcome,
} from "../../sponsor-intelligence/types.js";
import { aggregateScore } from "../../challenge-intelligence/challenge.service.js";
import type { Portfolio, PublicProfile, ShowcaseEntry, ShowcaseFeedOptions, SkillSignal } from "../../showcase-intelligence/types.js";

const now = () => new Date().toISOString();

// ────────────────────────────────────────────────────────────
// League service (local)
// ────────────────────────────────────────────────────────────

class LocalLeagueService {
  createLeagueHost(input: CreateLeagueHostInput): Promise<LeagueHost> {
    const id = newHostId();
    const host: LeagueHost = { id, name: input.name, organization: input.organization, leagueIds: [], createdAt: now() };
    upsert("hosts", host);
    return Promise.resolve(host);
  }

  getLeagueHost(id: string): Promise<LeagueHost | undefined> {
    const hosts = getCollection<LeagueHost>("hosts");
    return Promise.resolve(hosts.find((h) => h.id === id));
  }

  listHosts(): Promise<LeagueHost[]> {
    return Promise.resolve(getCollection<LeagueHost>("hosts"));
  }

  async createLeague(input: CreateLeagueInput): Promise<League> {
    const host = await this.getLeagueHost(input.hostId);
    if (!host) throw new NotFoundError("LeagueHost", input.hostId);
    const id = newLeagueId();
    const league: League = {
      id,
      name: input.name,
      hostId: input.hostId,
      seasonId: input.seasonId ?? null,
      status: LeagueStatus.Draft,
      challengeIds: [],
      createdAt: now(),
    };
    upsert("leagues", league);
    // Link league to host
    host.leagueIds.push(id);
    upsert("hosts", host);
    return league;
  }

  getLeague(id: LeagueId): Promise<League | undefined> {
    return Promise.resolve(getCollection<League>("leagues").find((l) => l.id === id));
  }

  listLeagues(): Promise<League[]> {
    return Promise.resolve(getCollection<League>("leagues"));
  }

  async activateLeague(id: LeagueId): Promise<League> {
    const league = await this.getLeague(id);
    if (!league) throw new NotFoundError("League", id);
    if (league.status !== LeagueStatus.Draft) {
      throw new InvalidStateError("League", league.status, "draft");
    }
    league.status = LeagueStatus.Active;
    return upsert("leagues", league);
  }

  async closeLeague(id: LeagueId): Promise<League> {
    const league = await this.getLeague(id);
    if (!league) throw new NotFoundError("League", id);
    if (league.status !== LeagueStatus.Active) {
      throw new InvalidStateError("League", league.status, "active");
    }
    league.status = LeagueStatus.Closed;
    return upsert("leagues", league);
  }

  createParticipant(input: CreateParticipantInput): Promise<Participant> {
    const id = newParticipantId();
    const participant: Participant = {
      id,
      userId: input.userId ?? null,
      handle: input.handle,
      discipline: input.discipline,
      leagueMemberships: [],
      createdAt: now(),
    };
    upsert("participants", participant);
    return Promise.resolve(participant);
  }

  getParticipant(id: ParticipantId): Promise<Participant | undefined> {
    return Promise.resolve(getCollection<Participant>("participants").find((p) => p.id === id));
  }

  async enrollParticipant(leagueId: LeagueId, participantId: ParticipantId): Promise<EnrollmentResult> {
    const league = await this.getLeague(leagueId);
    if (!league) {
      return { success: false, participantId, leagueId, status: EnrollmentStatus.Withdrawn, reason: "league not found" };
    }
    const participant = await this.getParticipant(participantId);
    if (!participant) {
      return { success: false, participantId, leagueId, status: EnrollmentStatus.Withdrawn, reason: "participant not found" };
    }
    if (participant.leagueMemberships.some((m) => m.leagueId === leagueId)) {
      return { success: false, participantId, leagueId, status: EnrollmentStatus.Enrolled, reason: "already enrolled" };
    }
    participant.leagueMemberships.push({ leagueId, status: EnrollmentStatus.Enrolled, enrolledAt: now() });
    upsert("participants", participant);
    return { success: true, participantId, leagueId, status: EnrollmentStatus.Enrolled };
  }

  async listParticipants(leagueId: LeagueId): Promise<Participant[]> {
    const all = getCollection<Participant>("participants");
    return all.filter((p) => p.leagueMemberships.some((m) => m.leagueId === leagueId));
  }

  async withdrawParticipant(leagueId: LeagueId, participantId: ParticipantId): Promise<void> {
    const participant = await this.getParticipant(participantId);
    if (!participant) throw new NotFoundError("Participant", participantId);
    const membership = participant.leagueMemberships.find((m) => m.leagueId === leagueId);
    if (!membership) throw new NotFoundError("Enrollment", `${participantId} in ${leagueId}`);
    if (membership.status === EnrollmentStatus.Withdrawn) {
      throw new ConflictError(`Participant ${participantId} is already withdrawn from league ${leagueId}`);
    }
    membership.status = EnrollmentStatus.Withdrawn;
    upsert("participants", participant);
  }
}

// ────────────────────────────────────────────────────────────
// Challenge service (local)
// ────────────────────────────────────────────────────────────

class LocalChallengeService {
  createChallenge(input: CreateChallengeInput): Promise<Challenge> {
    const id = newChallengeId();
    const challenge: Challenge = {
      id,
      leagueId: input.leagueId,
      title: input.title,
      prompt: input.prompt,
      deadline: input.deadline,
      status: ChallengeStatus.Draft,
      scoringCriteria: input.scoringCriteria ?? [],
      sponsorId: input.sponsorId,
      createdAt: now(),
    };
    upsert("challenges", challenge);
    return Promise.resolve(challenge);
  }

  getChallenge(id: ChallengeId): Promise<Challenge | undefined> {
    return Promise.resolve(getCollection<Challenge>("challenges").find((c) => c.id === id));
  }

  listChallenges(): Promise<Challenge[]> {
    return Promise.resolve(getCollection<Challenge>("challenges"));
  }

  getChallengesForLeague(leagueId: string): Promise<Challenge[]> {
    return Promise.resolve(getCollection<Challenge>("challenges").filter((c) => c.leagueId === leagueId));
  }

  async openChallenge(id: ChallengeId): Promise<Challenge> {
    const c = await this.requireChallenge(id);
    if (c.status !== ChallengeStatus.Draft) throw new InvalidStateError("Challenge", c.status, "draft");
    c.status = ChallengeStatus.Open;
    return upsert("challenges", c);
  }

  async closeForJudging(id: ChallengeId): Promise<Challenge> {
    const c = await this.requireChallenge(id);
    if (c.status !== ChallengeStatus.Open) throw new InvalidStateError("Challenge", c.status, "open");
    c.status = ChallengeStatus.Judging;
    return upsert("challenges", c);
  }

  async completeChallenge(id: ChallengeId): Promise<Challenge> {
    const c = await this.requireChallenge(id);
    if (c.status !== ChallengeStatus.Judging) throw new InvalidStateError("Challenge", c.status, "judging");
    c.status = ChallengeStatus.Complete;
    return upsert("challenges", c);
  }

  async submitEntry(challengeId: ChallengeId, participantId: ParticipantId, input: SubmitEntryInput): Promise<Submission> {
    const c = await this.requireChallenge(challengeId);
    if (c.status !== ChallengeStatus.Open) throw new Error("challenge not open");
    const id = newSubmissionId();
    const submission: Submission = {
      id,
      challengeId,
      participantId,
      artifact: input.artifact,
      isPublic: input.isPublic ?? true,
      withdrawn: false,
      submittedAt: now(),
      scores: [],
    };
    upsert("submissions", submission);
    return submission;
  }

  async scoreSubmission(submissionId: SubmissionId, input: ScoreInput): Promise<Submission> {
    const submission = getCollection<Submission>("submissions").find((s) => s.id === submissionId);
    if (!submission) throw new NotFoundError("Submission", submissionId);
    const challenge = await this.requireChallenge(submission.challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new InvalidStateError("Challenge", challenge.status, "judging");
    }
    const totalScore = computeTotalScore(input, challenge);
    const scoreId = newScoreId();
    const score: Score = {
      id: scoreId,
      submissionId,
      judgeId: input.judgeId,
      criteriaScores: input.criteriaScores,
      totalScore,
      rationale: input.rationale,
      scoredAt: now(),
    };
    submission.scores = [...(submission.scores ?? []), score];
    upsert("submissions", submission);
    return submission;
  }

  getSubmissionsForChallenge(challengeId: ChallengeId): Promise<Submission[]> {
    return Promise.resolve(getCollection<Submission>("submissions").filter((s) => s.challengeId === challengeId && !s.withdrawn));
  }

  getSubmissionsForParticipant(participantId: ParticipantId): Promise<Submission[]> {
    return Promise.resolve(getCollection<Submission>("submissions").filter((s) => s.participantId === participantId && !s.withdrawn));
  }

  getSubmission(submissionId: SubmissionId): Promise<Submission | undefined> {
    return Promise.resolve(getCollection<Submission>("submissions").find((s) => s.id === submissionId));
  }

  async getLeaderboard(challengeId: ChallengeId): Promise<Submission[]> {
    const subs = await this.getSubmissionsForChallenge(challengeId);
    return subs
      .filter((s) => (s.scores?.length ?? 0) > 0)
      .sort((a, b) => {
        const sa = aggregateScore(a.scores ?? []);
        const sb = aggregateScore(b.scores ?? []);
        if (sb !== sa) return sb - sa;
        return a.id.localeCompare(b.id);
      });
  }

  private async requireChallenge(id: ChallengeId): Promise<Challenge> {
    const c = await this.getChallenge(id);
    if (!c) throw new NotFoundError("Challenge", id);
    return c;
  }
}

function computeTotalScore(input: ScoreInput, challenge: Challenge): number {
  if (challenge.scoringCriteria.length === 0) {
    if (input.criteriaScores.length === 0) return 0;
    const sum = input.criteriaScores.reduce((acc, cs) => acc + cs.score, 0);
    return sum / input.criteriaScores.length;
  }
  return input.criteriaScores.reduce((total, cs) => {
    const criterion = challenge.scoringCriteria.find((c) => c.name === cs.criteriaName);
    const weight = criterion?.weight ?? 0;
    return total + cs.score * weight;
  }, 0);
}

// ────────────────────────────────────────────────────────────
// Showcase service (local)
// ────────────────────────────────────────────────────────────

class LocalShowcaseService {
  constructor(
    private readonly leagueService: LocalLeagueService,
    private readonly challengeService: LocalChallengeService
  ) {}

  async buildPortfolio(participantId: ParticipantId): Promise<Portfolio> {
    const participant = await this.leagueService.getParticipant(participantId);
    if (!participant) throw new Error(`Participant not found: ${participantId}`);

    const submissions = (await this.challengeService.getSubmissionsForParticipant(participantId)).filter((s) => s.isPublic);
    const entries: ShowcaseEntry[] = [];
    for (const submission of submissions) {
      const challenge = await this.challengeService.getChallenge(submission.challengeId);
      const agg = aggregateScore(submission.scores ?? []);
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
      generatedAt: now(),
    };
  }

  async getSkillSignals(participantId: ParticipantId): Promise<SkillSignal[]> {
    const participant = await this.leagueService.getParticipant(participantId);
    if (!participant) return [];

    const submissions = (await this.challengeService.getSubmissionsForParticipant(participantId))
      .filter((s) => s.isPublic && (s.scores?.length ?? 0) > 0);

    const domainMap = new Map<string, { scores: number[] }>();
    for (const submission of submissions) {
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
    const participants = await this.leagueService.listParticipants(leagueId);
    const profiles: PublicProfile[] = [];
    for (const participant of participants) {
      const submissions = (await this.challengeService.getSubmissionsForParticipant(participant.id)).filter((s) => s.isPublic);
      const scoredSubmissions = submissions.filter((s) => (s.scores?.length ?? 0) > 0);
      const participantAggregate =
        scoredSubmissions.length > 0
          ? scoredSubmissions.reduce((sum, s) => sum + aggregateScore(s.scores ?? []), 0) / scoredSubmissions.length
          : 0;
      profiles.push({
        participantId: participant.id,
        handle: participant.handle,
        discipline: participant.discipline,
        aggregateScore: participantAggregate,
        submissionCount: submissions.length,
        leagueIds: participant.leagueMemberships.map((m) => m.leagueId),
      });
    }
    return profiles
      .sort((a, b) => {
        if (b.aggregateScore !== a.aggregateScore) return b.aggregateScore - a.aggregateScore;
        return a.handle.localeCompare(b.handle);
      })
      .slice(0, limit);
  }

  async getShowcaseFeed(
    leagueId: LeagueId,
    options: ShowcaseFeedOptions = {}
  ): Promise<{ entries: ShowcaseEntry[]; nextCursor: string | null }> {
    const { limit = 20, cursor } = options;
    const participants = await this.leagueService.listParticipants(leagueId);
    const allEntries: ShowcaseEntry[] = [];

    for (const participant of participants) {
      const submissions = (await this.challengeService.getSubmissionsForParticipant(participant.id)).filter((s) => s.isPublic);
      for (const submission of submissions) {
        const challenge = await this.challengeService.getChallenge(submission.challengeId);
        const agg = aggregateScore(submission.scores ?? []);
        allEntries.push({
          submission,
          participantHandle: participant.handle,
          discipline: participant.discipline,
          challengeTitle: challenge?.title ?? "Unknown Challenge",
          score: agg > 0 ? agg : undefined,
        });
      }
    }

    const sorted = allEntries.sort(
      (a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime()
    );
    const afterCursor = cursor
      ? sorted.filter((e) => new Date(e.submission.submittedAt).getTime() < new Date(cursor).getTime())
      : sorted;
    const page = afterCursor.slice(0, limit);
    const nextCursor =
      page.length === limit && afterCursor.length > limit
        ? page[page.length - 1]!.submission.submittedAt
        : null;

    return { entries: page, nextCursor };
  }
}

// ────────────────────────────────────────────────────────────
// Sponsor service (local)
// ────────────────────────────────────────────────────────────

class LocalSponsorService {
  constructor(private readonly challengeService: LocalChallengeService) {}

  createSponsor(input: CreateSponsorInput): Promise<Sponsor> {
    const id = newSponsorId();
    const sponsor: Sponsor = { id, name: input.name, organization: input.organization, contactEmail: input.contactEmail, createdAt: now() };
    upsert("sponsors", sponsor);
    return Promise.resolve(sponsor);
  }

  getSponsor(id: SponsorId): Promise<Sponsor | undefined> {
    return Promise.resolve(getCollection<Sponsor>("sponsors").find((s) => s.id === id));
  }

  async attachToChallenge(sponsorId: SponsorId, challengeId: string, brief: ChallengeBrief): Promise<SponsorAttachment> {
    const sponsor = await this.getSponsor(sponsorId);
    if (!sponsor) throw new NotFoundError("Sponsor", sponsorId);
    const challenge = await this.challengeService.getChallenge(challengeId);
    if (!challenge) throw new NotFoundError("Challenge", challengeId);

    const id = newSponsorAttachmentId();
    const attachment: SponsorAttachment = { id, sponsorId, challengeId, brief, attachedAt: now() };
    upsert("sponsor_attachments", attachment);

    // Update challenge.sponsorId
    challenge.sponsorId = sponsorId;
    upsert("challenges", challenge);

    return attachment;
  }

  getAttachment(id: SponsorAttachmentId): Promise<SponsorAttachment | undefined> {
    return Promise.resolve(getCollection<SponsorAttachment>("sponsor_attachments").find((a) => a.id === id));
  }

  async recordOutcome(attachmentId: SponsorAttachmentId, outcome: SponsorOutcome): Promise<SponsorAttachment> {
    const attachment = await this.getAttachment(attachmentId);
    if (!attachment) throw new NotFoundError("SponsorAttachment", attachmentId);
    attachment.outcome = outcome;
    return upsert("sponsor_attachments", attachment);
  }

  async getSponsorSummary(sponsorId: SponsorId): Promise<{ challenges: number; topSubmissions: Submission[] }> {
    const sponsor = await this.getSponsor(sponsorId);
    if (!sponsor) throw new NotFoundError("Sponsor", sponsorId);

    const attachments = getCollection<SponsorAttachment>("sponsor_attachments").filter((a) => a.sponsorId === sponsorId);
    const topSubmissions: Submission[] = [];
    for (const attachment of attachments) {
      const leaderboard = await this.challengeService.getLeaderboard(attachment.challengeId);
      if (leaderboard.length > 0 && leaderboard[0]) {
        topSubmissions.push(leaderboard[0]);
      }
    }
    return { challenges: attachments.length, topSubmissions };
  }
}

// ────────────────────────────────────────────────────────────
// Learner-journey store (skill goals and milestones)
// ────────────────────────────────────────────────────────────

export interface SkillGoal {
  id: string;
  label: string;
  disciplines: string[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  description: string;
  dueDate: string; // ISO date string YYYY-MM-DD
  createdAt: string;
}

export function saveSkillGoal(goal: Omit<SkillGoal, "id" | "createdAt">): SkillGoal {
  const item: SkillGoal = { id: `goal:${Date.now()}`, ...goal, createdAt: now() };
  upsert("skill_goals", item);
  return item;
}

export function listSkillGoals(): SkillGoal[] {
  return getCollection<SkillGoal>("skill_goals");
}

export function saveMilestone(ms: Omit<Milestone, "id" | "createdAt">): Milestone {
  const item: Milestone = { id: `milestone:${Date.now()}`, ...ms, createdAt: now() };
  upsert("milestones", item);
  return item;
}

export function listMilestones(): Milestone[] {
  return getCollection<Milestone>("milestones");
}

// ────────────────────────────────────────────────────────────
// Factory
// ────────────────────────────────────────────────────────────

export type LocalServices = {
  league: LocalLeagueService;
  challenge: LocalChallengeService;
  showcase: LocalShowcaseService;
  sponsor: LocalSponsorService;
};

export function createLocalServices(): LocalServices {
  const league = new LocalLeagueService();
  const challenge = new LocalChallengeService();
  const showcase = new LocalShowcaseService(league, challenge);
  const sponsor = new LocalSponsorService(challenge);
  return { league, challenge, showcase, sponsor };
}
