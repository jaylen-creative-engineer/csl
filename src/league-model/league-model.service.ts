import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types.js";
import {
  insertEnrollment,
  insertLeague,
  insertLeagueHost,
  insertParticipant,
  insertSeason,
  fetchLeagueHost,
  fetchSeason,
  fetchLeague,
  fetchParticipant,
  updateLeagueStatus,
  updateEnrollmentStatus,
  listParticipantsForLeague,
  listAllLeagueHosts,
  listAllLeagues,
  listAllSeasons,
  leagueExists,
} from "../lib/supabase/repositories/league.repository.js";
import { NotFoundError, ConflictError, InvalidStateError } from "../lib/errors.js";
import {
  newHostId,
  newLeagueId,
  newParticipantId,
  newSeasonId,
} from "../lib/supabase/ids.js";
import {
  type CreateLeagueHostInput,
  type CreateLeagueInput,
  type CreateParticipantInput,
  type CreateSeasonInput,
  type EnrollmentResult,
  EnrollmentStatus,
  type League,
  type LeagueHost,
  type LeagueId,
  type Participant,
  type ParticipantId,
  type Season,
  type SeasonId,
} from "./types.js";

// @lat: [[lat.md/domain-model#Domain model#Domain services (implementation)#LeagueModelService]]
export class LeagueModelService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async createLeagueHost(input: CreateLeagueHostInput): Promise<LeagueHost> {
    const id = newHostId();
    await insertLeagueHost(this.client, id, input);
    return fetchLeagueHost(this.client, id);
  }

  async getLeagueHost(id: string): Promise<LeagueHost | undefined> {
    try {
      return await fetchLeagueHost(this.client, id);
    } catch {
      return undefined;
    }
  }

  async createSeason(input: CreateSeasonInput): Promise<Season> {
    const id = newSeasonId();
    return insertSeason(this.client, id, input);
  }

  async getSeason(id: SeasonId): Promise<Season | undefined> {
    const row = await fetchSeason(this.client, id);
    return row ?? undefined;
  }

  async createLeague(input: CreateLeagueInput): Promise<League> {
    const host = await this.getLeagueHost(input.hostId);
    if (!host) throw new NotFoundError("LeagueHost", input.hostId);
    const id = newLeagueId();
    return insertLeague(this.client, id, input);
  }

  async getLeague(id: LeagueId): Promise<League | undefined> {
    try {
      return await fetchLeague(this.client, id);
    } catch {
      return undefined;
    }
  }

  async activateLeague(id: LeagueId): Promise<League> {
    const league = await this.getLeague(id);
    if (!league) throw new NotFoundError("League", id);
    if (league.status !== "draft") {
      throw new InvalidStateError("League", league.status, "draft");
    }
    await updateLeagueStatus(this.client, id, "active");
    return fetchLeague(this.client, id);
  }

  async closeLeague(id: LeagueId): Promise<League> {
    const league = await this.getLeague(id);
    if (!league) throw new NotFoundError("League", id);
    if (league.status !== "active") {
      throw new InvalidStateError("League", league.status, "active");
    }
    await updateLeagueStatus(this.client, id, "closed");
    return fetchLeague(this.client, id);
  }

  async createParticipant(input: CreateParticipantInput): Promise<Participant> {
    const id = newParticipantId();
    await insertParticipant(this.client, id, input);
    const p = await fetchParticipant(this.client, id);
    if (!p) throw new Error("Participant insert failed");
    return p;
  }

  // Gap 4: soft-withdraw a participant from a league (sets enrollment status to Withdrawn)
  async withdrawParticipant(leagueId: LeagueId, participantId: ParticipantId): Promise<void> {
    const leagueOk = await leagueExists(this.client, leagueId);
    if (!leagueOk) throw new NotFoundError("League", leagueId);

    const participant = await fetchParticipant(this.client, participantId);
    if (!participant) throw new NotFoundError("Participant", participantId);

    const membership = participant.leagueMemberships.find((m) => m.leagueId === leagueId);
    if (!membership) throw new NotFoundError("Enrollment", `${participantId} in ${leagueId}`);
    if (membership.status === EnrollmentStatus.Withdrawn) {
      throw new ConflictError(`Participant ${participantId} is already withdrawn from league ${leagueId}`);
    }

    await updateEnrollmentStatus(this.client, leagueId, participantId, "withdrawn");
  }

  async getParticipant(id: ParticipantId): Promise<Participant | undefined> {
    return (await fetchParticipant(this.client, id)) ?? undefined;
  }

  async listHosts(): Promise<LeagueHost[]> {
    return listAllLeagueHosts(this.client);
  }

  async listLeagues(): Promise<League[]> {
    return listAllLeagues(this.client);
  }

  async listSeasons(): Promise<Season[]> {
    return listAllSeasons(this.client);
  }

  async enrollParticipant(leagueId: LeagueId, participantId: ParticipantId): Promise<EnrollmentResult> {
    const leagueOk = await leagueExists(this.client, leagueId);
    if (!leagueOk) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "league not found",
      };
    }

    const participant = await fetchParticipant(this.client, participantId);
    if (!participant) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "participant not found",
      };
    }

    const enroll = await insertEnrollment(this.client, leagueId, participantId);
    if (!enroll.ok) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Enrolled,
        reason: "already enrolled",
      };
    }

    return {
      success: true,
      participantId,
      leagueId,
      status: EnrollmentStatus.Enrolled,
    };
  }

  async listParticipants(leagueId: LeagueId): Promise<Participant[]> {
    const leagueOk = await leagueExists(this.client, leagueId);
    if (!leagueOk) return [];
    return listParticipantsForLeague(this.client, leagueId);
  }

  /**
   * Returns the role a user holds in a given league, or null if they have no
   * role assignment. Reads from the league_roles table created in Phase 4.
   */
  async getUserRoleInLeague(leagueId: string, userId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("league_roles" as Parameters<typeof this.client.from>[0])
      .select("role")
      .eq("league_id", leagueId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { role: string }).role;
  }
}
