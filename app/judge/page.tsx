import { sprintColor } from "../_components/app-shell/app-utils";
import { DataTable, type DataTableRow } from "../_components/dashboard/data-table";
import { EmptyState } from "../_components/dashboard/empty-state";

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

export default async function JudgeDashboardPage() {
  const leagues = await getLeagues();
  const challengeIds = leagues.flatMap((l) => l.challengeIds ?? []);
  const challenges = (
    await Promise.all(challengeIds.map((id) => getChallenge(id)))
  ).filter((c): c is Challenge => c !== null);

  const leagueById = new Map(leagues.map((l) => [l.id, l.name]));
  const queue = challenges.filter((c) => c.status === "judging");
  const upNext = challenges.filter((c) => c.status === "open");

  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker pulse">Scoring queue</p>
          <h1 className="app-title">Judge <em>dashboard.</em></h1>
          <p className="app-muted" style={{ marginTop: 14, maxWidth: "42ch" }}>
            Challenges currently open for judging. Score submissions against real criteria.
          </p>
        </div>
        <span className="app-fig">
          FIG.J1 — Judge
          <br />
          {queue.length} in queue
        </span>
      </div>

      <div className="app-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="app-stat">
          <span className="app-stat-idx">01</span>
          <span className="app-stat-value">{queue.length}</span>
          <span className="app-stat-label">Awaiting scores</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">02</span>
          <span className="app-stat-value">{upNext.length}</span>
          <span className="app-stat-label">Open — closing soon</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">03</span>
          <span className="app-stat-value">{leagues.length}</span>
          <span className="app-stat-label">Leagues covered</span>
        </div>
      </div>

      <p className="app-section-label accent">In judging now</p>
      {queue.length === 0 ? (
        <div style={{ marginBottom: 36 }}>
          <EmptyState
            fig="FIG.J1 — Judge"
            title="The queue is clear"
            body="No challenges are in the judging state right now. When a host closes a sprint for entries, its submissions land here for scoring."
          />
        </div>
      ) : (
        <div style={{ marginBottom: 36 }}>
          <DataTable
            columns={[
              { key: "title", label: "Challenge", kind: "primary", subKey: "leagueName", dotColorKey: "dot" },
              { key: "leagueName", label: "League" },
              { key: "deadline", label: "Closed", kind: "date", numeric: true, width: "120px" },
            ]}
            rows={queue.map(
              (c, i): DataTableRow => ({
                id: c.id,
                href: `/judge/${c.id}`,
                title: c.title,
                leagueName: leagueById.get(c.leagueId) ?? "League",
                deadline: c.deadline,
                dot: sprintColor(i),
              }),
            )}
            searchKeys={["title", "leagueName"]}
            searchPlaceholder="Search the queue"
            countLabel="challenges"
          />
        </div>
      )}

      {upNext.length > 0 && (
        <>
          <p className="app-section-label">Up next — still open for entries</p>
          <div style={{ marginBottom: 36 }}>
            <DataTable
              columns={[
                { key: "title", label: "Challenge", kind: "primary", subKey: "leagueName", dotColorKey: "dot" },
                { key: "status", label: "Status", kind: "status", width: "130px" },
                { key: "deadline", label: "Closes", kind: "deadline", numeric: true, width: "110px" },
              ]}
              rows={upNext.map(
                (c, i): DataTableRow => ({
                  id: c.id,
                  title: c.title,
                  leagueName: leagueById.get(c.leagueId) ?? "League",
                  status: c.status,
                  deadline: c.deadline,
                  dot: sprintColor(i + queue.length),
                }),
              )}
              countLabel="challenges"
              initialSort={{ key: "deadline", dir: "asc" }}
            />
          </div>
        </>
      )}

      <p className="app-section-label">Direct access</p>
      <div className="app-panel">
        <p className="app-label">Have a challenge ID? Jump straight to its scoring view.</p>
        <form
          method="GET"
          action="/judge/redirect"
          style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}
        >
          <input
            name="challengeId"
            required
            placeholder="Challenge UUID"
            className="app-input"
            style={{ flex: 1, minWidth: 220 }}
          />
          <button type="submit" className="app-btn">Open queue →</button>
        </form>
      </div>
    </>
  );
}
