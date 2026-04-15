import { describe, it, expect, beforeEach } from "vitest";
import { LeagueModelService } from "./league-model.service.js";
import { Discipline, LeagueStatus } from "./types.js";

describe("LeagueModelService", () => {
  let service: LeagueModelService;

  beforeEach(() => {
    service = new LeagueModelService();
  });

  describe("createLeague", () => {
    it("creates a league and retrieves it by id", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League Season 1", hostId: host.id });

      expect(league.name).toBe("Pixel League Season 1");
      expect(league.hostId).toBe(host.id);
      expect(league.status).toBe(LeagueStatus.Draft);

      const found = service.getLeague(league.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(league.id);
    });

    it("throws when host does not exist", () => {
      expect(() =>
        service.createLeague({ name: "Ghost League", hostId: "host:nonexistent" })
      ).toThrow("LeagueHost not found");
    });

    it("attaches the new league to the host's leagueIds", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League", hostId: host.id });

      const updatedHost = service.getLeagueHost(host.id);
      expect(updatedHost?.leagueIds).toContain(league.id);
    });

    it("assigns a null seasonId when no season is provided", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League", hostId: host.id });
      expect(league.seasonId).toBeNull();
    });

    it("accepts an optional seasonId", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const season = service.createSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-05-31",
      });
      const league = service.createLeague({
        name: "Pixel League",
        hostId: host.id,
        seasonId: season.id,
      });
      expect(league.seasonId).toBe(season.id);
    });
  });

  describe("enrollParticipant", () => {
    it("enrolls a participant in a league successfully", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League", hostId: host.id });
      const participant = service.createParticipant({ handle: "alex", discipline: Discipline.Design });

      const result = service.enrollParticipant(league.id, participant.id);

      expect(result.success).toBe(true);
      expect(result.leagueId).toBe(league.id);
      expect(result.participantId).toBe(participant.id);
    });

    it("prevents duplicate enrollment", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League", hostId: host.id });
      const participant = service.createParticipant({ handle: "alex", discipline: Discipline.Design });

      service.enrollParticipant(league.id, participant.id);
      const second = service.enrollParticipant(league.id, participant.id);

      expect(second.success).toBe(false);
      expect(second.reason).toBe("already enrolled");
    });

    it("fails gracefully when league does not exist", () => {
      const participant = service.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const result = service.enrollParticipant("league:nonexistent", participant.id);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("league not found");
    });

    it("fails gracefully when participant does not exist", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League", hostId: host.id });

      const result = service.enrollParticipant(league.id, "participant:nonexistent");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("participant not found");
    });
  });

  describe("listParticipants", () => {
    it("returns all enrolled participants for a league", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league = service.createLeague({ name: "Pixel League", hostId: host.id });
      const alex = service.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const sam = service.createParticipant({ handle: "sam", discipline: Discipline.Writing });

      service.enrollParticipant(league.id, alex.id);
      service.enrollParticipant(league.id, sam.id);

      const participants = service.listParticipants(league.id);
      expect(participants).toHaveLength(2);
      expect(participants.map((p) => p.handle)).toContain("alex");
      expect(participants.map((p) => p.handle)).toContain("sam");
    });

    it("returns an empty list for an unknown league", () => {
      const result = service.listParticipants("league:nonexistent");
      expect(result).toEqual([]);
    });

    it("does not include participants from other leagues", () => {
      const host = service.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
      const league1 = service.createLeague({ name: "Pixel League", hostId: host.id });
      const league2 = service.createLeague({ name: "Word League", hostId: host.id });
      const alex = service.createParticipant({ handle: "alex", discipline: Discipline.Design });
      const sam = service.createParticipant({ handle: "sam", discipline: Discipline.Writing });

      service.enrollParticipant(league1.id, alex.id);
      service.enrollParticipant(league2.id, sam.id);

      const participants = service.listParticipants(league1.id);
      expect(participants).toHaveLength(1);
      expect(participants[0]?.handle).toBe("alex");
    });
  });

  describe("createSeason", () => {
    it("creates and retrieves a season", () => {
      const season = service.createSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-05-31",
      });
      const found = service.getSeason(season.id);
      expect(found?.name).toBe("Spring 2026");
    });
  });
});
