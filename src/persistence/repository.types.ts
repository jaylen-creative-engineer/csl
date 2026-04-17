import type {
  League,
  LeagueHost,
  LeagueHostId,
  LeagueId,
  Participant,
  ParticipantId,
  Season,
  SeasonId,
} from "../league-model/types.js";
import type {
  Challenge,
  ChallengeId,
  ScoreId,
  Submission,
  SubmissionId,
} from "../challenge-intelligence/types.js";
import type {
  Sponsor,
  SponsorAttachment,
  SponsorAttachmentId,
  SponsorId,
} from "../sponsor-intelligence/types.js";

/**
 * Base contract shared by all repositories.
 * All read/write operations are async so both in-memory and database-backed
 * implementations satisfy the same interface. nextId() stays synchronous
 * because IDs are always generated locally (never by the database).
 *
 * save() must be called explicitly after mutating an entity so that
 * database-backed implementations can persist the change without
 * needing dirty-tracking.
 */
export interface IRepository<TEntity, TId extends string> {
  save(entity: TEntity): Promise<void>;
  findById(id: TId): Promise<TEntity | undefined>;
  findAll(): Promise<TEntity[]>;
  nextId(): TId;
}

// ── League model ──────────────────────────────────────────────────────────────

export interface ILeagueHostRepository extends IRepository<LeagueHost, LeagueHostId> {}

export interface ISeasonRepository extends IRepository<Season, SeasonId> {}

export interface ILeagueRepository extends IRepository<League, LeagueId> {}

export interface IParticipantRepository extends IRepository<Participant, ParticipantId> {}

// ── Challenge domain ──────────────────────────────────────────────────────────

export interface IChallengeRepository extends IRepository<Challenge, ChallengeId> {
  findByLeagueId(leagueId: LeagueId): Promise<Challenge[]>;
}

export interface ISubmissionRepository extends IRepository<Submission, SubmissionId> {
  findByChallengeId(challengeId: ChallengeId): Promise<Submission[]>;
  findByParticipantId(participantId: ParticipantId): Promise<Submission[]>;
  nextScoreId(): ScoreId;
}

// ── Sponsor domain ────────────────────────────────────────────────────────────

export interface ISponsorRepository extends IRepository<Sponsor, SponsorId> {}

export interface ISponsorAttachmentRepository
  extends IRepository<SponsorAttachment, SponsorAttachmentId> {
  findBySponsorId(sponsorId: SponsorId): Promise<SponsorAttachment[]>;
}
