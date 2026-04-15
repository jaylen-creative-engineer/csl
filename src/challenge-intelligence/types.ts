import type { LeagueId, ParticipantId } from "../league-model/types.js";

export type ChallengeId = string;
export type SubmissionId = string;
export type ScoreId = string;

export enum ChallengeStatus {
  Draft = "draft",
  Open = "open",
  Judging = "judging",
  Complete = "complete",
}

export interface ScoringCriteria {
  name: string;
  weight: number; // 0–1, weights across all criteria should sum to 1
  description?: string;
}

export interface SubmissionArtifact {
  url: string;
  mimeType?: string;
  description?: string;
}

export interface Challenge {
  id: ChallengeId;
  leagueId: LeagueId;
  title: string;
  prompt: string;
  deadline: string; // ISO date string
  status: ChallengeStatus;
  scoringCriteria: ScoringCriteria[];
  sponsorId?: string;
  createdAt: string;
}

export interface Score {
  id: ScoreId;
  submissionId: SubmissionId;
  judgeId: string;
  criteriaScores: CriteriaScore[];
  totalScore: number; // computed from weighted criteria
  rationale: string;
  scoredAt: string;
}

export interface CriteriaScore {
  criteriaName: string;
  score: number; // 0–100
}

export interface Submission {
  id: SubmissionId;
  challengeId: ChallengeId;
  participantId: ParticipantId;
  artifact: SubmissionArtifact;
  isPublic: boolean;
  submittedAt: string;
  score?: Score;
}

export interface ChallengeDiff {
  challengeA: ChallengeId;
  challengeB: ChallengeId;
  titleChanged: boolean;
  promptChanged: boolean;
  deadlineChanged: boolean;
  criteriaAdded: ScoringCriteria[];
  criteriaRemoved: ScoringCriteria[];
}

export interface CreateChallengeInput {
  leagueId: LeagueId;
  title: string;
  prompt: string;
  deadline: string;
  scoringCriteria?: ScoringCriteria[];
  sponsorId?: string;
}

export interface SubmitEntryInput {
  artifact: SubmissionArtifact;
  isPublic?: boolean;
}

export interface ScoreInput {
  judgeId: string;
  criteriaScores: CriteriaScore[];
  rationale: string;
}
