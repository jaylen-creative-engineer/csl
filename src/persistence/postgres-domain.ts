import { getSharedPostgresPool } from "../lib/postgres/client.js";
import {
  PostgresLeagueModelRepository,
  isEnrolledInLeague,
  type LeagueModelRepository,
} from "../league-model/league-model.repository.js";
import {
  PostgresChallengeRepository,
  type ChallengeRepository,
} from "../challenge-intelligence/challenge.repository.js";
import { ChallengeStatus, type Challenge, type CreateChallengeInput, type Score, type ScoreInput, type Submission, type SubmissionId, type SubmitEntryInput } from "../challenge-intelligence/types.js";
import { EnrollmentStatus, LeagueStatus, type CreateLeagueHostInput, type CreateLeagueInput, type CreateParticipantInput, type CreateSeasonInput, type EnrollmentResult, type League, type LeagueHost, type LeagueHostId, type LeagueId, type Participant, type ParticipantId, type Season, type SeasonId } from "../league-model/types.js";

let scoreCounter = 0;
function newScoreId(): string {
  scoreCounter += 1;
  return `score:${scoreCounter}`;
}

export class AsyncLeagueModelService {
  constructor(private readonly repository: LeagueModelRepository) {}

  static postgres(): AsyncLeagueModelService {
    return new AsyncLeagueModelService(new PostgresLeagueModelRepository(getSharedPostgresPool()));
  }

  createLeagueHost(input: CreateLeagueHostInput): Promise<LeagueHost> {
    return this.repository.createHost(input);
  }

  getLeagueHost(id: LeagueHostId): Promise<LeagueHost | undefined> {
    return this.repository.getHost(id);
  }

  listHosts(): Promise<LeagueHost[]> {
    return this.repository.listHosts();
  }

  createSeason(input: CreateSeasonInput): Promise<Season> {
    return this.repository.createSeason(input);
  }

  getSeason(id: SeasonId): Promise<Season | undefined> {
    return this.repository.getSeason(id);
  }

  async createLeague(input: CreateLeagueInput): Promise<League> {
    const host = await this.repository.getHost(input.hostId);
    if (!host) throw new Error(`LeagueHost not found: ${input.hostId}`);

    const league = await this.repository.createLeague(input);
    host.leagueIds.push(league.id);
    await this.repository.saveHost(host);
    return league;
  }

  getLeague(id: LeagueId): Promise<League | undefined> {
    return this.repository.getLeague(id);
  }

  listLeagues(): Promise<League[]> {
    return this.repository.listLeagues();
  }

  async activateLeague(id: LeagueId): Promise<League> {
    const league = await this.repository.getLeague(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Draft) {
      throw new Error(`Cannot activate league in status "${league.status}": expected "draft"`);
    }
    league.status = LeagueStatus.Active;
    await this.repository.saveLeague(league);
    return league;
  }

  async closeLeague(id: LeagueId): Promise<League> {
    const league = await this.repository.getLeague(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Active) {
      throw new Error(`Cannot close league in status "${league.status}": expected "active"`);
    }
    league.status = LeagueStatus.Closed;
    await this.repository.saveLeague(league);
    return league;
  }

  createParticipant(input: CreateParticipantInput): Promise<Participant> {
    return this.repository.createParticipant(input);
  }

  getParticipant(id: ParticipantId): Promise<Participant | undefined> {
    return this.repository.getParticipant(id);
  }

  async enrollParticipant(leagueId: LeagueId, participantId: ParticipantId): Promise<EnrollmentResult> {
    const league = await this.repository.getLeague(leagueId);
    if (!league) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "league not found",
      };
    }

    const participant = await this.repository.getParticipant(participantId);
    if (!participant) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "participant not found",
      };
    }

    if (isEnrolledInLeague(participant, leagueId)) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Enrolled,
        reason: "already enrolled",
      };
    }

    participant.leagueMemberships.push({
      leagueId,
      status: EnrollmentStatus.Enrolled,
      enrolledAt: new Date().toISOString(),
    });
    await this.repository.saveParticipant(participant);

    return {
      success: true,
      participantId,
      leagueId,
      status: EnrollmentStatus.Enrolled,
    };
  }

  async listParticipants(leagueId: LeagueId): Promise<Participant[]> {
    const league = await this.repository.getLeague(leagueId);
    if (!league) return [];
    const participants = await this.repository.listParticipants();
    return participants.filter((participant) => isEnrolledInLeague(participant, leagueId));
  }

  async registerChallenge(leagueId: LeagueId, challengeId: string): Promise<void> {
    const league = await this.repository.getLeague(leagueId);
    if (!league) return;
    if (league.challengeIds.includes(challengeId)) return;
    league.challengeIds.push(challengeId);
    await this.repository.saveLeague(league);
  }
}

