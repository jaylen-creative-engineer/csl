import { sprintColor } from "../../_components/app-shell/app-utils.js";
import { DataTable, type DataTableRow } from "../../_components/dashboard/data-table";
import { EmptyState } from "../../_components/dashboard/empty-state";

interface League {
  id: string;
  name: string;
  status: string;
  challengeIds: string[];
}

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
  leagueId: string;
}

async function getLeagues(): Promise<League[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = (await res.json()) as { ok?: boolean; data?: League[] } | League[];
  if (Array.isArray(data)) return data;
  return (data as { data?: League[] }).data ?? [];
}

async function getChallenge(id: string): Promise<Challenge | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${id}`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json()) as { data?: Challenge };
  return data.data ?? null;
}

type SprintRow = Challenge & { leagueName: string };

export default async function LearnerSprintsPage() {
  const leagues = await getLeagues();
  const challengeIds = leagues.flatMap((l) => l.challengeIds ?? []);
  const challenges = (
    await Promise.all(challengeIds.map((id) => getChallenge(id)))
  ).filter((c): c is Challenge => c !== null);

  const leagueById = new Map(leagues.map((l) => [l.id, l.name]));
  const sprints: SprintRow[] = challenges.map((c) => ({
    ...c,
    leagueName: leagueById.get(c.leagueId) ?? "League",
  }));

  const openSprints = sprints.filter((s) => s.status === "open");
  const judgingSprints = sprints.filter((s) => s.status === "judging");
  const closedSprints = sprints.filter(
    (s) => s.status !== "open" && s.status !== "judging",
  );

  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker pulse">Season 01 · Sprints</p>
          <h1 className="app-title">
            Your <em>sprints.</em>
          </h1>
          <p className="app-muted" style={{ marginTop: 14 }}>
            {openSprints.length} open · {sprints.length} tracked
          </p>
        </div>
        <span className="app-fig">
          FIG.02 — Sprint field
          <br />
          {openSprints.length} live
        </span>
      </div>

      <div className="app-stat-grid">
        <div className="app-stat">
          <span className="app-stat-idx">01</span>
          <span className="app-stat-value">{openSprints.length}</span>
          <span className="app-stat-label">Open for entry</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">02</span>
          <span className="app-stat-value">{judgingSprints.length}</span>
          <span className="app-stat-label">In judging</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">03</span>
          <span className="app-stat-value">{closedSprints.length}</span>
          <span className="app-stat-label">Completed</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">04</span>
          <span className="app-stat-value">{leagues.length}</span>
          <span className="app-stat-label">Leagues in season</span>
        </div>
      </div>

      {sprints.length === 0 ? (
        <EmptyState
          fig="FIG.02 — Sprint field"
          title="No sprints on the board"
          body="Sprints appear here the moment a host opens a challenge. Enter via intake to join the season and get matched to your first brief."
          ctaHref="/enter"
          ctaLabel="Enter the league →"
        />
      ) : (
        <DataTable
          columns={[
            { key: "title", label: "Sprint", kind: "primary", subKey: "leagueName", dotColorKey: "dot" },
            { key: "leagueName", label: "League" },
            { key: "status", label: "Status", kind: "status", width: "130px" },
            { key: "deadline", label: "Closes", kind: "deadline", numeric: true, width: "110px" },
          ]}
          rows={sprints.map(
            (s, i): DataTableRow => ({
              id: s.id,
              href: `/learner/challenges/${s.id}`,
              title: s.title,
              leagueName: s.leagueName,
              status: s.status,
              deadline: s.deadline,
              dot: sprintColor(i),
            }),
          )}
          searchKeys={["title", "leagueName"]}
          searchPlaceholder="Search sprints or leagues"
          filterKey="status"
          countLabel="sprints"
          initialSort={{ key: "deadline", dir: "asc" }}
        />
      )}
    </>
  );
}
