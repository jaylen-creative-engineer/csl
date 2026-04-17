import { describe, it, expect, beforeEach } from "vitest";
import { LeagueModelService } from "./league-model.service.js";
import { Discipline, LeagueStatus } from "./types.js";

describe("LeagueModelService", () => {
  let service: LeagueModelService;

  beforeEach(() => {
    service = new LeagueModelService();
  });

  describe("createLeague", () => {
    it("creates a league and retrieves it by id", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League Season 1", hostId: host.id });

      expect(league.name).toBe("Pixel League Season 1");
      expect(league.hostId).toBe(host.id);
      expect(league.status).toBe(LeagueStatus.Draft);

      const found = await service.getLeague(league.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(league.id);
    });

    it("throws when host does not exist", async () => {
      await expect(
        service.createLeague({ name: "Ghost League", hostId: "host:nonexistent" })
      ).rejects.toThrow("LeagueHost not found");
    });

    it("attaches the new league to the host's leagueIds", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });

      const updatedHost = await service.getLeagueHost(host.id);
      expect(updatedHost?.leagueIds).toContain(league.id);
    });

    it("assigns a null seasonId when no season is provided", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });
      expect(league.seasonId).toBeNull();
    });

    it("accepts an optional seasonId", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const season = await service.createSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-05-31",
      });
      const league = await service.createLeague({
        name: "Pixel League",
        hostId: host.id,
        seasonId: season.id,
      });
      expect(league.seasonId).toBe(season.id);
    });
  });

  describe("activateLeague", () => {
    it("transitions a draft league to active", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });

      const activated = await service.activateLeague(league.id);

      expect(activated.status).toBe(LeagueStatus.Active);
      expect((await service.getLeague(league.id))?.status).toBe(LeagueStatus.Active);
    });

    it("throws when league does not exist", async () => {
      await expect(service.activateLeague("league:nonexistent")).rejects.toThrow("League not found");
    });

    it("throws when league is not in draft status", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });
      await service.activateLeague(league.id);

      await expect(service.activateLeague(league.id)).rejects.toThrow(
        'Cannot activate league in status "active"'
      );
    });
  });

  describe("closeLeague", () => {
    it("transitions an active league to closed", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });
      await service.activateLeague(league.id);

      const closed = await service.closeLeague(league.id);

      expect(closed.status).toBe(LeagueStatus.Closed);
      expect((await service.getLeague(league.id))?.status).toBe(LeagueStatus.Closed);
    });

    it("throws when league does not exist", async () => {
      await expect(service.closeLeague("league:nonexistent")).rejects.toThrow("League not found");
    });

    it("throws when league is not in active status", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });

      await expect(service.closeLeague(league.id)).rejects.toThrow(
        'Cannot close league in status "draft"'
      );
    });
  });

  describe("enrollParticipant", () => {
    it("enrolls a participant in a league successfully", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });
      const participant = await service.createParticipant({ handle: "alex", discipline: Discipline.Design });

      const result = await service.enrollParticipant(league.id, participant.id);

      expect(result.success).toBe(true);
      expect(result.leagueId).toBe(league.id);
      expect(result.participantId).toBe(participant.id);
    });

    it("prevents duplicate enrollment", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });
      const participant = await service.createParticipant({ handle: "alex", discipline: Discipline.Design });

      await service.enrollParticipant(league.id, participant.id);
      const second = await service.enrollParticipant(league.id, participant.id);

      expect(second.success).toBe(false);
      expect(second.reason).toBe("already enrolled");
    });

    it("fails gracefully when league does not exist", async () => {
      const participant = await service.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const result = await service.enrollParticipant("league:nonexistent", participant.id);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("league not found");
    });

    it("fails gracefully when participant does not exist", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });

      const result = await service.enrollParticipant(league.id, "participant:nonexistent");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("participant not found");
    });
  });

  describe("listParticipants", () => {
    it("returns all enrolled participants for a league", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = await service.createLeague({ name: "Pixel League", hostId: host.id });
      const alex = await service.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const sam = await service.createParticipant({ handle: "sam", discipline: Discipline.Writing });

      await service.enrollParticipant(league.id, alex.id);
      await service.enrollParticipant(league.id, sam.id);

      const participants = await service.listParticipants(league.id);
      expect(participants).toHaveLength(2);
      expect(participants.map((p) => p.handle)).toContain("alex");
      expect(participants.map((p) => p.handle)).toContain("sam");
    });

    it("returns an empty list for an unknown league", async () => {
      const result = await service.listParticipants("league:nonexistent");
      expect(result).toEqual([]);
    });

    it("does not include participants from other leagues", async () => {
      const host = await service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league1 = await service.createLeague({ name: "Pixel League", hostId: host.id });
      const league2 = await service.createLeague({ name: "Word League", hostId: host.id });
      const alex = await service.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const sam = await service.createParticipant({ handle: "sam", discipline: Discipline.Writing });

      await service.enrollParticipant(league1.id, alex.id);
      await service.enrollParticipant(league2.id, sam.id);

      const participants = await service.listParticipants(league1.id);
      expect(participants).toHaveLength(1);
      expect(participants[0]?.handle).toBe("alex");
    });
  });

  describe("createSeason", () => {
    it("creates and retrieves a season", async () => {
      const season = await service.createSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-05-31",
      });
      const found = await service.getSeason(season.id);
      expect(found?.name).toBe("Spring 2026");
    });
  });
});
