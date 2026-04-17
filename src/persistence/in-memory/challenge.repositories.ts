import type { IChallengeRepository, ISubmissionRepository } from "../repository.types.js";
import type {
  Challenge,
  ChallengeId,
  ScoreId,
  Submission,
  SubmissionId,
} from "../../challenge-intelligence/types.js";
import type { LeagueId, ParticipantId } from "../../league-model/types.js";
import { InMemoryRepository } from "./base.repository.js";

export class InMemoryChallengeRepository
  extends InMemoryRepository<Challenge, ChallengeId>
  implements IChallengeRepository
{
  constructor() {
    super("challenge");
  }

  async findByLeagueId(leagueId: LeagueId): Promise<Challenge[]> {
    return (await this.findAll()).filter((c) => c.leagueId === leagueId);
  }
}

export class InMemorySubmissionRepository
  extends InMemoryRepository<Submission, SubmissionId>
  implements ISubmissionRepository
{
  private scoreCounter = 0;

  constructor() {
    super("submission");
  }

  async findByChallengeId(challengeId: ChallengeId): Promise<Submission[]> {
    return (await this.findAll()).filter((s) => s.challengeId === challengeId);
  }

  async findByParticipantId(participantId: ParticipantId): Promise<Submission[]> {
    return (await this.findAll()).filter((s) => s.participantId === participantId);
  }

  nextScoreId(): ScoreId {
    return `score:${++this.scoreCounter}`;
  }
}
