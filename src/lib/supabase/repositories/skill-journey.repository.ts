import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../database.types.js";
import type {
  Commitment,
  Framework,
  FrameworkStep,
  LearningPlan,
  Milestone,
  Path,
  PathStep,
  PathVariant,
  PlanMilestoneSpec,
  Resource,
  ResourceType,
  SkillIntent,
} from "../../../skill-journey/types.js";

// --- JSON mappers ---------------------------------------------------------

function frameworkStepsToJson(steps: FrameworkStep[]): Json {
  return steps.map((s) => ({
    id: s.id,
    title: s.title,
    ...(s.description !== undefined ? { description: s.description } : {}),
  }));
}

function frameworkStepsFromJson(json: Json): FrameworkStep[] {
  if (!Array.isArray(json)) return [];
  return json.map((item, idx) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Invalid framework step at index ${idx}`);
    }
    const o = item as Record<string, Json>;
    return {
      id: String(o.id ?? idx),
      title: String(o.title ?? ""),
      ...(typeof o.description === "string" ? { description: o.description } : {}),
    };
  });
}

function pathStepsToJson(steps: PathStep[]): Json {
  return steps.map((s) => ({
    id: s.id,
    title: s.title,
    ...(s.description !== undefined ? { description: s.description } : {}),
    ...(s.resourceIds !== undefined ? { resourceIds: s.resourceIds } : {}),
  }));
}

function pathStepsFromJson(json: Json): PathStep[] {
  if (!Array.isArray(json)) return [];
  return json.map((item, idx) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Invalid path step at index ${idx}`);
    }
    const o = item as Record<string, Json>;
    const resourceIds = Array.isArray(o.resourceIds)
      ? (o.resourceIds as Json[]).map((r) => String(r))
      : undefined;
    return {
      id: String(o.id ?? idx),
      title: String(o.title ?? ""),
      ...(typeof o.description === "string" ? { description: o.description } : {}),
      ...(resourceIds !== undefined ? { resourceIds } : {}),
    };
  });
}

function planMilestonesToJson(milestones: PlanMilestoneSpec[]): Json {
  return milestones.map((m) => ({
    description: m.description,
    ...(m.dueDate !== undefined ? { dueDate: m.dueDate } : {}),
  }));
}

function planMilestonesFromJson(json: Json): PlanMilestoneSpec[] {
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Invalid plan milestone entry");
    }
    const o = item as Record<string, Json>;
    return {
      description: String(o.description ?? ""),
      ...(typeof o.dueDate === "string" ? { dueDate: o.dueDate } : {}),
    };
  });
}

function mapPathVariant(s: string): PathVariant {
  if (s === "depth" || s === "breadth") return s;
  throw new Error(`Unknown path variant: ${s}`);
}

function mapResourceType(s: string): ResourceType {
  if (s === "reading" || s === "exemplar" || s === "tool" || s === "brief") return s;
  throw new Error(`Unknown resource type: ${s}`);
}

// --- Skill intents --------------------------------------------------------

export async function insertSkillIntent(
  client: SupabaseClient<Database>,
  participantId: string,
  skillLabel: string,
  targetDisciplines: string[]
): Promise<SkillIntent> {
  const { data, error } = await client
    .from("skill_intents")
    .insert({
      participant_id: participantId,
      skill_label: skillLabel,
      target_disciplines: targetDisciplines,
    })
    .select("id, participant_id, skill_label, target_disciplines, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Skill intent insert failed");
  return {
    id: data.id,
    participantId: data.participant_id,
    skillLabel: data.skill_label,
    targetDisciplines: data.target_disciplines ?? [],
    createdAt: data.created_at,
  };
}

export async function fetchLatestSkillIntent(
  client: SupabaseClient<Database>,
  participantId: string
): Promise<SkillIntent | null> {
  const { data, error } = await client
    .from("skill_intents")
    .select("id, participant_id, skill_label, target_disciplines, created_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    participantId: data.participant_id,
    skillLabel: data.skill_label,
    targetDisciplines: data.target_disciplines ?? [],
    createdAt: data.created_at,
  };
}

// --- Frameworks -----------------------------------------------------------

