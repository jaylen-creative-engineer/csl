import {
  type CreateLeagueHostInput,
  type CreateLeagueInput,
  type CreateParticipantInput,
  type CreateSeasonInput,
  type EnrollmentResult,
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

let leagueCounter = 0;
let seasonCounter = 0;
let hostCounter = 0;
let participantCounter = 0;

function newId(prefix: string, counter: number): string {
  return `${prefix}:${counter}`;
}

export class LeagueModelService {
  private readonly leagues = new Map<LeagueId, League>();
  private readonly seasons = new Map<SeasonId, Season>();
  private readonly hosts = new Map<LeagueHostId, LeagueHost>();
  private readonly participants = new Map<ParticipantId, Participant>();

  createLeagueHost(input: CreateLeagueHostInput): LeagueHost {
    const id = newId("host", ++hostCounter);
    const host: LeagueHost = {
      id,
      name: input.name,
      organization: input.organization,
      leagueIds: [],
      createdAt: new Date().toISOString(),
    };
    this.hosts.set(id, host);
    return host;
  }

  getLeagueHost(id: LeagueHostId): LeagueHost | undefined {
    return this.hosts.get(id);
  }

  createSeason(input: CreateSeasonInput): Season {
    const id = newId("season", ++seasonCounter);
    const season: Season = {
      id,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date().toISOString(),
    };
    this.seasons.set(id, season);
    return season;
  }

  getSeason(id: SeasonId): Season | undefined {
    return this.seasons.get(id);
  }

  createLeague(input: CreateLeagueInput): League {
    const host = this.hosts.get(input.hostId);
    if (!host) {
      throw new Error(`LeagueHost not found: ${input.hostId}`);
    }
    const id = newId("league", ++leagueCounter);
    const league: League = {
      id,
      name: input.name,
      hostId: input.hostId,
      seasonId: input.seasonId ?? null,
      status: LeagueStatus.Draft,
      challengeIds: [],
      createdAt: new Date().toISOString(),
    };
    this.leagues.set(id, league);
    host.leagueIds.push(id);
    return league;
  }

  getLeague(id: LeagueId): League | undefined {
    return this.leagues.get(id);
  }

  activateLeague(id: LeagueId): League {
    const league = this.leagues.get(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Draft) {
      throw new Error(`Cannot activate league in status "${league.status}": expected "draft"`);
    }
    league.status = LeagueStatus.Active;
    return league;
  }

  closeLeague(id: LeagueId): League {
    const league = this.leagues.get(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Active) {
      throw new Error(`Cannot close league in status "${league.status}": expected "active"`);
    }
    league.status = LeagueStatus.Closed;
    return league;
  }

  createParticipant(input: CreateParticipantInput): Participant {
    const id = newId("participant", ++participantCounter);
    const participant: Participant = {
      id,
      handle: input.handle,
      discipline: input.discipline,
      leagueMemberships: [],
      createdAt: new Date().toISOString(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  getParticipant(id: ParticipantId): Participant | undefined {
    return this.participants.get(id);
  }

  enrollParticipant(leagueId: LeagueId, participantId: ParticipantId): EnrollmentResult {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "league not found",
      };
    }

    const participant = this.participants.get(participantId);
    if (!participant) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "participant not found",
      };
    }

    const existing = participant.leagueMemberships.find(
      (m) => m.leagueId === leagueId && m.status === EnrollmentStatus.Enrolled
    );
    if (existing) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Enrolled,
        reason: "already enrolled",
      };
    }

    participant.leagueMemberships.push({
      leagueId,
      status: EnrollmentStatus.Enrolled,
      enrolledAt: new Date().toISOString(),
    });

    return {
      success: true,
      participantId,
      leagueId,
      status: EnrollmentStatus.Enrolled,
    };
  }

  listParticipants(leagueId: LeagueId): Participant[] {
    const league = this.leagues.get(leagueId);
    if (!league) return [];

    return Array.from(this.participants.values()).filter((p) =>
      p.leagueMemberships.some(
        (m) => m.leagueId === leagueId && m.status === EnrollmentStatus.Enrolled
      )
    );
  }
}
