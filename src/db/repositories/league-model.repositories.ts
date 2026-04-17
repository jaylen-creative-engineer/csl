import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import {
  leagueHosts,
  seasons,
  leagues,
  participants,
  leagueMemberships,
} from "../schema.js";
import type {
  ILeagueHostRepository,
  ILeagueRepository,
  IParticipantRepository,
  ISeasonRepository,
} from "../../persistence/repository.types.js";
import type {
  League,
  LeagueHost,
  LeagueHostId,
  LeagueId,
  Participant,
  ParticipantId,
  Season,
  SeasonId,
} from "../../league-model/types.js";
import { EnrollmentStatus } from "../../league-model/types.js";

export class DrizzleLeagueHostRepository implements ILeagueHostRepository {
  constructor(private readonly db: Db) {}

  nextId(): LeagueHostId {
    return `host:${crypto.randomUUID()}`;
  }

  async save(entity: LeagueHost): Promise<void> {
    await this.db
      .insert(leagueHosts)
      .values({ id: entity.id, name: entity.name, organization: entity.organization, createdAt: entity.createdAt })
      .onConflictDoUpdate({
        target: leagueHosts.id,
        set: { name: entity.name, organization: entity.organization },
      });
  }

  async findById(id: LeagueHostId): Promise<LeagueHost | undefined> {
    const row = await this.db.query.leagueHosts.findFirst({ where: eq(leagueHosts.id, id) });
    if (!row) return undefined;
    const leagueRows = await this.db.select({ id: leagues.id }).from(leagues).where(eq(leagues.hostId, id));
    return { ...row, leagueIds: leagueRows.map((r) => r.id) };
  }

  async findAll(): Promise<LeagueHost[]> {
    const rows = await this.db.query.leagueHosts.findMany();
    return Promise.all(rows.map(async (row) => {
      const leagueRows = await this.db.select({ id: leagues.id }).from(leagues).where(eq(leagues.hostId, row.id));
      return { ...row, leagueIds: leagueRows.map((r) => r.id) };
    }));
  }
}

export class DrizzleSeasonRepository implements ISeasonRepository {
  constructor(private readonly db: Db) {}

  nextId(): SeasonId {
    return `season:${crypto.randomUUID()}`;
  }

  async save(entity: Season): Promise<void> {
    await this.db
      .insert(seasons)
      .values({ id: entity.id, name: entity.name, startDate: entity.startDate, endDate: entity.endDate, createdAt: entity.createdAt })
      .onConflictDoUpdate({
        target: seasons.id,
        set: { name: entity.name, startDate: entity.startDate, endDate: entity.endDate },
      });
  }

  async findById(id: SeasonId): Promise<Season | undefined> {
    return this.db.query.seasons.findFirst({ where: eq(seasons.id, id) });
  }

  async findAll(): Promise<Season[]> {
    return this.db.query.seasons.findMany();
  }
}

export class DrizzleLeagueRepository implements ILeagueRepository {
  constructor(private readonly db: Db) {}

  nextId(): LeagueId {
    return `league:${crypto.randomUUID()}`;
  }

  async save(entity: League): Promise<void> {
    await this.db
      .insert(leagues)
      .values({
        id: entity.id,
        name: entity.name,
        hostId: entity.hostId,
        seasonId: entity.seasonId ?? null,
        status: entity.status,
        createdAt: entity.createdAt,
      })
      .onConflictDoUpdate({
        target: leagues.id,
        set: { name: entity.name, status: entity.status, seasonId: entity.seasonId ?? null },
      });
  }

  async findById(id: LeagueId): Promise<League | undefined> {
    const row = await this.db.query.leagues.findFirst({ where: eq(leagues.id, id) });
    if (!row) return undefined;
    return { ...row, seasonId: row.seasonId ?? null, challengeIds: [] };
  }

  async findAll(): Promise<League[]> {
    const rows = await this.db.query.leagues.findMany();
    return rows.map((row) => ({ ...row, seasonId: row.seasonId ?? null, challengeIds: [] }));
  }
}

export class DrizzleParticipantRepository implements IParticipantRepository {
  constructor(private readonly db: Db) {}

  nextId(): ParticipantId {
    return `participant:${crypto.randomUUID()}`;
  }

  async save(entity: Participant): Promise<void> {
    await this.db
      .insert(participants)
      .values({ id: entity.id, handle: entity.handle, discipline: entity.discipline, createdAt: entity.createdAt })
      .onConflictDoUpdate({
        target: participants.id,
        set: { handle: entity.handle, discipline: entity.discipline },
      });

    // Sync league memberships
    for (const membership of entity.leagueMemberships) {
      await this.db
        .insert(leagueMemberships)
        .values({
          leagueId: membership.leagueId,
          participantId: entity.id,
          status: membership.status,
          enrolledAt: membership.enrolledAt,
        })
        .onConflictDoUpdate({
          target: [leagueMemberships.leagueId, leagueMemberships.participantId],
          set: { status: membership.status },
        });
    }
  }

  async findById(id: ParticipantId): Promise<Participant | undefined> {
    const row = await this.db.query.participants.findFirst({ where: eq(participants.id, id) });
    if (!row) return undefined;
    const memberships = await this.db
      .select()
      .from(leagueMemberships)
      .where(eq(leagueMemberships.participantId, id));
    return {
      ...row,
      discipline: row.discipline as any,
      leagueMemberships: memberships.map((m) => ({
        leagueId: m.leagueId,
        status: m.status as EnrollmentStatus,
        enrolledAt: m.enrolledAt,
      })),
    };
  }

  async findAll(): Promise<Participant[]> {
    const rows = await this.db.query.participants.findMany();
    return Promise.all(rows.map(async (row) => {
      const memberships = await this.db
        .select()
        .from(leagueMemberships)
        .where(eq(leagueMemberships.participantId, row.id));
      return {
        ...row,
        discipline: row.discipline as any,
        leagueMemberships: memberships.map((m) => ({
          leagueId: m.leagueId,
          status: m.status as EnrollmentStatus,
          enrolledAt: m.enrolledAt,
        })),
      };
    }));
  }
}
