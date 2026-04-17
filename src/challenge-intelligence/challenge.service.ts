import type { ParticipantId } from "../league-model/types.js";
import {
  type Challenge,
  type ChallengeDiff,
  type ChallengeId,
  ChallengeStatus,
  type CreateChallengeInput,
  type Score,
  type ScoreInput,
  type Submission,
  type SubmissionId,
  type SubmitEntryInput,
} from "./types.js";
import {
  InMemoryChallengeRepository,
  InMemorySubmissionRepository,
} from "../persistence/in-memory/challenge.repositories.js";
import type {
  IChallengeRepository,
  ISubmissionRepository,
} from "../persistence/repository.types.js";

export class ChallengeService {
  constructor(
    private readonly challenges: IChallengeRepository = new InMemoryChallengeRepository(),
    private readonly submissions: ISubmissionRepository = new InMemorySubmissionRepository(),
  ) {}

  async createChallenge(input: CreateChallengeInput): Promise<Challenge> {
    const challenge: Challenge = {
      id: this.challenges.nextId(),
      leagueId: input.leagueId,
      title: input.title,
      prompt: input.prompt,
      deadline: input.deadline,
      status: ChallengeStatus.Draft,
      scoringCriteria: input.scoringCriteria ?? [],
      sponsorId: input.sponsorId,
      createdAt: new Date().toISOString(),
    };
    await this.challenges.save(challenge);
    return challenge;
  }

  async getChallenge(id: ChallengeId): Promise<Challenge | undefined> {
    return this.challenges.findById(id);
  }

  async openChallenge(challengeId: ChallengeId): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Draft) {
      throw new Error(`Cannot open challenge in status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Open;
    await this.challenges.save(challenge);
    return challenge;
  }

  async closeForJudging(challengeId: ChallengeId): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new Error(`Cannot move to judging from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Judging;
    await this.challenges.save(challenge);
    return challenge;
  }

  async completeChallenge(challengeId: ChallengeId): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot complete challenge from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Complete;
    await this.challenges.save(challenge);
    return challenge;
  }

  async submitEntry(
    challengeId: ChallengeId,
    participantId: ParticipantId,
    input: SubmitEntryInput
  ): Promise<Submission> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new Error("challenge not open");
    }
    const submission: Submission = {
      id: this.submissions.nextId(),
      challengeId,
      participantId,
      artifact: input.artifact,
      isPublic: input.isPublic ?? true,
      submittedAt: new Date().toISOString(),
    };
    await this.submissions.save(submission);
    return submission;
  }

  async scoreSubmission(submissionId: SubmissionId, input: ScoreInput): Promise<Submission> {
    const submission = await this.submissions.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    const challenge = await this.requireChallenge(submission.challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot score submission when challenge is in status "${challenge.status}"`);
    }

    const totalScore = this.computeTotalScore(input, challenge);

    const score: Score = {
      id: this.submissions.nextScoreId(),
      submissionId,
      judgeId: input.judgeId,
      criteriaScores: input.criteriaScores,
      totalScore,
      rationale: input.rationale,
      scoredAt: new Date().toISOString(),
    };

    submission.score = score;
    await this.submissions.save(submission);
    return submission;
  }

  async getLeaderboard(challengeId: ChallengeId): Promise<Submission[]> {
    return (await this.submissions.findByChallengeId(challengeId))
      .filter((s) => s.score !== undefined)
      .sort((a, b) => {
        const scoreA = a.score?.totalScore ?? 0;
        const scoreB = b.score?.totalScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id.localeCompare(b.id);
      });
  }

  async getSubmissionsForChallenge(challengeId: ChallengeId): Promise<Submission[]> {
    return this.submissions.findByChallengeId(challengeId);
  }

  async getSubmissionsForParticipant(participantId: ParticipantId): Promise<Submission[]> {
    return this.submissions.findByParticipantId(participantId);
  }

  async getSubmission(submissionId: SubmissionId): Promise<Submission | undefined> {
    return this.submissions.findById(submissionId);
  }

  async diffChallenges(aId: ChallengeId, bId: ChallengeId): Promise<ChallengeDiff> {
    const a = await this.requireChallenge(aId);
    const b = await this.requireChallenge(bId);

    const criteriaANames = new Set(a.scoringCriteria.map((c) => c.name));
    const criteriaBNames = new Set(b.scoringCriteria.map((c) => c.name));

    return {
      challengeA: aId,
      challengeB: bId,
      titleChanged: a.title !== b.title,
      promptChanged: a.prompt !== b.prompt,
      deadlineChanged: a.deadline !== b.deadline,
      criteriaAdded: b.scoringCriteria.filter((c) => !criteriaANames.has(c.name)),
      criteriaRemoved: a.scoringCriteria.filter((c) => !criteriaBNames.has(c.name)),
    };
  }

  private async requireChallenge(id: ChallengeId): Promise<Challenge> {
    const challenge = await this.challenges.findById(id);
    if (!challenge) throw new Error(`Challenge not found: ${id}`);
    return challenge;
  }

  private computeTotalScore(input: ScoreInput, challenge: Challenge): number {
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
}
