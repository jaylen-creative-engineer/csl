import Link from "next/link";
import { CreateLeagueForm } from "./_components/create-league-form";
import { statusTagClass } from "../_components/app-shell/app-utils";

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
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: League[]; leagues?: League[] };
  return data.data ?? (data as unknown as League[]) ?? [];
}

export default async function HostDashboardPage() {
  const leagues = await getLeagues();

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

      <p className="app-section-label">Your leagues</p>
      {leagues.length === 0 ? (
        <div className="app-empty" style={{ marginBottom: 36 }}>
          <p>No leagues yet. Create one below.</p>
        </div>
      ) : (
        <div className="app-list" style={{ marginBottom: 36 }}>
          {leagues.map((league) => (
            <Link key={league.id} href={`/host/${league.id}`} className="app-list-row">
              <span className="app-list-dot" style={{ background: "#8f7bff" }} />
              <span className="app-list-body">
                <span className="app-list-title">{league.name}</span>
                <span className="app-list-sub">{league.challengeIds?.length ?? 0} challenges</span>
              </span>
              <span className={statusTagClass(league.status)}>{league.status}</span>
            </Link>
          ))}
        </div>
      )}

      <p className="app-section-label">Create a league</p>
      <div className="app-panel">
        <CreateLeagueForm />
      </div>
    </>
  );
}
