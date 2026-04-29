import type { ParticipantId } from "../league-model/types.js";
import {
  type Challenge,
  type ChallengeDiff,
  type ChallengeId,
  ChallengeStatus,
  type CreateChallengeInput,
  type Score,
  type ScoreId,
  type ScoreInput,
  type Submission,
  type SubmissionId,
  type SubmitEntryInput,
} from "./types.js";

let challengeCounter = 0;
let submissionCounter = 0;
let scoreCounter = 0;

function newId(prefix: string, counter: number): string {
  return `${prefix}:${counter}`;
}

export class ChallengeService {
  private readonly challenges = new Map<ChallengeId, Challenge>();
  private readonly submissions = new Map<SubmissionId, Submission>();

  createChallenge(input: CreateChallengeInput): Challenge {
    const id = newId("challenge", ++challengeCounter);
    const challenge: Challenge = {
      id,
      leagueId: input.leagueId,
      title: input.title,
      prompt: input.prompt,
      deadline: input.deadline,
      status: ChallengeStatus.Draft,
      scoringCriteria: input.scoringCriteria ?? [],
      sponsorId: input.sponsorId,
      createdAt: new Date().toISOString(),
    };
    this.challenges.set(id, challenge);
    return challenge;
  }

  getChallenge(id: ChallengeId): Challenge | undefined {
    return this.challenges.get(id);
  }

  openChallenge(challengeId: ChallengeId): Challenge {
    const challenge = this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Draft) {
      throw new Error(`Cannot open challenge in status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Open;
    return challenge;
  }

  closeForJudging(challengeId: ChallengeId): Challenge {
    const challenge = this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new Error(`Cannot move to judging from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Judging;
    return challenge;
  }

  completeChallenge(challengeId: ChallengeId): Challenge {
    const challenge = this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot complete challenge from status "${challenge.status}"`);
    }
    challenge.status = ChallengeStatus.Complete;
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
    const id = newId("submission", ++submissionCounter);
    const submission: Submission = {
      id,
      challengeId,
      participantId,
      artifact: input.artifact,
      isPublic: input.isPublic ?? true,
      submittedAt: new Date().toISOString(),
      revisionNumber: 1,
      rootSubmissionId: id,
    };
    this.submissions.set(id, submission);
    return submission;
  }

  submitRevision(submissionId: SubmissionId, input: SubmitEntryInput): Submission {
    const previousSubmission = this.submissions.get(submissionId);
    if (!previousSubmission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    const challenge = this.requireChallenge(previousSubmission.challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new Error("challenge not open");
    }

    const id = newId("submission", ++submissionCounter);
    const submission: Submission = {
      id,
      challengeId: previousSubmission.challengeId,
      participantId: previousSubmission.participantId,
      artifact: input.artifact,
      isPublic: input.isPublic ?? previousSubmission.isPublic,
      submittedAt: new Date().toISOString(),
      revisionNumber: previousSubmission.revisionNumber + 1,
      parentSubmissionId: previousSubmission.id,
      rootSubmissionId: previousSubmission.rootSubmissionId,
    };
    this.submissions.set(id, submission);
    return submission;
  }

  scoreSubmission(submissionId: SubmissionId, input: ScoreInput): Submission {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    const challenge = this.requireChallenge(submission.challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new Error(`Cannot score submission when challenge is in status "${challenge.status}"`);
    }

    const totalScore = this.computeTotalScore(input, challenge);
    const scoreId: ScoreId = newId("score", ++scoreCounter);

    const score: Score = {
      id: scoreId,
      submissionId,
      judgeId: input.judgeId,
      criteriaScores: input.criteriaScores,
      totalScore,
      rationale: input.rationale,
      scoredAt: new Date().toISOString(),
    };

    submission.score = score;
    return submission;
  }

  getLeaderboard(challengeId: ChallengeId): Submission[] {
    const submissions = Array.from(this.submissions.values()).filter(
      (s) => s.challengeId === challengeId
    );

    return submissions
      .filter((s) => s.score !== undefined)
      .sort((a, b) => {
        const scoreA = a.score?.totalScore ?? 0;
        const scoreB = b.score?.totalScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Deterministic tiebreak: sort by submission id (lexicographic)
        return a.id.localeCompare(b.id);
      });
  }

  getSubmissionsForChallenge(challengeId: ChallengeId): Submission[] {
    return Array.from(this.submissions.values()).filter(
      (s) => s.challengeId === challengeId
    );
  }

  getSubmissionsForParticipant(participantId: ParticipantId): Submission[] {
    return Array.from(this.submissions.values()).filter(
      (s) => s.participantId === participantId
    );
  }

  getSubmissionLineage(submissionId: SubmissionId): Submission[] {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    return Array.from(this.submissions.values())
      .filter((s) => s.rootSubmissionId === submission.rootSubmissionId)
      .sort((a, b) => a.revisionNumber - b.revisionNumber);
  }

  getSubmission(submissionId: SubmissionId): Submission | undefined {
    return this.submissions.get(submissionId);
  }

  diffChallenges(aId: ChallengeId, bId: ChallengeId): ChallengeDiff {
    const a = this.requireChallenge(aId);
    const b = this.requireChallenge(bId);

    const criteriaANames = new Set(a.scoringCriteria.map((c) => c.name));
    const criteriaBNames = new Set(b.scoringCriteria.map((c) => c.name));

    const criteriaAdded = b.scoringCriteria.filter((c) => !criteriaANames.has(c.name));
    const criteriaRemoved = a.scoringCriteria.filter((c) => !criteriaBNames.has(c.name));

    return {
      challengeA: aId,
      challengeB: bId,
      titleChanged: a.title !== b.title,
      promptChanged: a.prompt !== b.prompt,
      deadlineChanged: a.deadline !== b.deadline,
      criteriaAdded,
      criteriaRemoved,
    };
  }

  private requireChallenge(id: ChallengeId): Challenge {
    const challenge = this.challenges.get(id);
    if (!challenge) throw new Error(`Challenge not found: ${id}`);
    return challenge;
  }

  private computeTotalScore(input: ScoreInput, challenge: Challenge): number {
    if (challenge.scoringCriteria.length === 0) {
      // No criteria defined: average raw scores
      if (input.criteriaScores.length === 0) return 0;
      const sum = input.criteriaScores.reduce((acc, cs) => acc + cs.score, 0);
      return sum / input.criteriaScores.length;
    }

    // Weighted sum
    return input.criteriaScores.reduce((total, cs) => {
      const criterion = challenge.scoringCriteria.find((c) => c.name === cs.criteriaName);
      const weight = criterion?.weight ?? 0;
      return total + cs.score * weight;
    }, 0);
  }
}
