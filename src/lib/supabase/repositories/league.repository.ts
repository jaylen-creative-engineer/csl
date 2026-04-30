import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types.js";
import { disciplineFromId, disciplineToId } from "../mappers.js";
import type {
  CreateLeagueHostInput,
  CreateLeagueInput,
  CreateParticipantInput,
  CreateSeasonInput,
  League,
  LeagueHost,
  LeagueMembership,
  Participant,
  Season,
} from "../../../league-model/types.js";
import { EnrollmentStatus, LeagueStatus } from "../../../league-model/types.js";

function mapLeagueStatus(s: string): LeagueStatus {
  if (s === "draft" || s === "active" || s === "closed") return s as LeagueStatus;
  throw new Error(`Unknown league status: ${s}`);
}

export async function insertLeagueHost(
  client: SupabaseClient<Database>,
  id: string,
  input: CreateLeagueHostInput
): Promise<LeagueHost> {
  const { error } = await client.from("league_hosts").insert({
    id,
    name: input.name,
    organization: input.organization,
  });
  if (error) throw new Error(error.message);
  return fetchLeagueHost(client, id);
}

export async function fetchLeagueHost(
  client: SupabaseClient<Database>,
  id: string
): Promise<LeagueHost> {
  const { data: host, error: hErr } = await client
    .from("league_hosts")
    .select("id, name, organization, created_at")
    .eq("id", id)
    .single();
  if (hErr || !host) throw new Error(hErr?.message ?? `LeagueHost not found: ${id}`);

  const { data: leagues } = await client.from("leagues").select("id").eq("host_id", id);

  return {
    id: host.id,
    name: host.name,
    organization: host.organization,
    leagueIds: (leagues ?? []).map((l) => l.id),
    createdAt: host.created_at,
  };
}

export async function insertSeason(
  client: SupabaseClient<Database>,
  id: string,
  input: CreateSeasonInput,
  periodId: string = "custom"
): Promise<Season> {
  const { error } = await client.from("seasons").insert({
    id,
    name: input.name,
    start_date: input.startDate,
    end_date: input.endDate,
    period_id: periodId,
  });
  if (error) throw new Error(error.message);

  const { data: row, error: fErr } = await client
    .from("seasons")
    .select("id, name, start_date, end_date, created_at")
    .eq("id", id)
    .single();
  if (fErr || !row) throw new Error(fErr?.message ?? "Season insert failed");

  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

export async function fetchSeason(client: SupabaseClient<Database>, id: string): Promise<Season | null> {
  const { data: row, error } = await client
    .from("seasons")
    .select("id, name, start_date, end_date, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

export async function insertLeague(
  client: SupabaseClient<Database>,
  id: string,
  input: CreateLeagueInput
): Promise<League> {
  const { error } = await client.from("leagues").insert({
    id,
    name: input.name,
    host_id: input.hostId,
    season_id: input.seasonId ?? null,
    status: "draft",
  });
  if (error) throw new Error(error.message);
  return fetchLeague(client, id);
}

export async function fetchLeague(client: SupabaseClient<Database>, id: string): Promise<League> {
  const { data: row, error } = await client
    .from("leagues")
    .select("id, name, host_id, season_id, status, created_at")
    .eq("id", id)
    .single();
  if (error || !row) throw new Error(error?.message ?? `League not found: ${id}`);

  const { data: challenges } = await client.from("challenges").select("id").eq("league_id", id);

  return {
    id: row.id,
    name: row.name,
    hostId: row.host_id,
    seasonId: row.season_id,
    status: mapLeagueStatus(row.status),
    challengeIds: (challenges ?? []).map((c) => c.id),
    createdAt: row.created_at,
  };
}

export async function updateLeagueStatus(
  client: SupabaseClient<Database>,
  id: string,
  status: "draft" | "active" | "closed"
): Promise<void> {
  const { error } = await client.from("leagues").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertParticipant(
  client: SupabaseClient<Database>,
  id: string,
  input: CreateParticipantInput
): Promise<void> {
  const { error } = await client.from("participants").insert({
    id,
    handle: input.handle,
    discipline_id: disciplineToId(input.discipline),
    user_id: input.userId ?? null,
  });
  if (error) throw new Error(error.message);
}

async function fetchMemberships(
  client: SupabaseClient<Database>,
  participantId: string
): Promise<LeagueMembership[]> {
  const { data, error } = await client
    .from("league_enrollments")
    .select("league_id, status, enrolled_at")
    .eq("participant_id", participantId);
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    leagueId: r.league_id,
    status: r.status === "enrolled" ? EnrollmentStatus.Enrolled : EnrollmentStatus.Withdrawn,
    enrolledAt: r.enrolled_at,
  }));
}

export async function fetchParticipant(
  client: SupabaseClient<Database>,
  id: string
): Promise<Participant | null> {
  const { data: row, error } = await client
    .from("participants")
    .select("id, handle, discipline_id, created_at, user_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const leagueMemberships = await fetchMemberships(client, id);

  return {
    id: row.id,
    userId: row.user_id,
    handle: row.handle,
    discipline: disciplineFromId(row.discipline_id),
    leagueMemberships,
    createdAt: row.created_at,
  };
}

export async function insertEnrollment(
  client: SupabaseClient<Database>,
  leagueId: string,
  participantId: string
): Promise<{ ok: true } | { ok: false; code: "duplicate" }> {
  const { error } = await client.from("league_enrollments").insert({
    league_id: leagueId,
    participant_id: participantId,
    status: "enrolled",
  });
  if (error) {
    if (error.code === "23505") return { ok: false, code: "duplicate" };
    throw new Error(error.message);
  }
  return { ok: true };
}

export async function listParticipantsForLeague(
  client: SupabaseClient<Database>,
  leagueId: string
): Promise<Participant[]> {
  const { data: rows, error } = await client
    .from("league_enrollments")
    .select("participant_id")
    .eq("league_id", leagueId)
    .eq("status", "enrolled");
  if (error) throw new Error(error.message);

  const ids = [...new Set((rows ?? []).map((r) => r.participant_id))];
  const participants: Participant[] = [];
  for (const pid of ids) {
    const p = await fetchParticipant(client, pid);
    if (p) participants.push(p);
  }
  return participants;
}

export async function leagueExists(client: SupabaseClient<Database>, id: string): Promise<boolean> {
  const { data, error } = await client.from("leagues").select("id").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}
