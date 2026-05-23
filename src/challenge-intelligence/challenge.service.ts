import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types.js";
import type { ParticipantId } from "../league-model/types.js";
import {
  newChallengeId,
  newScoreId,
  newSubmissionId,
} from "../lib/supabase/ids.js";
import { writeAuditLog } from "../lib/audit-log.js";
import {
  insertChallenge,
  fetchChallenge,
  updateChallengeStatus,
  updateChallenge as repoUpdateChallenge,
  insertSubmission,
  fetchSubmission,
  markSubmissionWithdrawn,
  insertScore,
  listSubmissionsForChallenge,
  listSubmissionsForParticipant,
  listChallengesForLeague,
} from "../lib/supabase/repositories/challenge.repository.js";
import { deadlineToDb } from "../lib/supabase/mappers.js";
import { NotFoundError, InvalidStateError } from "../lib/errors.js";
import {
  type Challenge,
  type ChallengeId,
  type ChallengeUpdateInput,
  type ChallengeDiff,
  ChallengeStatus,
  type CreateChallengeInput,
  type Score,
  type ScoreInput,
  type Submission,
  type SubmissionId,
  type SubmitEntryInput,
} from "./types.js";

// @lat: [[lat.md/domain-model#Domain model#Domain services (implementation)#ChallengeService]]
export class ChallengeService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async createChallenge(input: CreateChallengeInput): Promise<Challenge> {
    const id = newChallengeId();
    return insertChallenge(this.client, id, input);
  }

  async getChallenge(id: ChallengeId): Promise<Challenge | undefined> {
    return (await fetchChallenge(this.client, id)) ?? undefined;
  }

  // Gap 5: update editable fields while challenge is in draft state
  async updateChallenge(challengeId: ChallengeId, patch: ChallengeUpdateInput): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Draft) {
      throw new InvalidStateError("Challenge", challenge.status, ChallengeStatus.Draft);
    }
    return repoUpdateChallenge(this.client, challengeId, patch);
  }

  async openChallenge(challengeId: ChallengeId): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Draft) {
      throw new InvalidStateError("Challenge", challenge.status, ChallengeStatus.Draft);
    }
    await updateChallengeStatus(this.client, challengeId, "open");
    return (await fetchChallenge(this.client, challengeId))!;
  }

  async closeForJudging(challengeId: ChallengeId): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new InvalidStateError("Challenge", challenge.status, ChallengeStatus.Open);
    }
    await updateChallengeStatus(this.client, challengeId, "judging");
    return (await fetchChallenge(this.client, challengeId))!;
  }

  async completeChallenge(challengeId: ChallengeId): Promise<Challenge> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new InvalidStateError("Challenge", challenge.status, ChallengeStatus.Judging);
    }
    await updateChallengeStatus(this.client, challengeId, "complete");
    return (await fetchChallenge(this.client, challengeId))!;
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
    const id = newSubmissionId();
    return insertSubmission(this.client, id, challengeId, participantId, input);
  }

  // Gap 4: withdraw a submission — only allowed while the challenge is open
  async withdrawSubmission(challengeId: ChallengeId, submissionId: SubmissionId): Promise<void> {
    const challenge = await this.requireChallenge(challengeId);
    if (challenge.status !== ChallengeStatus.Open) {
      throw new InvalidStateError("Challenge", challenge.status, ChallengeStatus.Open);
    }
    const submission = await fetchSubmission(this.client, submissionId);
    if (!submission) throw new NotFoundError("Submission", submissionId);
    await markSubmissionWithdrawn(this.client, submissionId);
  }

  async scoreSubmission(submissionId: SubmissionId, input: ScoreInput): Promise<Submission> {
    const submission = await fetchSubmission(this.client, submissionId);
    if (!submission) throw new NotFoundError("Submission", submissionId);

    const challenge = await this.requireChallenge(submission.challengeId);
    if (challenge.status !== ChallengeStatus.Judging) {
      throw new InvalidStateError("Challenge", challenge.status, ChallengeStatus.Judging);
    }

    const totalScore = this.computeTotalScore(input, challenge);
    const scoreId = newScoreId();
    await insertScore(this.client, scoreId, submissionId, input, totalScore);

    // Audit: record the scoring action for compliance tracking
    await writeAuditLog({
      action: "score_submission",
      entityType: "submission",
      entityId: submissionId,
      diff: { judgeId: input.judgeId, totalScore, criteriaScores: input.criteriaScores },
    });

    return (await fetchSubmission(this.client, submissionId))!;
  }

  // Gap 2: aggregate scores from multiple judges for leaderboard ranking
  async getLeaderboard(challengeId: ChallengeId): Promise<Submission[]> {
    const submissions = await listSubmissionsForChallenge(this.client, challengeId);

    return submissions
      .filter((s) => (s.scores?.length ?? 0) > 0)
      .sort((a, b) => {
        const scoreA = aggregateScore(a.scores ?? []);
        const scoreB = aggregateScore(b.scores ?? []);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.id.localeCompare(b.id);
      });
  }

  async getChallengesForLeague(leagueId: string): Promise<Challenge[]> {
    return listChallengesForLeague(this.client, leagueId);
  }

  async getSubmissionsForChallenge(challengeId: ChallengeId): Promise<Submission[]> {
    return listSubmissionsForChallenge(this.client, challengeId);
  }

  async getSubmissionsForParticipant(participantId: ParticipantId): Promise<Submission[]> {
    return listSubmissionsForParticipant(this.client, participantId);
  }

  async getSubmission(submissionId: SubmissionId): Promise<Submission | undefined> {
    return (await fetchSubmission(this.client, submissionId)) ?? undefined;
  }

  async diffChallenges(aId: ChallengeId, bId: ChallengeId): Promise<ChallengeDiff> {
    const a = await this.requireChallenge(aId);
    const b = await this.requireChallenge(bId);

    const criteriaANames = new Set(a.scoringCriteria.map((c) => c.name));
    const criteriaBNames = new Set(b.scoringCriteria.map((c) => c.name));

    const criteriaAdded = b.scoringCriteria.filter((c) => !criteriaANames.has(c.name));
    const criteriaRemoved = a.scoringCriteria.filter((c) => !criteriaBNames.has(c.name));

    return {
      challengeA: aId,
      challengeB: bId,
      titleChanged: a.title !== b.title,
      promptChanged: a.prompt !== b.prompt,
      deadlineChanged: deadlineToDb(a.deadline) !== deadlineToDb(b.deadline),
      criteriaAdded,
      criteriaRemoved,
    };
  }

  private async requireChallenge(id: ChallengeId): Promise<Challenge> {
    const challenge = await fetchChallenge(this.client, id);
    if (!challenge) throw new NotFoundError("Challenge", id);
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

// Exported helper: mean of all judge totalScores for a submission
export function aggregateScore(scores: Score[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length;
}