export async function insertFramework(
  client: SupabaseClient<Database>,
  name: string,
  skillLabel: string,
  description: string | undefined,
  steps: FrameworkStep[]
): Promise<Framework> {
  const { data, error } = await client
    .from("frameworks")
    .insert({
      name,
      skill_label: skillLabel,
      description: description ?? null,
      steps: frameworkStepsToJson(steps),
    })
    .select("id, name, skill_label, description, steps, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Framework insert failed");
  return {
    id: data.id,
    name: data.name,
    skillLabel: data.skill_label,
    description: data.description ?? undefined,
    steps: frameworkStepsFromJson(data.steps),
    createdAt: data.created_at,
  };
}

export async function fetchFramework(
  client: SupabaseClient<Database>,
  id: string
): Promise<Framework | null> {
  const { data, error } = await client
    .from("frameworks")
    .select("id, name, skill_label, description, steps, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    skillLabel: data.skill_label,
    description: data.description ?? undefined,
    steps: frameworkStepsFromJson(data.steps),
    createdAt: data.created_at,
  };
}

export async function listFrameworks(
  client: SupabaseClient<Database>,
  skillLabel?: string
): Promise<Framework[]> {
  let q = client
    .from("frameworks")
    .select("id, name, skill_label, description, steps, created_at")
    .order("created_at", { ascending: false });
  if (skillLabel !== undefined) q = q.eq("skill_label", skillLabel);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    skillLabel: r.skill_label,
    description: r.description ?? undefined,
    steps: frameworkStepsFromJson(r.steps),
    createdAt: r.created_at,
  }));
}

// --- Learning plans -------------------------------------------------------

export async function insertLearningPlan(
  client: SupabaseClient<Database>,
  participantId: string,
  frameworkId: string | undefined,
  startDate: string | undefined,
  targetDate: string | undefined,
  milestones: PlanMilestoneSpec[] = []
): Promise<LearningPlan> {
  const { data, error } = await client
    .from("learning_plans")
    .insert({
      participant_id: participantId,
      framework_id: frameworkId ?? null,
      milestones: planMilestonesToJson(milestones),
      start_date: startDate ?? null,
      target_date: targetDate ?? null,
    })
    .select(
      "id, participant_id, framework_id, milestones, start_date, target_date, created_at"
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Learning plan insert failed");
  return {
    id: data.id,
    participantId: data.participant_id,
    frameworkId: data.framework_id ?? null,
    milestones: planMilestonesFromJson(data.milestones),
    startDate: data.start_date ?? null,
    targetDate: data.target_date ?? null,
    createdAt: data.created_at,
  };
}

export async function fetchLearningPlan(
  client: SupabaseClient<Database>,
  id: string
): Promise<LearningPlan | null> {
  const { data, error } = await client
    .from("learning_plans")
    .select(
      "id, participant_id, framework_id, milestones, start_date, target_date, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    participantId: data.participant_id,
    frameworkId: data.framework_id ?? null,
    milestones: planMilestonesFromJson(data.milestones),
    startDate: data.start_date ?? null,
    targetDate: data.target_date ?? null,
    createdAt: data.created_at,
  };
}

export async function listLearningPlansForParticipant(
  client: SupabaseClient<Database>,
  participantId: string
): Promise<LearningPlan[]> {
  const { data, error } = await client
    .from("learning_plans")
    .select(
      "id, participant_id, framework_id, milestones, start_date, target_date, created_at"
    )
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    participantId: r.participant_id,
    frameworkId: r.framework_id ?? null,
    milestones: planMilestonesFromJson(r.milestones),
    startDate: r.start_date ?? null,
    targetDate: r.target_date ?? null,
    createdAt: r.created_at,
  }));
}

// --- Paths ----------------------------------------------------------------

export async function insertPath(
  client: SupabaseClient<Database>,
  planId: string,
  variant: PathVariant,
  steps: PathStep[]
): Promise<Path> {
  const { data, error } = await client
    .from("paths")
    .insert({
      plan_id: planId,
      variant,
      steps: pathStepsToJson(steps),
    })
    .select("id, plan_id, variant, steps, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Path insert failed");
  return {
    id: data.id,
    planId: data.plan_id,
    variant: mapPathVariant(data.variant),
    steps: pathStepsFromJson(data.steps),
    createdAt: data.created_at,
  };
}

export async function listPathsForPlan(
  client: SupabaseClient<Database>,
  planId: string
): Promise<Path[]> {
  const { data, error } = await client
    .from("paths")
    .select("id, plan_id, variant, steps, created_at")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    planId: r.plan_id,
    variant: mapPathVariant(r.variant),
    steps: pathStepsFromJson(r.steps),
    createdAt: r.created_at,
  }));
}

// --- Resources ------------------------------------------------------------

