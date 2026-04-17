import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { challenges, submissions } from "../schema.js";
import type {
  IChallengeRepository,
  ISubmissionRepository,
} from "../../persistence/repository.types.js";
import type {
  Challenge,
  ChallengeId,
  ScoreId,
  Submission,
  SubmissionId,
} from "../../challenge-intelligence/types.js";
import type { LeagueId, ParticipantId } from "../../league-model/types.js";
import { ChallengeStatus } from "../../challenge-intelligence/types.js";

export class DrizzleChallengeRepository implements IChallengeRepository {
  constructor(private readonly db: Db) {}

  nextId(): ChallengeId {
    return `challenge:${crypto.randomUUID()}`;
  }

  async save(entity: Challenge): Promise<void> {
    await this.db
      .insert(challenges)
      .values({
        id: entity.id,
        leagueId: entity.leagueId,
        title: entity.title,
        prompt: entity.prompt,
        deadline: entity.deadline,
        status: entity.status,
        scoringCriteria: entity.scoringCriteria,
        sponsorId: entity.sponsorId ?? null,
        createdAt: entity.createdAt,
      })
      .onConflictDoUpdate({
        target: challenges.id,
        set: {
          title: entity.title,
          prompt: entity.prompt,
          deadline: entity.deadline,
          status: entity.status,
          scoringCriteria: entity.scoringCriteria,
          sponsorId: entity.sponsorId ?? null,
        },
      });
  }

  async findById(id: ChallengeId): Promise<Challenge | undefined> {
    const row = await this.db.query.challenges.findFirst({ where: eq(challenges.id, id) });
    if (!row) return undefined;
    return rowToChallenge(row);
  }

  async findAll(): Promise<Challenge[]> {
    const rows = await this.db.query.challenges.findMany();
    return rows.map(rowToChallenge);
  }

  async findByLeagueId(leagueId: LeagueId): Promise<Challenge[]> {
    const rows = await this.db.select().from(challenges).where(eq(challenges.leagueId, leagueId));
    return rows.map(rowToChallenge);
  }
}

function rowToChallenge(row: typeof challenges.$inferSelect): Challenge {
  return {
    id: row.id,
    leagueId: row.leagueId,
    title: row.title,
    prompt: row.prompt,
    deadline: row.deadline,
    status: row.status as ChallengeStatus,
    scoringCriteria: (row.scoringCriteria as any) ?? [],
    sponsorId: row.sponsorId ?? undefined,
    createdAt: row.createdAt,
  };
}

export class DrizzleSubmissionRepository implements ISubmissionRepository {
  private scoreCounter = 0;

  constructor(private readonly db: Db) {}

  nextId(): SubmissionId {
    return `submission:${crypto.randomUUID()}`;
  }

  nextScoreId(): ScoreId {
    return `score:${crypto.randomUUID()}`;
  }

  async save(entity: Submission): Promise<void> {
    await this.db
      .insert(submissions)
      .values({
        id: entity.id,
        challengeId: entity.challengeId,
        participantId: entity.participantId,
        artifact: entity.artifact,
        isPublic: entity.isPublic,
        submittedAt: entity.submittedAt,
        score: entity.score ?? null,
      })
      .onConflictDoUpdate({
        target: submissions.id,
        set: {
          artifact: entity.artifact,
          isPublic: entity.isPublic,
          score: entity.score ?? null,
        },
      });
  }

  async findById(id: SubmissionId): Promise<Submission | undefined> {
    const row = await this.db.query.submissions.findFirst({ where: eq(submissions.id, id) });
    if (!row) return undefined;
    return rowToSubmission(row);
  }

  async findAll(): Promise<Submission[]> {
    const rows = await this.db.query.submissions.findMany();
    return rows.map(rowToSubmission);
  }

  async findByChallengeId(challengeId: ChallengeId): Promise<Submission[]> {
    const rows = await this.db.select().from(submissions).where(eq(submissions.challengeId, challengeId));
    return rows.map(rowToSubmission);
  }

  async findByParticipantId(participantId: ParticipantId): Promise<Submission[]> {
    const rows = await this.db.select().from(submissions).where(eq(submissions.participantId, participantId));
    return rows.map(rowToSubmission);
  }
}

function rowToSubmission(row: typeof submissions.$inferSelect): Submission {
  return {
    id: row.id,
    challengeId: row.challengeId,
    participantId: row.participantId,
    artifact: row.artifact as any,
    isPublic: row.isPublic,
    submittedAt: row.submittedAt,
    score: row.score as any ?? undefined,
  };
}
