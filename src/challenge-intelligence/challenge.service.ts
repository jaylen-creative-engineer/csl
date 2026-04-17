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

  createChallenge(input: CreateChallengeInput): Challenge {
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
    this.challenges.save(challenge);
    return challenge;
  }

  getChallenge(id: ChallengeId): Challenge | undefined {
    return this.challenges.findById(id);
  }

  openChallenge(challengeId: ChallengeId): Challenge {
    const challenge = this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Draft) {
      throw new Error(`Cannot open challenge in status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Open;
    this.challenges.save(challenge);
    return challenge;
  }

  closeForJudging(challengeId: ChallengeId): Challenge {
    const challenge = this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new Error(`Cannot move to judging from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Judging;
    this.challenges.save(challenge);
    return challenge;
  }

  completeChallenge(challengeId: ChallengeId): Challenge {
    const challenge = this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot complete challenge from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Complete;
    this.challenges.save(challenge);
    return challenge;
  }

  submitEntry(
    challengeId: ChallengeId,
    participantId: ParticipantId,
    input: SubmitEntryInput
  ): Submission {
    const challenge = this.requireChallenge(challengeId);
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
    this.submissions.save(submission);
    return submission;
  }

  scoreSubmission(submissionId: SubmissionId, input: ScoreInput): Submission {
    const submission = this.submissions.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    const challenge = this.requireChallenge(submission.challengeId);
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
    this.submissions.save(submission);
    return submission;
  }

  getLeaderboard(challengeId: ChallengeId): Submission[] {
    return this.submissions
      .findByChallengeId(challengeId)
      .filter((s) => s.score !== undefined)
      .sort((a, b) => {
        const scoreA = a.score?.totalScore ?? 0;
        const scoreB = b.score?.totalScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id.localeCompare(b.id);
      });
  }

  getSubmissionsForChallenge(challengeId: ChallengeId): Submission[] {
    return this.submissions.findByChallengeId(challengeId);
  }

  getSubmissionsForParticipant(participantId: ParticipantId): Submission[] {
    return this.submissions.findByParticipantId(participantId);
  }

  getSubmission(submissionId: SubmissionId): Submission | undefined {
    return this.submissions.findById(submissionId);
  }

  diffChallenges(aId: ChallengeId, bId: ChallengeId): ChallengeDiff {
    const a = this.requireChallenge(aId);
    const b = this.requireChallenge(bId);

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

  private requireChallenge(id: ChallengeId): Challenge {
    const challenge = this.challenges.findById(id);
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
