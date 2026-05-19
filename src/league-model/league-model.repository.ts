import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import {
  EnrollmentStatus,
  type League,
  type LeagueHost,
  type LeagueHostId,
  type LeagueId,
  LeagueStatus,
  type Participant,
  type ParticipantId,
  type Season,
  type SeasonId,
} from "./types.js";

function prefixedId(prefix: string): string {
  return `${prefix}:${randomUUID()}`;
}

export interface LeagueModelRepository {
  createHost(input: { name: string; organization: string }): Promise<LeagueHost>;
  getHost(id: LeagueHostId): Promise<LeagueHost | undefined>;
  listHosts(): Promise<LeagueHost[]>;
  saveHost(host: LeagueHost): Promise<void>;

  createSeason(input: { name: string; startDate: string; endDate: string }): Promise<Season>;
  getSeason(id: SeasonId): Promise<Season | undefined>;

  createLeague(input: { name: string; hostId: LeagueHostId; seasonId?: SeasonId }): Promise<League>;
  getLeague(id: LeagueId): Promise<League | undefined>;
  listLeagues(): Promise<League[]>;
  saveLeague(league: League): Promise<void>;

  createParticipant(input: { handle: string; discipline: Participant["discipline"] }): Promise<Participant>;
  getParticipant(id: ParticipantId): Promise<Participant | undefined>;
  listParticipants(): Promise<Participant[]>;
  saveParticipant(participant: Participant): Promise<void>;
}

export class PostgresLeagueModelRepository implements LeagueModelRepository {
  constructor(private readonly pool: Pool) {}

  async createHost(input: { name: string; organization: string }): Promise<LeagueHost> {
    const host: LeagueHost = {
      id: prefixedId("host"),
      name: input.name,
      organization: input.organization,
      leagueIds: [],
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `insert into league_hosts (id, name, organization, league_ids, created_at)
       values ($1, $2, $3, $4::text[], $5::timestamptz)`,
      [host.id, host.name, host.organization, host.leagueIds, host.createdAt]
    );
    return host;
  }

  async getHost(id: LeagueHostId): Promise<LeagueHost | undefined> {
    const { rows } = await this.pool.query(
      `select id, name, organization, league_ids, created_at
       from league_hosts where id = $1 limit 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      organization: row.organization,
      leagueIds: row.league_ids ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async listHosts(): Promise<LeagueHost[]> {
    const { rows } = await this.pool.query(
      `select id, name, organization, league_ids, created_at
       from league_hosts order by created_at asc`
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      organization: row.organization,
      leagueIds: row.league_ids ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async saveHost(host: LeagueHost): Promise<void> {
    await this.pool.query(
      `update league_hosts
       set name = $2, organization = $3, league_ids = $4::text[]
       where id = $1`,
      [host.id, host.name, host.organization, host.leagueIds]
    );
  }

  async createSeason(input: { name: string; startDate: string; endDate: string }): Promise<Season> {
    const season: Season = {
      id: prefixedId("season"),
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `insert into seasons (id, name, start_date, end_date, created_at)
       values ($1, $2, $3::date, $4::date, $5::timestamptz)`,
      [season.id, season.name, season.startDate, season.endDate, season.createdAt]
    );
    return season;
  }

  async getSeason(id: SeasonId): Promise<Season | undefined> {
    const { rows } = await this.pool.query(
      `select id, name, start_date, end_date, created_at
       from seasons where id = $1 limit 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      startDate: new Date(row.start_date).toISOString().slice(0, 10),
      endDate: new Date(row.end_date).toISOString().slice(0, 10),
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async createLeague(input: { name: string; hostId: LeagueHostId; seasonId?: SeasonId }): Promise<League> {
    const league: League = {
      id: prefixedId("league"),
      name: input.name,
      hostId: input.hostId,
      seasonId: input.seasonId ?? null,
      status: LeagueStatus.Draft,
      challengeIds: [],
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `insert into leagues (id, name, host_id, season_id, status, challenge_ids, created_at)
       values ($1, $2, $3, $4, $5, $6::text[], $7::timestamptz)`,
      [league.id, league.name, league.hostId, league.seasonId, league.status, league.challengeIds, league.createdAt]
    );
    return league;
  }

  async getLeague(id: LeagueId): Promise<League | undefined> {
    const { rows } = await this.pool.query(
      `select id, name, host_id, season_id, status, challenge_ids, created_at
       from leagues where id = $1 limit 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      hostId: row.host_id,
      seasonId: row.season_id,
      status: row.status as LeagueStatus,
      challengeIds: row.challenge_ids ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async listLeagues(): Promise<League[]> {
    const { rows } = await this.pool.query(
      `select id, name, host_id, season_id, status, challenge_ids, created_at
       from leagues order by created_at asc`
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      hostId: row.host_id,
      seasonId: row.season_id,
      status: row.status as LeagueStatus,
      challengeIds: row.challenge_ids ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async saveLeague(league: League): Promise<void> {
    await this.pool.query(
      `update leagues
       set name = $2, host_id = $3, season_id = $4, status = $5, challenge_ids = $6::text[]
       where id = $1`,
      [league.id, league.name, league.hostId, league.seasonId, league.status, league.challengeIds]
    );
  }

  async createParticipant(input: {
    handle: string;
    discipline: Participant["discipline"];
  }): Promise<Participant> {
    const participant: Participant = {
      id: prefixedId("participant"),
      handle: input.handle,
      discipline: input.discipline,
      leagueMemberships: [],
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `insert into participants (id, handle, discipline, league_memberships, created_at)
       values ($1, $2, $3, $4::jsonb, $5::timestamptz)`,
      [participant.id, participant.handle, participant.discipline, JSON.stringify(participant.leagueMemberships), participant.createdAt]
    );
    return participant;
  }

  async getParticipant(id: ParticipantId): Promise<Participant | undefined> {
    const { rows } = await this.pool.query(
      `select id, handle, discipline, league_memberships, created_at
       from participants where id = $1 limit 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      handle: row.handle,
      discipline: row.discipline,
      leagueMemberships: row.league_memberships ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async listParticipants(): Promise<Participant[]> {
    const { rows } = await this.pool.query(
      `select id, handle, discipline, league_memberships, created_at
       from participants order by created_at asc`
    );
    return rows.map((row) => ({
      id: row.id,
      handle: row.handle,
      discipline: row.discipline,
      leagueMemberships: row.league_memberships ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  async saveParticipant(participant: Participant): Promise<void> {
    await this.pool.query(
      `update participants
       set handle = $2, discipline = $3, league_memberships = $4::jsonb
       where id = $1`,
      [
        participant.id,
        participant.handle,
        participant.discipline,
        JSON.stringify(participant.leagueMemberships),
      ]
    );
  }
}

export function isEnrolledInLeague(participant: Participant, leagueId: LeagueId): boolean {
  return participant.leagueMemberships.some(
    (membership) =>
      membership.leagueId === leagueId && membership.status === EnrollmentStatus.Enrolled
  );
}
