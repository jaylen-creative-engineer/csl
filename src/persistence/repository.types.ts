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
 * save() must be called explicitly after mutating an entity so that
 * database-backed implementations can persist the change.
 */
export interface IRepository<TEntity, TId extends string> {
  save(entity: TEntity): void;
  findById(id: TId): TEntity | undefined;
  findAll(): TEntity[];
  nextId(): TId;
}

// ── League model ──────────────────────────────────────────────────────────────

export interface ILeagueHostRepository extends IRepository<LeagueHost, LeagueHostId> {}

export interface ISeasonRepository extends IRepository<Season, SeasonId> {}

export interface ILeagueRepository extends IRepository<League, LeagueId> {}

export interface IParticipantRepository extends IRepository<Participant, ParticipantId> {}

// ── Challenge domain ──────────────────────────────────────────────────────────

export interface IChallengeRepository extends IRepository<Challenge, ChallengeId> {
  findByLeagueId(leagueId: LeagueId): Challenge[];
}

export interface ISubmissionRepository extends IRepository<Submission, SubmissionId> {
  findByChallengeId(challengeId: ChallengeId): Submission[];
  findByParticipantId(participantId: ParticipantId): Submission[];
  nextScoreId(): ScoreId;
}

// ── Sponsor domain ────────────────────────────────────────────────────────────

export interface ISponsorRepository extends IRepository<Sponsor, SponsorId> {}

export interface ISponsorAttachmentRepository
  extends IRepository<SponsorAttachment, SponsorAttachmentId> {
  findBySponsorId(sponsorId: SponsorId): SponsorAttachment[];
}
