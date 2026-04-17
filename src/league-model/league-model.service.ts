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

  async createLeagueHost(input: CreateLeagueHostInput): Promise<LeagueHost> {
    const host: LeagueHost = {
      id: this.hosts.nextId(),
      name: input.name,
      organization: input.organization,
      leagueIds: [],
      createdAt: new Date().toISOString(),
    };
    await this.hosts.save(host);
    return host;
  }

  async getLeagueHost(id: LeagueHostId): Promise<LeagueHost | undefined> {
    return this.hosts.findById(id);
  }

  async createSeason(input: CreateSeasonInput): Promise<Season> {
    const season: Season = {
      id: this.seasons.nextId(),
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: new Date().toISOString(),
    };
    await this.seasons.save(season);
    return season;
  }

  async getSeason(id: SeasonId): Promise<Season | undefined> {
    return this.seasons.findById(id);
  }

  async createLeague(input: CreateLeagueInput): Promise<League> {
    const host = await this.hosts.findById(input.hostId);
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
    await this.leagues.save(league);
    host.leagueIds.push(league.id);
    await this.hosts.save(host);
    return league;
  }

  async getLeague(id: LeagueId): Promise<League | undefined> {
    return this.leagues.findById(id);
  }

  async activateLeague(id: LeagueId): Promise<League> {
    const league = await this.leagues.findById(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Draft) {
      throw new Error(`Cannot activate league in status "${league.status}": expected "draft"`);
    }
    league.status = LeagueStatus.Active;
    await this.leagues.save(league);
    return league;
  }

  async closeLeague(id: LeagueId): Promise<League> {
    const league = await this.leagues.findById(id);
    if (!league) throw new Error(`League not found: ${id}`);
    if (league.status !== LeagueStatus.Active) {
      throw new Error(`Cannot close league in status "${league.status}": expected "active"`);
    }
    league.status = LeagueStatus.Closed;
    await this.leagues.save(league);
    return league;
  }

  async createParticipant(input: CreateParticipantInput): Promise<Participant> {
    const participant: Participant = {
      id: this.participants.nextId(),
      handle: input.handle,
      discipline: input.discipline,
      leagueMemberships: [],
      createdAt: new Date().toISOString(),
    };
    await this.participants.save(participant);
    return participant;
  }

  async getParticipant(id: ParticipantId): Promise<Participant | undefined> {
    return this.participants.findById(id);
  }

  async enrollParticipant(leagueId: LeagueId, participantId: ParticipantId): Promise<EnrollmentResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) {
      return {
        success: false,
        participantId,
        leagueId,
        status: EnrollmentStatus.Withdrawn,
        reason: "league not found",
      };
    }

    const participant = await this.participants.findById(participantId);
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
    await this.participants.save(participant);

    return {
      success: true,
      participantId,
      leagueId,
      status: EnrollmentStatus.Enrolled,
    };
  }

  async listParticipants(leagueId: LeagueId): Promise<Participant[]> {
    const league = await this.leagues.findById(leagueId);
    if (!league) return [];

    return (await this.participants.findAll()).filter((p) =>
      p.leagueMemberships.some(
        (m) => m.leagueId === leagueId && m.status === EnrollmentStatus.Enrolled
      )
    );
  }
}