export class AsyncChallengeService {
  constructor(
    private readonly repository: ChallengeRepository,
    private readonly leagueRegistrar?: Pick<AsyncLeagueModelService, "registerChallenge">
  ) {}

  static postgres(leagueService?: AsyncLeagueModelService): AsyncChallengeService {
    return new AsyncChallengeService(
      new PostgresChallengeRepository(getSharedPostgresPool()),
      leagueService
    );
  }

  async createChallenge(input: CreateChallengeInput): Promise<Challenge> {
    const challenge = await this.repository.createChallenge(input);
    await this.leagueRegistrar?.registerChallenge(challenge.leagueId, challenge.id);
    return challenge;
  }

  getChallenge(challengeId: string): Promise<Challenge | undefined> {
    return this.repository.getChallenge(challengeId);
  }

  getChallengesForLeague(leagueId: string): Promise<Challenge[]> {
    return this.repository.listChallengesForLeague(leagueId);
  }

  async openChallenge(challengeId: string): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Draft) {
      throw new Error(`Cannot open challenge in status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Open;
    await this.repository.saveChallenge(challenge);
    return challenge;
  }

  async closeForJudging(challengeId: string): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new Error(`Cannot move to judging from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Judging;
    await this.repository.saveChallenge(challenge);
    return challenge;
  }

  async completeChallenge(challengeId: string): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot complete challenge from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Complete;
    await this.repository.saveChallenge(challenge);
    return challenge;
  }

  async setChallengeSponsor(challengeId: string, sponsorId: string): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    challenge.sponsorId = sponsorId;
    await this.repository.saveChallenge(challenge);
    return challenge;
  }

  async submitEntry(
    challengeId: string,
    participantId: ParticipantId,
    input: SubmitEntryInput
  ): Promise<Submission> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) throw new Error("challenge not open");
    return this.repository.createSubmission({ challengeId, participantId, ...input });
  }

  async scoreSubmission(submissionId: SubmissionId, input: ScoreInput): Promise<Submission> {
    const submission = await this.repository.getSubmission(submissionId);
    if (!submission) throw new Error(`Submission not found: ${submissionId}`);
    const challenge = await this.requireChallenge(submission.challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot score submission when challenge is in status "${challenge.status}"`);
    }

    const score: Score = {
      id: newScoreId(),
      submissionId,
      judgeId: input.judgeId,
      criteriaScores: input.criteriaScores,
      totalScore: this.computeTotalScore(input, challenge),
      rationale: input.rationale,
      scoredAt: new Date().toISOString(),
    };
    submission.score = score;
    await this.repository.saveSubmission(submission);
    return submission;
  }

  async getLeaderboard(challengeId: string): Promise<Submission[]> {
    const submissions = await this.repository.listSubmissionsForChallenge(challengeId);
    return submissions
      .filter((submission) => submission.score !== undefined)
      .sort((a, b) => {
        const scoreA = a.score?.totalScore ?? 0;
        const scoreB = b.score?.totalScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id.localeCompare(b.id);
      });
  }

  getSubmissionsForChallenge(challengeId: string): Promise<Submission[]> {
    return this.repository.listSubmissionsForChallenge(challengeId);
  }

  getSubmissionsForParticipant(participantId: ParticipantId): Promise<Submission[]> {
    return this.repository.listSubmissionsForParticipant(participantId);
  }

  getSubmission(submissionId: SubmissionId): Promise<Submission | undefined> {
    return this.repository.getSubmission(submissionId);
  }

  private async requireChallenge(challengeId: string): Promise<Challenge> {
    const challenge = await this.repository.getChallenge(challengeId);
    if (!challenge) throw new Error(`Challenge not found: ${challengeId}`);
    return challenge;
  }

  private computeTotalScore(input: ScoreInput, challenge: Challenge): number {
    if (challenge.scoringCriteria.length === 0) {
      if (input.criteriaScores.length === 0) return 0;
      const sum = input.criteriaScores.reduce((acc, score) => acc + score.score, 0);
      return sum / input.criteriaScores.length;
    }
    return input.criteriaScores.reduce((total, criteriaScore) => {
      const criterion = challenge.scoringCriteria.find((item) => item.name === criteriaScore.criteriaName);
      return total + criteriaScore.score * (criterion?.weight ?? 0);
    }, 0);
  }
}

export function createPostgresDomainServices() {
  const leagueModel = AsyncLeagueModelService.postgres();
  const challenge = AsyncChallengeService.postgres(leagueModel);
  return { leagueModel, challenge };
}
