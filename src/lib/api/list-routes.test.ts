import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthMock = vi.fn();

const leagueMocks = {
  listHosts: vi.fn(),
  listLeagues: vi.fn(),
  listSeasons: vi.fn(),
};

vi.mock("@/lib/api/require-auth.js", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/api/route-services.js", () => ({
  getRouteServices: () => ({
    league: leagueMocks,
  }),
}));

const hostsRoute = await import("../../../app/api/v1/hosts/route.js");
const leaguesRoute = await import("../../../app/api/v1/leagues/route.js");
const seasonsRoute = await import("../../../app/api/v1/seasons/route.js");

type LeagueListMethod = keyof typeof leagueMocks;
type ListRouteModule = {
  GET: () => Promise<Response>;
};

const listRoutes: Array<{
  label: string;
  route: ListRouteModule;
  serviceMethod: LeagueListMethod;
  rows: Array<Record<string, unknown>>;
}> = [
  {
    label: "GET /api/v1/hosts",
    route: hostsRoute,
    serviceMethod: "listHosts",
    rows: [
      {
        id: "host:1",
        name: "Jordan",
        organization: "Design Chicago",
        leagueIds: ["league:1"],
        createdAt: "2026-04-01T00:00:00.000Z",
      },
    ],
  },
  {
    label: "GET /api/v1/leagues",
    route: leaguesRoute,
    serviceMethod: "listLeagues",
    rows: [
      {
        id: "league:1",
        name: "Pixel League",
        hostId: "host:1",
        seasonId: null,
        status: "draft",
        challengeIds: ["challenge:1"],
        createdAt: "2026-04-02T00:00:00.000Z",
      },
    ],
  },
  {
    label: "GET /api/v1/seasons",
    route: seasonsRoute,
    serviceMethod: "listSeasons",
    rows: [
      {
        id: "season:1",
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-05-31",
        createdAt: "2026-04-03T00:00:00.000Z",
      },
    ],
  },
];

beforeEach(() => {
  requireAuthMock.mockReset();
  for (const fn of Object.values(leagueMocks)) fn.mockReset();
});

describe.each(listRoutes)("$label", ({ route, serviceMethod, rows }) => {
  it("returns the league service list without requiring auth", async () => {
    leagueMocks[serviceMethod].mockResolvedValue(rows);

    const res = await route.GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, data: rows });
    expect(leagueMocks[serviceMethod]).toHaveBeenCalledOnce();
    for (const [method, fn] of Object.entries(leagueMocks)) {
      if (method !== serviceMethod) expect(fn).not.toHaveBeenCalled();
    }
    expect(requireAuthMock).not.toHaveBeenCalled();
  });

  it("maps service failures to a 500 JSON error without requiring auth", async () => {
    leagueMocks[serviceMethod].mockRejectedValue(new Error("database unavailable"));

    const res = await route.GET();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "database unavailable",
    });
    expect(leagueMocks[serviceMethod]).toHaveBeenCalledOnce();
    expect(requireAuthMock).not.toHaveBeenCalled();
  });
});
