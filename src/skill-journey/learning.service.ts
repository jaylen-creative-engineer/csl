import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types.js";
import type { ChallengeId } from "../challenge-intelligence/types.js";
import type { ParticipantId } from "../league-model/types.js";
import { NotFoundError } from "../lib/errors.js";
import {
  fetchFramework,
  fetchLearningPlan,
  fetchMilestone,
  insertCommitment,
  insertFramework,
  insertLearningPlan,
  insertMilestone,
  insertPath,
  insertResource,
  listFrameworks,
  listLearningPlansForParticipant,
  listMilestonesForParticipant,
  listPathsForPlan,
  listResourcesForChallenge,
  listResourcesForStep,
  updateMilestoneCompletedAt,
} from "../lib/supabase/repositories/skill-journey.repository.js";
import type {
  Commitment,
  Framework,
  FrameworkId,
  FrameworkStep,
  LearningPlan,
  LearningPlanId,
  Milestone,
  MilestoneId,
  Path,
  PathStep,
  PathVariant,
  PlanMilestoneSpec,
  Resource,
  ResourceType,
} from "./types.js";

/**
 * Frameworks, learning plans, paths, resources, and accountability primitives.
 * Plans group milestones (durable commitments) and one or more paths (depth/breadth variants).
 */
// @lat: [[lat.md/individual-learner-journey#Individual learner journey#Frameworks, plans, and paths]]
export class LearningService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // --- Frameworks --------------------------------------------------------

  async createFramework(
    name: string,
    skillLabel: string,
    description: string | undefined,
    steps: FrameworkStep[]
  ): Promise<Framework> {
    return insertFramework(this.client, name, skillLabel, description, steps);
  }

  async getFramework(id: FrameworkId): Promise<Framework | undefined> {
    const row = await fetchFramework(this.client, id);
    return row ?? undefined;
  }

  async listFrameworks(skillLabel?: string): Promise<Framework[]> {
    return listFrameworks(this.client, skillLabel);
  }

  // --- Plans -------------------------------------------------------------

  async createPlan(
    participantId: ParticipantId,
    frameworkId: FrameworkId | undefined,
    startDate: string | undefined,
    targetDate: string | undefined,
    milestones: PlanMilestoneSpec[] = []
  ): Promise<LearningPlan> {
    if (frameworkId !== undefined) {
      const framework = await fetchFramework(this.client, frameworkId);
      if (!framework) throw new NotFoundError("Framework", frameworkId);
    }
    return insertLearningPlan(
      this.client,
      participantId,
      frameworkId,
      startDate,
      targetDate,
      milestones
    );
  }

  async getPlan(id: LearningPlanId): Promise<LearningPlan | undefined> {
    const row = await fetchLearningPlan(this.client, id);
    return row ?? undefined;
  }

  async listPlansForParticipant(participantId: ParticipantId): Promise<LearningPlan[]> {
    return listLearningPlansForParticipant(this.client, participantId);
  }

  // --- Paths -------------------------------------------------------------

  async createPath(
    planId: LearningPlanId,
    variant: PathVariant,
    steps: PathStep[]
  ): Promise<Path> {
    const plan = await fetchLearningPlan(this.client, planId);
    if (!plan) throw new NotFoundError("LearningPlan", planId);
    return insertPath(this.client, planId, variant, steps);
  }

  async getPathsForPlan(planId: LearningPlanId): Promise<Path[]> {
    return listPathsForPlan(this.client, planId);
  }

  // --- Resources ---------------------------------------------------------

  async addResource(
    title: string,
    url: string | undefined,
    type: ResourceType,
    stepId?: string,
    challengeId?: ChallengeId
  ): Promise<Resource> {
    return insertResource(this.client, title, type, url, stepId, challengeId);
  }

  async getResourcesForStep(stepId: string): Promise<Resource[]> {
    return listResourcesForStep(this.client, stepId);
  }

  async getResourcesForChallenge(challengeId: ChallengeId): Promise<Resource[]> {
    return listResourcesForChallenge(this.client, challengeId);
  }

  // --- Accountability ----------------------------------------------------

  async addMilestone(
    planId: LearningPlanId,
    description: string,
    dueDate?: string
  ): Promise<Milestone> {
    const plan = await fetchLearningPlan(this.client, planId);
    if (!plan) throw new NotFoundError("LearningPlan", planId);
    return insertMilestone(this.client, planId, description, dueDate);
  }

  async completeMilestone(id: MilestoneId): Promise<Milestone> {
    const existing = await fetchMilestone(this.client, id);
    if (!existing) throw new NotFoundError("Milestone", id);
    return updateMilestoneCompletedAt(this.client, id, new Date().toISOString());
  }

  async addCommitment(
    participantId: ParticipantId,
    milestoneId: MilestoneId
  ): Promise<Commitment> {
    const milestone = await fetchMilestone(this.client, milestoneId);
    if (!milestone) throw new NotFoundError("Milestone", milestoneId);
    return insertCommitment(this.client, participantId, milestoneId);
  }

  /**
   * Bucket open milestones for a participant into overdue (past due_date) and upcoming
   * (due within the next 7 days). Completed milestones and milestones with no due_date
   * are excluded.
   */
  async checkMilestonesDue(
    participantId: ParticipantId
  ): Promise<{ overdue: Milestone[]; upcoming: Milestone[] }> {
    const milestones = await listMilestonesForParticipant(this.client, participantId);
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const overdue: Milestone[] = [];
    const upcoming: Milestone[] = [];

    for (const m of milestones) {
      if (m.completedAt) continue;
      if (!m.dueDate) continue;
      const due = new Date(m.dueDate).getTime();
      if (Number.isNaN(due)) continue;
      if (due < now) {
        overdue.push(m);
      } else if (due - now <= sevenDays) {
        upcoming.push(m);
      }
    }

    overdue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    upcoming.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return { overdue, upcoming };
  }
}
