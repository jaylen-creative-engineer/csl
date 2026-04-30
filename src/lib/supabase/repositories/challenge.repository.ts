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
  CreateChallengeInput,
  Score,
  ScoreInput,
  Submission,
  SubmitEntryInput,
} from "../../../challenge-intelligence/types.js";
import { ChallengeStatus } from "../../../challenge-intelligence/types.js";

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
    .select("id, challenge_id, participant_id, artifact, is_public, submitted_at")
    .eq("id", id)
    .maybeSingle();
  if (sErr) throw new Error(sErr.message);
  if (!sub) return null;

  const { data: scoreRow } = await client
    .from("scores")
    .select("id, judge_id, criteria_scores, total_score, rationale, scored_at")
    .eq("submission_id", id)
    .maybeSingle();

  let score: Score | undefined;
  if (scoreRow) {
    score = {
      id: scoreRow.id,
      submissionId: id,
      judgeId: scoreRow.judge_id,
      criteriaScores: criteriaScoresFromJson(scoreRow.criteria_scores),
      totalScore: scoreRow.total_score,
      rationale: scoreRow.rationale,
      scoredAt: scoreRow.scored_at,
    };
  }

  return {
    id: sub.id,
    challengeId: sub.challenge_id,
    participantId: sub.participant_id,
    artifact: artifactFromJson(sub.artifact),
    isPublic: sub.is_public,
    submittedAt: sub.submitted_at,
    score,
  };
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
    .eq("challenge_id", challengeId);
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
    .eq("participant_id", participantId);
  if (error) throw new Error(error.message);

  const out: Submission[] = [];
  for (const s of subs ?? []) {
    const full = await fetchSubmission(client, s.id);
    if (full) out.push(full);
  }
  return out;
}
