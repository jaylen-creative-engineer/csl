import { beforeEach, describe, expect, it, vi } from "vitest";
import { SponsorOutcomeStatus } from "../../sponsor-intelligence/types.js";

const mocks = vi.hoisted(() => ({
  challenge: {
    getLeaderboard: vi.fn(),
  },
  showcase: {
    getShowcaseFeed: vi.fn(),
  },
  sponsor: {
    recordOutcome: vi.fn(),
  },
  getRouteServices: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api/route-services.js", () => ({
  getRouteServices: mocks.getRouteServices,
}));

vi.mock("@/lib/api/require-auth.js", () => ({
  requireAuth: mocks.requireAuth,
}));

function jsonRequest(method: string, body: unknown): Request {
  return new Request("https://csl.test/api", {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  mocks.challenge.getLeaderboard.mockReset();
  mocks.showcase.getShowcaseFeed.mockReset();
  mocks.sponsor.recordOutcome.mockReset();
  mocks.getRouteServices.mockReset();
  mocks.requireAuth.mockReset();

  mocks.getRouteServices.mockReturnValue({
    challenge: mocks.challenge,
    showcase: mocks.showcase,
    sponsor: mocks.sponsor,
  });
  mocks.requireAuth.mockResolvedValue({
    ok: true,
    user: { id: "user:1" },
    supabase: {},
  });
});

describe("route handlers", () => {
  describe("GET /api/v1/leagues/:leagueId/showcase/feed", () => {
    it("clamps oversized limits and prefers the after cursor", async () => {
      const feed = { entries: [{ submissionId: "submission:1" }], nextCursor: "submission:2" };
      mocks.showcase.getShowcaseFeed.mockResolvedValue(feed);
      const { GET } = await import(
        "../../../app/api/v1/leagues/[leagueId]/showcase/feed/route.js"
      );

      const response = await GET(
        new Request(
          "https://csl.test/api/v1/leagues/league:1/showcase/feed?limit=250&after=submission:after&cursor=submission:cursor"
        ),
        { params: Promise.resolve({ leagueId: "league:1" }) }
      );

      expect(mocks.showcase.getShowcaseFeed).toHaveBeenCalledWith("league:1", {
        limit: 100,
        cursor: "submission:after",
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true, data: feed });
    });

    it("falls back to the default limit for non-numeric input", async () => {
      mocks.showcase.getShowcaseFeed.mockResolvedValue({ entries: [], nextCursor: undefined });
      const { GET } = await import(
        "../../../app/api/v1/leagues/[leagueId]/showcase/feed/route.js"
      );

      const response = await GET(
        new Request("https://csl.test/api/v1/leagues/league:1/showcase/feed?limit=not-a-number"),
        { params: Promise.resolve({ leagueId: "league:1" }) }
      );

      expect(mocks.showcase.getShowcaseFeed).toHaveBeenCalledWith("league:1", {
        limit: 20,
        cursor: undefined,
      });
      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/v1/challenges/:challengeId/leaderboard", () => {
    it("returns the requested leaderboard page with pagination metadata", async () => {
      const rows = [
        { participantId: "participant:1", score: 100 },
        { participantId: "participant:2", score: 90 },
        { participantId: "participant:3", score: 80 },
        { participantId: "participant:4", score: 70 },
        { participantId: "participant:5", score: 60 },
      ];
      mocks.challenge.getLeaderboard.mockResolvedValue(rows);
      const { GET } = await import(
        "../../../app/api/v1/challenges/[challengeId]/leaderboard/route.js"
      );

      const response = await GET(
        new Request("https://csl.test/api/v1/challenges/challenge:1/leaderboard?page=2&limit=2"),
        { params: Promise.resolve({ challengeId: "challenge:1" }) }
      );

      expect(mocks.challenge.getLeaderboard).toHaveBeenCalledWith("challenge:1");
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ok: true,
        data: rows.slice(2, 4),
        meta: { total: 5, page: 2, limit: 2 },
      });
    });

    it("clamps page and limit to their lower bounds", async () => {
      const rows = [
        { participantId: "participant:1", score: 100 },
        { participantId: "participant:2", score: 90 },
      ];
      mocks.challenge.getLeaderboard.mockResolvedValue(rows);
      const { GET } = await import(
        "../../../app/api/v1/challenges/[challengeId]/leaderboard/route.js"
      );

      const response = await GET(
        new Request("https://csl.test/api/v1/challenges/challenge:1/leaderboard?page=0&limit=0"),
        { params: Promise.resolve({ challengeId: "challenge:1" }) }
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ok: true,
        data: rows.slice(0, 1),
        meta: { total: 2, page: 1, limit: 1 },
      });
    });
  });

  describe("PATCH /api/v1/sponsor-attachments/:attachmentId/outcome", () => {
    it("short-circuits before validation or service calls when auth fails", async () => {
      mocks.requireAuth.mockResolvedValue({
        ok: false,
        response: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
      });
      const { PATCH } = await import(
        "../../../app/api/v1/sponsor-attachments/[attachmentId]/outcome/route.js"
      );

      const response = await PATCH(
        jsonRequest("PATCH", { status: SponsorOutcomeStatus.Delivered }),
        { params: Promise.resolve({ attachmentId: "attachment:1" }) }
      );

      expect(response.status).toBe(401);
      expect(mocks.getRouteServices).not.toHaveBeenCalled();
      expect(mocks.sponsor.recordOutcome).not.toHaveBeenCalled();
    });

    it("rejects invalid outcome statuses without recording an outcome", async () => {
      const { PATCH } = await import(
        "../../../app/api/v1/sponsor-attachments/[attachmentId]/outcome/route.js"
      );

      const response = await PATCH(jsonRequest("PATCH", { status: "shipped" }), {
        params: Promise.resolve({ attachmentId: "attachment:1" }),
      });

      expect(response.status).toBe(422);
      expect(mocks.sponsor.recordOutcome).not.toHaveBeenCalled();
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(typeof body.error).toBe("string");
    });

    it("records a validated sponsor outcome for authenticated callers", async () => {
      const updated = {
        id: "attachment:1",
        outcome: { status: SponsorOutcomeStatus.Delivered, notes: "Prize delivered" },
      };
      mocks.sponsor.recordOutcome.mockResolvedValue(updated);
      const { PATCH } = await import(
        "../../../app/api/v1/sponsor-attachments/[attachmentId]/outcome/route.js"
      );

      const response = await PATCH(
        jsonRequest("PATCH", {
          status: SponsorOutcomeStatus.Delivered,
          notes: "Prize delivered",
        }),
        { params: Promise.resolve({ attachmentId: "attachment:1" }) }
      );

      expect(mocks.sponsor.recordOutcome).toHaveBeenCalledWith("attachment:1", {
        status: SponsorOutcomeStatus.Delivered,
        notes: "Prize delivered",
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true, data: updated });
    });
  });
});