export async function insertResource(
  client: SupabaseClient<Database>,
  title: string,
  type: ResourceType,
  url?: string,
  stepId?: string,
  challengeId?: string
): Promise<Resource> {
  const { data, error } = await client
    .from("resources")
    .insert({
      title,
      type,
      url: url ?? null,
      step_id: stepId ?? null,
      challenge_id: challengeId ?? null,
    })
    .select("id, title, url, type, step_id, challenge_id, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Resource insert failed");
  return {
    id: data.id,
    title: data.title,
    url: data.url ?? null,
    type: mapResourceType(data.type),
    stepId: data.step_id ?? null,
    challengeId: data.challenge_id ?? null,
    createdAt: data.created_at,
  };
}

export async function listResourcesForStep(
  client: SupabaseClient<Database>,
  stepId: string
): Promise<Resource[]> {
  const { data, error } = await client
    .from("resources")
    .select("id, title, url, type, step_id, challenge_id, created_at")
    .eq("step_id", stepId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url ?? null,
    type: mapResourceType(r.type),
    stepId: r.step_id ?? null,
    challengeId: r.challenge_id ?? null,
    createdAt: r.created_at,
  }));
}

export async function listResourcesForChallenge(
  client: SupabaseClient<Database>,
  challengeId: string
): Promise<Resource[]> {
  const { data, error } = await client
    .from("resources")
    .select("id, title, url, type, step_id, challenge_id, created_at")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url ?? null,
    type: mapResourceType(r.type),
    stepId: r.step_id ?? null,
    challengeId: r.challenge_id ?? null,
    createdAt: r.created_at,
  }));
}

// --- Milestones -----------------------------------------------------------

export async function insertMilestone(
  client: SupabaseClient<Database>,
  planId: string,
  description: string,
  dueDate?: string
): Promise<Milestone> {
  const { data, error } = await client
    .from("milestones")
    .insert({
      plan_id: planId,
      description,
      due_date: dueDate ?? null,
    })
    .select("id, plan_id, description, due_date, completed_at, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Milestone insert failed");
  return {
    id: data.id,
    planId: data.plan_id,
    description: data.description,
    dueDate: data.due_date ?? null,
    completedAt: data.completed_at ?? null,
    createdAt: data.created_at,
  };
}

export async function fetchMilestone(
  client: SupabaseClient<Database>,
  id: string
): Promise<Milestone | null> {
  const { data, error } = await client
    .from("milestones")
    .select("id, plan_id, description, due_date, completed_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    planId: data.plan_id,
    description: data.description,
    dueDate: data.due_date ?? null,
    completedAt: data.completed_at ?? null,
    createdAt: data.created_at,
  };
}

export async function updateMilestoneCompletedAt(
  client: SupabaseClient<Database>,
  id: string,
  completedAt: string
): Promise<Milestone> {
  const { data, error } = await client
    .from("milestones")
    .update({ completed_at: completedAt })
    .eq("id", id)
    .select("id, plan_id, description, due_date, completed_at, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Milestone update failed");
  return {
    id: data.id,
    planId: data.plan_id,
    description: data.description,
    dueDate: data.due_date ?? null,
    completedAt: data.completed_at ?? null,
    createdAt: data.created_at,
  };
}

export async function listMilestonesForParticipant(
  client: SupabaseClient<Database>,
  participantId: string
): Promise<Milestone[]> {
  const { data: plans, error: pErr } = await client
    .from("learning_plans")
    .select("id")
    .eq("participant_id", participantId);
  if (pErr) throw new Error(pErr.message);
  const planIds = (plans ?? []).map((p) => p.id);
  if (planIds.length === 0) return [];

  const { data, error } = await client
    .from("milestones")
    .select("id, plan_id, description, due_date, completed_at, created_at")
    .in("plan_id", planIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    planId: r.plan_id,
    description: r.description,
    dueDate: r.due_date ?? null,
    completedAt: r.completed_at ?? null,
    createdAt: r.created_at,
  }));
}

// --- Commitments ----------------------------------------------------------

export async function insertCommitment(
  client: SupabaseClient<Database>,
  participantId: string,
  milestoneId: string
): Promise<Commitment> {
  const { data, error } = await client
    .from("commitments")
    .insert({
      participant_id: participantId,
      milestone_id: milestoneId,
    })
    .select("id, participant_id, milestone_id, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Commitment insert failed");
  return {
    id: data.id,
    participantId: data.participant_id,
    milestoneId: data.milestone_id,
    createdAt: data.created_at,
  };
}
