import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types.js";
import {
  artifactFromJson,
  artifactToJson,
  criteriaScoresFromJson,
  criteriaScoresToJson,
  deadlineFromDb,
  deadlineToDb,
  scoringCriteriaFromJson,
  scoringCriteriaToJson,
} from "../mappers.js";
import type {
  Challenge,
  ChallengeUpdateInput,
  CreateChallengeInput,
  Score,
  ScoreInput,
  Submission,
  SubmitEntryInput,
} from "../../../challenge-intelligence/types.js";
import { ChallengeStatus } from "../../../challenge-intelligence/types.js";
import { NotFoundError } from "../../errors.js";

function mapChallengeStatus(s: string): ChallengeStatus {
  if (s === "draft" || s === "open" || s === "judging" || s === "complete") {
    return s as ChallengeStatus;
  }
  throw new Error(`Unknown challenge status: ${s}`);
}

export async function insertChallenge(
  client: SupabaseClient<Database>,
  id: string,
  input: CreateChallengeInput
): Promise<Challenge> {
  // Gap 6: validate sponsorId before insert to avoid orphaned references
  if (input.sponsorId) {
    const { data: sponsor } = await client
      .from("sponsors")
      .select("id")
      .eq("id", input.sponsorId)
      .maybeSingle();
    if (!sponsor) throw new NotFoundError("Sponsor", input.sponsorId);
  }

  const criteria = input.scoringCriteria ?? [];
  const { error } = await client.from("challenges").insert({
    id,
    league_id: input.leagueId,
    title: input.title,
    prompt: input.prompt,
    deadline: deadlineToDb(input.deadline),
    status: "draft",
    scoring_criteria: scoringCriteriaToJson(criteria),
    sponsor_id: input.sponsorId ?? null,
  });
  if (error) throw new Error(error.message);
  const row = await fetchChallenge(client, id);
  if (!row) throw new Error(`Challenge insert failed: ${id}`);
  return row;
}

