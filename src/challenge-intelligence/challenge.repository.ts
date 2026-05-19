import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { ParticipantId } from "../league-model/types.js";
import { ChallengeStatus, type Challenge, type ChallengeId, type Submission, type SubmissionId } from "./types.js";

function prefixedId(prefix: string): string {
  return `${prefix}:${randomUUID()}`;
}

export interface ChallengeRepository {
  createChallenge(input: {
    leagueId: string;
    title: string;
    prompt: string;
    deadline: string;
    scoringCriteria?: Challenge["scoringCriteria"];
    sponsorId?: string;
  }): Promise<Challenge>;
  getChallenge(id: ChallengeId): Promise<Challenge | undefined>;
  listChallengesForLeague(leagueId: string): Promise<Challenge[]>;
  saveChallenge(challenge: Challenge): Promise<void>;

  createSubmission(input: {
    challengeId: ChallengeId;
    participantId: ParticipantId;
    artifact: Submission["artifact"];
    isPublic?: boolean;
  }): Promise<Submission>;
  getSubmission(id: SubmissionId): Promise<Submission | undefined>;
  saveSubmission(submission: Submission): Promise<void>;
  listSubmissionsForChallenge(challengeId: ChallengeId): Promise<Submission[]>;
  listSubmissionsForParticipant(participantId: ParticipantId): Promise<Submission[]>;
}

export class PostgresChallengeRepository implements ChallengeRepository {
  constructor(private readonly pool: Pool) {}

  async createChallenge(input: {
    leagueId: string;
    title: string;
    prompt: string;
    deadline: string;
    scoringCriteria?: Challenge["scoringCriteria"];
    sponsorId?: string;
  }): Promise<Challenge> {
    const challenge: Challenge = {
      id: prefixedId("challenge"),
      leagueId: input.leagueId,
      title: input.title,
      prompt: input.prompt,
      deadline: input.deadline,
      status: ChallengeStatus.Draft,
      scoringCriteria: input.scoringCriteria ?? [],
      sponsorId: input.sponsorId,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `insert into challenges (
         id, league_id, title, prompt, deadline, status, scoring_criteria, sponsor_id, created_at
       ) values ($1, $2, $3, $4, $5::timestamptz, $6, $7::jsonb, $8, $9::timestamptz)`,
      [
        challenge.id,
        challenge.leagueId,
        challenge.title,
        challenge.prompt,
        challenge.deadline,
        challenge.status,
        JSON.stringify(challenge.scoringCriteria),
        challenge.sponsorId ?? null,
        challenge.createdAt,
      ]
    );
    return challenge;
  }

  async getChallenge(id: ChallengeId): Promise<Challenge | undefined> {
    const { rows } = await this.pool.query(
      `select id, league_id, title, prompt, deadline, status, scoring_criteria, sponsor_id, created_at
       from challenges where id = $1 limit 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      leagueId: row.league_id,
      title: row.title,
      prompt: row.prompt,
      deadline: new Date(row.deadline).toISOString(),
      status: row.status as ChallengeStatus,
      scoringCriteria: row.scoring_criteria ?? [],
      sponsorId: row.sponsor_id ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async listChallengesForLeague(leagueId: string): Promise<Challenge[]> {
    const { rows } = await this.pool.query(
      `select id, league_id, title, prompt, deadline, status, scoring_criteria, sponsor_id, created_at
       from challenges where league_id = $1 order by created_at asc`,
      [leagueId]
    );
    return rows.map((row) => ({
      id: row.id,
      leagueId: row.league_id,
      title: row.title,
      prompt: row.prompt,
      deadline: new Date(row.deadline).toISOString(),
      status: row.status as ChallengeStatus,
      scoringCriteria: row.scoring_criteria ?? [],
      sponsorId: row.sponsor_id ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async saveChallenge(challenge: Challenge): Promise<void> {
    await this.pool.query(
      `update challenges
       set title = $2, prompt = $3, deadline = $4::timestamptz, status = $5,
           scoring_criteria = $6::jsonb, sponsor_id = $7
       where id = $1`,
      [
        challenge.id,
        challenge.title,
        challenge.prompt,
        challenge.deadline,
        challenge.status,
        JSON.stringify(challenge.scoringCriteria),
        challenge.sponsorId ?? null,
      ]
    );
  }

  async createSubmission(input: {
    challengeId: ChallengeId;
    participantId: ParticipantId;
    artifact: Submission["artifact"];
    isPublic?: boolean;
  }): Promise<Submission> {
    const submission: Submission = {
      id: prefixedId("submission"),
      challengeId: input.challengeId,
      participantId: input.participantId,
      artifact: input.artifact,
      isPublic: input.isPublic ?? true,
      submittedAt: new Date().toISOString(),
    };
    await this.pool.query(
      `insert into submissions (
         id, challenge_id, participant_id, artifact, is_public, submitted_at, score
       ) values ($1, $2, $3, $4::jsonb, $5, $6::timestamptz, null)`,
      [
        submission.id,
        submission.challengeId,
        submission.participantId,
        JSON.stringify(submission.artifact),
        submission.isPublic,
        submission.submittedAt,
      ]
    );
    return submission;
  }

  async getSubmission(id: SubmissionId): Promise<Submission | undefined> {
    const { rows } = await this.pool.query(
      `select id, challenge_id, participant_id, artifact, is_public, submitted_at, score
       from submissions where id = $1 limit 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      challengeId: row.challenge_id,
      participantId: row.participant_id,
      artifact: row.artifact,
      isPublic: row.is_public,
      submittedAt: new Date(row.submitted_at).toISOString(),
      score: row.score ?? undefined,
    };
  }

  async saveSubmission(submission: Submission): Promise<void> {
    await this.pool.query(
      `update submissions
       set artifact = $2::jsonb, is_public = $3, score = $4::jsonb
       where id = $1`,
      [
        submission.id,
        JSON.stringify(submission.artifact),
        submission.isPublic,
        submission.score ? JSON.stringify(submission.score) : null,
      ]
    );
  }

  async listSubmissionsForChallenge(challengeId: ChallengeId): Promise<Submission[]> {
    const { rows } = await this.pool.query(
      `select id, challenge_id, participant_id, artifact, is_public, submitted_at, score
       from submissions where challenge_id = $1 order by submitted_at asc`,
      [challengeId]
    );
    return rows.map((row) => ({
      id: row.id,
      challengeId: row.challenge_id,
      participantId: row.participant_id,
      artifact: row.artifact,
      isPublic: row.is_public,
      submittedAt: new Date(row.submitted_at).toISOString(),
      score: row.score ?? undefined,
    }));
  }

  async listSubmissionsForParticipant(participantId: ParticipantId): Promise<Submission[]> {
    const { rows } = await this.pool.query(
      `select id, challenge_id, participant_id, artifact, is_public, submitted_at, score
       from submissions where participant_id = $1 order by submitted_at asc`,
      [participantId]
    );
    return rows.map((row) => ({
      id: row.id,
      challengeId: row.challenge_id,
      participantId: row.participant_id,
      artifact: row.artifact,
      isPublic: row.is_public,
      submittedAt: new Date(row.submitted_at).toISOString(),
      score: row.score ?? undefined,
    }));
  }
}
