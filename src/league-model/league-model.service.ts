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
import {
  InMemoryLeagueHostRepository,
  InMemoryLeagueRepository,
  InMemoryParticipantRepository,
  InMemorySeasonRepository,
} from "../persistence/in-memory/league-model.repositories.js";
import type {
  ILeagueHostRepository,
  ILeagueRepository,
  IParticipantRepository,
  ISeasonRepository,
} from "../persistence/repository.types.js";

export class LeagueModelService {
  constructor(
    private readonly hosts: ILeagueHostRepository = new InMemoryLeagueHostRepository(),
    private readonly seasons: ISeasonRepository = new InMemorySeasonRepository(),
    private readonly leagues: ILeagueRepository = new InMemoryLeagueRepository(),
    private readonly participants: IParticipantRepository = new InMemoryParticipantRepository(),
  ) {}

  createLeagueHost(input: CreateLeagueHostInput): LeagueHost {
    const host: LeagueHost = {
      id: this.hosts.nextId(),
      name: input.name,
      organization: input.organization,
      leagueIds: [],
      createdAt: new Date().toISOString(),
    };
    this.hosts.save(host);
    return host;
  }

  getLeagueHost(id: LeagueHostId): LeagueHost | undefined {
    return this.hosts.findById(id);
  }

  createSeason(input: CreateSeasonInput): Season {
    const season: Season = {
      id: this.seasons.nextId(),
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date().toISOString(),
    };
    this.seasons.save(season);
    return season;
  }

  getSeason(id: SeasonId): Season | undefined {
    return this.seasons.findById(id);
  }

  createLeague(input: CreateLeagueInput): League {
    const host = this.hosts.findById(input.hostId);
    if (!host) {
      throw new Error(`LeagueHost not found: ${input.hostId}`);
    }
    const league: League = {
      id: this.leagues.nextId(),
      name: input.name,
      hostId: input.hostId,
      seasonId: input.seasonId ?? null,
      status: LeagueStatus.Draft,
      challengeIds: [],
      createdAt: new Date().toISOString(),
    };
    this.leagues.save(league);
    host.leagueIds.push(league.id);
    this.hosts.save(host);
    return league;
  }

  getLeague(id: LeagueId): League | undefined {
    return this.leagues.findById(id);
  }

  activateLeague(id: LeagueId): League {
    const league = this.leagues.findById(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Draft) {
      throw new Error(`Cannot activate league in status "${league.status}": expected "draft"`);
    }
    league.status = LeagueStatus.Active;
    this.leagues.save(league);
    return league;
  }

  closeLeague(id: LeagueId): League {
    const league = this.leagues.findById(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Active) {
      throw new Error(`Cannot close league in status "${league.status}": expected "active"`);
    }
    league.status = LeagueStatus.Closed;
    this.leagues.save(league);
    return league;
  }

  createParticipant(input: CreateParticipantInput): Participant {
    const participant: Participant = {
      id: this.participants.nextId(),
      handle: input.handle,
      discipline: input.discipline,
      leagueMemberships: [],
      createdAt: new Date().toISOString(),
    };
    this.participants.save(participant);
    return participant;
  }

  getParticipant(id: ParticipantId): Participant | undefined {
    return this.participants.findById(id);
  }

  enrollParticipant(leagueId: LeagueId, participantId: ParticipantId): EnrollmentResult {
    const league = this.leagues.findById(leagueId);
    if (!league) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "league not found",
      };
    }

    const participant = this.participants.findById(participantId);
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
    this.participants.save(participant);

    return {
      success: true,
      participantId,
      leagueId,
      status: EnrollmentStatus.Enrolled,
    };
  }

  listParticipants(leagueId: LeagueId): Participant[] {
    const league = this.leagues.findById(leagueId);
    if (!league) return [];

    return this.participants.findAll().filter((p) =>
      p.leagueMemberships.some(
        (m) => m.leagueId === leagueId && m.status === EnrollmentStatus.Enrolled
      )
    );
  }
}
