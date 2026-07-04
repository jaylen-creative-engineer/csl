import { CreateLeagueForm } from "./_components/create-league-form";
import { DataTable, type DataTableRow } from "../_components/dashboard/data-table";
import { EmptyState } from "../_components/dashboard/empty-state";

interface League {
  id: string;
  name: string;
  hostId: string;
  status: string;
  challengeIds: string[];
  createdAt: string;
}

async function getLeagues(): Promise<League[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: League[]; leagues?: League[] };
  return data.data ?? (data as unknown as League[]) ?? [];
}

export default async function HostDashboardPage() {
  const leagues = await getLeagues();
  const active = leagues.filter((l) => l.status === "active");
  const totalChallenges = leagues.reduce((n, l) => n + (l.challengeIds?.length ?? 0), 0);

  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker">League operations</p>
          <h1 className="app-title">Host <em>dashboard.</em></h1>
          <p className="app-muted" style={{ marginTop: 14, maxWidth: "42ch" }}>
            Manage leagues, create challenges, and advance the sprint lifecycle.
          </p>
        </div>
        <span className="app-fig">FIG.H1 — Host<br />{leagues.length} leagues</span>
      </div>

      <div className="app-stat-grid">
        <div className="app-stat">
          <span className="app-stat-idx">01</span>
          <span className="app-stat-value">{leagues.length}</span>
          <span className="app-stat-label">Leagues total</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">02</span>
          <span className="app-stat-value">{active.length}</span>
          <span className="app-stat-label">Active now</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">03</span>
          <span className="app-stat-value">{totalChallenges}</span>
          <span className="app-stat-label">Challenges launched</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">04</span>
          <span className="app-stat-value">
            {leagues.length - active.length}
          </span>
          <span className="app-stat-label">Draft / closed</span>
        </div>
      </div>

      <p className="app-section-label">Your leagues</p>
      {leagues.length === 0 ? (
        <div style={{ marginBottom: 36 }}>
          <EmptyState
            fig="FIG.H1 — Host"
            title="No leagues yet"
            body="Spin up your first league below — name it, attach it to the season, then open challenges for makers to enter."
          />
        </div>
      ) : (
        <div style={{ marginBottom: 36 }}>
          <DataTable
            columns={[
              { key: "name", label: "League", kind: "primary", subKey: "challengeLabel", dotColorKey: "dot" },
              { key: "status", label: "Status", kind: "status", width: "130px" },
              { key: "challengeCount", label: "Challenges", kind: "mono", numeric: true, width: "120px" },
              { key: "createdAt", label: "Created", kind: "date", numeric: true, width: "120px" },
            ]}
            rows={leagues.map(
              (l): DataTableRow => ({
                id: l.id,
                href: `/host/${l.id}`,
                name: l.name,
                status: l.status,
                challengeCount: l.challengeIds?.length ?? 0,
                challengeLabel: `${l.challengeIds?.length ?? 0} challenge${(l.challengeIds?.length ?? 0) === 1 ? "" : "s"}`,
                createdAt: l.createdAt,
                dot: "#2f6bff",
              }),
            )}
            searchKeys={["name"]}
            searchPlaceholder="Search leagues"
            filterKey="status"
            countLabel="leagues"
            initialSort={{ key: "createdAt", dir: "desc" }}
          />
        </div>
      )}

      <p className="app-section-label">Create a league</p>
      <div className="app-panel">
        <CreateLeagueForm />
      </div>
    </>
  );
}
