import Link from "next/link";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "../_components/app-shell/app-utils";

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
  prompt?: string;
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

export default async function LearnerDiscoveryPage() {
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
  const featured = openSprints[0] ?? sprints[0];
  const activeCount = sprints.filter((s) => s.status === "open" || s.status === "judging").length;

  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker">Season 01 · Week 03</p>
          <h1 className="app-title">
            Welcome back, <em>maker.</em>
          </h1>
        </div>
        <span className="app-fig">
          FIG.01 — The Field
          <br />
          {activeCount} sprints active
        </span>
      </div>

      <div className="app-stat-grid">
        <div className="app-stat">
          <span className="app-stat-idx">01</span>
          <span className="app-stat-value">{leagues.length}</span>
          <span className="app-stat-label">Leagues in season</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">02</span>
          <span className="app-stat-value">{openSprints.length}</span>
          <span className="app-stat-label">Open sprints</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">03</span>
          <span className="app-stat-value">{sprints.length}</span>
          <span className="app-stat-label">Total challenges</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-idx">04</span>
          <span className="app-stat-value">{activeCount}</span>
          <span className="app-stat-label">In play</span>
        </div>
      </div>

      {featured && (
        <>
          <p className="app-section-label">Featured sprint</p>
          <div className="app-panel featured" style={{ marginBottom: 36 }}>
            <span className="app-panel-fig" style={{ top: 16, right: 18, fontSize: 10 }}>
              FIG.02 — Sprint
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span className="app-tag purple">Motion</span>
              <span className="app-tag open">Open</span>
            </div>
            <h2 style={{ margin: 0, maxWidth: "24ch", fontWeight: 600, fontSize: 30, lineHeight: 1.06, letterSpacing: "-0.015em" }}>
              {featured.title}
            </h2>
            {featured.prompt && (
              <p className="app-muted" style={{ margin: "16px 0 0", maxWidth: "62ch", fontSize: 14, lineHeight: 1.7 }}>
                {featured.prompt.slice(0, 180)}
                {featured.prompt.length > 180 ? "…" : ""}
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 28, marginTop: 24, paddingTop: 22, borderTop: "1px solid rgba(242,241,237,0.1)" }}>
              <div>
                <span className="app-section-label" style={{ marginBottom: 5, fontSize: 10 }}>Closes in</span>
                <span style={{ fontSize: 22, color: "var(--app-accent)" }}>{formatDeadlineLong(featured.deadline)}</span>
              </div>
              <div>
                <span className="app-section-label" style={{ marginBottom: 5, fontSize: 10 }}>League</span>
                <span style={{ fontSize: 22 }}>{featured.leagueName}</span>
              </div>
              <Link href={`/learner/challenges/${featured.id}`} className="app-btn" style={{ marginLeft: "auto" }}>
                Open submission →
              </Link>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <p className="app-section-label" style={{ margin: 0 }}>Your sprints</p>
        <span style={{ fontSize: 12, color: "rgba(242,241,237,0.4)" }}>{sprints.length} tracked</span>
      </div>

      {sprints.length === 0 ? (
        <div className="app-empty">
          <p>
            <strong>No leagues available right now.</strong> Check back soon or contact a league host to get started.
          </p>
          <Link href="/enter" className="app-btn" style={{ marginTop: 20 }}>
            Set up your season →
          </Link>
        </div>
      ) : (
        <div className="app-list">
          {sprints.map((s, i) => (
            <Link key={s.id} href={`/learner/challenges/${s.id}`} className="app-list-row">
              <span className="app-list-dot" style={{ background: sprintColor(i) }} />
              <span className="app-list-body">
                <span className="app-list-title">{s.title}</span>
                <span className="app-list-sub">{s.leagueName}</span>
              </span>
              <span className={statusTagClass(s.status)}>{s.status}</span>
              <span className="app-list-deadline">{formatDeadlineShort(s.deadline)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