export async function fetchChallenge(client: SupabaseClient<Database>, id: string): Promise<Challenge | null> {
  const { data: row, error } = await client
    .from("challenges")
    .select(
      "id, league_id, title, prompt, deadline, status, scoring_criteria, sponsor_id, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return {
    id: row.id,
    leagueId: row.league_id,
    title: row.title,
    prompt: row.prompt,
    deadline: deadlineFromDb(row.deadline),
    status: mapChallengeStatus(row.status),
    scoringCriteria: scoringCriteriaFromJson(row.scoring_criteria),
    sponsorId: row.sponsor_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function updateChallengeStatus(
  client: SupabaseClient<Database>,
  id: string,
  status: "draft" | "open" | "judging" | "complete"
): Promise<void> {
  const { error } = await client.from("challenges").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

// Gap 5: update challenge fields while in draft state
export async function updateChallenge(
  client: SupabaseClient<Database>,
  id: string,
  patch: ChallengeUpdateInput
): Promise<Challenge> {
  type ChallengeRow = Database["public"]["Tables"]["challenges"]["Update"];
  const updatePayload: ChallengeRow = {};
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.prompt !== undefined) updatePayload.prompt = patch.prompt;
  if (patch.deadline !== undefined) updatePayload.deadline = deadlineToDb(patch.deadline);
  if (patch.scoringCriteria !== undefined)
    updatePayload.scoring_criteria = scoringCriteriaToJson(patch.scoringCriteria);

  const { error } = await client.from("challenges").update(updatePayload).eq("id", id);
  if (error) throw new Error(error.message);
  const row = await fetchChallenge(client, id);
  if (!row) throw new NotFoundError("Challenge", id);
  return row;
}

// Gap 3: sync Challenge.sponsorId when a sponsor attaches
export async function updateChallengeSponsorId(
  client: SupabaseClient<Database>,
  challengeId: string,
  sponsorId: string
): Promise<void> {
  const { error } = await client
    .from("challenges")
    .update({ sponsor_id: sponsorId })
    .eq("id", challengeId);
  if (error) throw new Error(error.message);
}

export async function insertSubmission(
  client: SupabaseClient<Database>,
  id: string,
  challengeId: string,
  participantId: string,
  input: SubmitEntryInput
): Promise<Submission> {
  const { error } = await client.from("submissions").insert({
    id,
    challenge_id: challengeId,
    participant_id: participantId,
    artifact: artifactToJson(input.artifact),
    is_public: input.isPublic ?? true,
  });
  if (error) throw new Error(error.message);
  const row = await fetchSubmission(client, id);
  if (!row) throw new Error(`Submission insert failed: ${id}`);
  return row;
}

export async function fetchSubmission(
  client: SupabaseClient<Database>,
  id: string
): Promise<Submission | null> {
  const { data: sub, error: sErr } = await client
    .from("submissions")
    .select("id, challenge_id, participant_id, artifact, is_public, withdrawn, submitted_at")
    .eq("id", id)
    .maybeSingle();
  if (sErr) throw new Error(sErr.message);
  if (!sub) return null;

  // Gap 2: fetch ALL scores for this submission (multi-judge support)
  const { data: scoreRows, error: scErr } = await client
    .from("scores")
    .select("id, judge_id, criteria_scores, total_score, rationale, scored_at")
    .eq("submission_id", id)
    .order("scored_at", { ascending: true });
  if (scErr) throw new Error(scErr.message);

  const scores: Score[] = (scoreRows ?? []).map((r) => ({
    id: r.id,
    submissionId: id,
    judgeId: r.judge_id,
    criteriaScores: criteriaScoresFromJson(r.criteria_scores),
    totalScore: r.total_score,
    rationale: r.rationale,
    scoredAt: r.scored_at,
  }));

  return {
    id: sub.id,
    challengeId: sub.challenge_id,
    participantId: sub.participant_id,
    artifact: artifactFromJson(sub.artifact),
    isPublic: sub.is_public,
    withdrawn: sub.withdrawn,
    submittedAt: sub.submitted_at,
    scores,
  };
}

// Gap 4: soft-delete a submission (only while challenge is open, enforced by service)
export async function markSubmissionWithdrawn(
  client: SupabaseClient<Database>,
  submissionId: string
): Promise<void> {
  const { error } = await client
    .from("submissions")
    .update({ withdrawn: true })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);
}

export async function insertScore(
  client: SupabaseClient<Database>,
  id: string,
  submissionId: string,
  input: ScoreInput,
  totalScore: number
): Promise<void> {
  const { error } = await client.from("scores").insert({
    id,
    submission_id: submissionId,
    judge_id: input.judgeId,
    criteria_scores: criteriaScoresToJson(input.criteriaScores),
    total_score: totalScore,
    rationale: input.rationale,
  });
  if (error) throw new Error(error.message);
}

export async function listSubmissionsForChallenge(
  client: SupabaseClient<Database>,
  challengeId: string
): Promise<Submission[]> {
  const { data: subs, error } = await client
    .from("submissions")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("withdrawn", false);
  if (error) throw new Error(error.message);

  const out: Submission[] = [];
  for (const s of subs ?? []) {
    const full = await fetchSubmission(client, s.id);
    if (full) out.push(full);
  }
  return out;
}

export async function listSubmissionsForParticipant(
  client: SupabaseClient<Database>,
  participantId: string
): Promise<Submission[]> {
  const { data: subs, error } = await client
    .from("submissions")
    .select("id")
    .eq("participant_id", participantId)
    .eq("withdrawn", false);
  if (error) throw new Error(error.message);

  const out: Submission[] = [];
  for (const s of subs ?? []) {
    const full = await fetchSubmission(client, s.id);
    if (full) out.push(full);
  }
  return out;
}

export async function listChallengesForLeague(
  client: SupabaseClient<Database>,
  leagueId: string
): Promise<Challenge[]> {
  const { data: rows, error } = await client
    .from("challenges")
    .select("id")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const out: Challenge[] = [];
  for (const r of rows ?? []) {
    const full = await fetchChallenge(client, r.id);
    if (full) out.push(full);
  }
  return out;
}
