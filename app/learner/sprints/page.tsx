import Link from "next/link";
import {
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "../../_components/app-shell/app-utils.js";

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

      {sprints.length === 0 ? (
        <div className="app-empty">
          <p>
            <strong>No sprints available right now.</strong> Check back soon or enter via intake to get started.
          </p>
          <Link href="/enter" className="app-btn" style={{ marginTop: 20 }}>
            Enter the league →
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
