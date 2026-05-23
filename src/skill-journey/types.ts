import type { ChallengeId } from "../challenge-intelligence/types.js";
import type { ParticipantId } from "../league-model/types.js";

export type SkillIntentId = string;
export type FrameworkId = string;
export type LearningPlanId = string;
export type PathId = string;
export type ResourceId = string;
export type MilestoneId = string;
export type CommitmentId = string;

export interface SkillIntent {
  id: SkillIntentId;
  participantId: ParticipantId;
  skillLabel: string;
  targetDisciplines: string[];
  createdAt: string;
}

export interface MasteryEntry {
  criterion: string;
  avgScore: number;
  count: number;
}

export interface EvidenceEntry {
  submissionId: string;
  score: number;
  criterionBreakdown: { criterion: string; score: number }[];
  sprintDate: string; // ISO timestamp of submission
}

export interface FrameworkStep {
  id: string;
  title: string;
  description?: string;
}

export interface Framework {
  id: FrameworkId;
  name: string;
  skillLabel: string;
  description?: string;
  steps: FrameworkStep[];
  createdAt: string;
}

export interface PlanMilestoneSpec {
  description: string;
  dueDate?: string;
}

export interface LearningPlan {
  id: LearningPlanId;
  participantId: ParticipantId;
  frameworkId: FrameworkId | null;
  milestones: PlanMilestoneSpec[];
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
}

export type PathVariant = "depth" | "breadth";

export interface PathStep {
  id: string;
  title: string;
  description?: string;
  resourceIds?: ResourceId[];
}

export interface Path {
  id: PathId;
  planId: LearningPlanId;
  variant: PathVariant;
  steps: PathStep[];
  createdAt: string;
}

export type ResourceType = "reading" | "exemplar" | "tool" | "brief";

export interface Resource {
  id: ResourceId;
  title: string;
  url: string | null;
  type: ResourceType;
  stepId: string | null;
  challengeId: ChallengeId | null;
  createdAt: string;
}

export interface Milestone {
  id: MilestoneId;
  planId: LearningPlanId;
  description: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Commitment {
  id: CommitmentId;
  participantId: ParticipantId;
  milestoneId: MilestoneId;
  createdAt: string;
}
