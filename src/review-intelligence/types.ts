import type { SubmissionId } from "../challenge-intelligence/types.js";
import type { ParticipantId } from "../league-model/types.js";

export type SubmissionReviewId = string;
export type SkillBand = "strong" | "developing" | "needs-work";

export interface CriterionReview {
  criteriaName: string;
  score: number;
  scoreBand: SkillBand;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedActions: string[];
}

export interface SubmissionAIReview {
  id: SubmissionReviewId;
  submissionId: SubmissionId;
  participantId: ParticipantId;
  overallSummary: string;
  criterionReviews: CriterionReview[];
  generatedAt: string;
}
