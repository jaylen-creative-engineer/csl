import Link from "next/link";
import { statusTagClass } from "../../_components/app-shell/app-utils";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
  leagueId: string;
}

interface League {
  id: string;
  name: string;
  status: string;
  challengeIds: string[];
}

async function getLeague(leagueId: string): Promise<League | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues/${leagueId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: League };
  return data.data ?? null;
}

async function getChallenges(challengeIds: string[]): Promise<Challenge[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const results = await Promise.allSettled(
    challengeIds.map((id) =>
      fetch(`${baseUrl}/api/v1/challenges/${id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { ok: boolean; data?: Challenge } | null) => d?.data ?? null)
    )
  );
  return results
    .filter((r): r is PromiseFulfilledResult<Challenge | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value as Challenge);
}

type Props = { params: Promise<{ leagueId: string }> };

export default async function HostLeaguePage({ params }: Props) {
  const { leagueId } = await params;
  const league = await getLeague(leagueId);

  if (!league) {
    return (
      <>
        <p className="app-error">League not found.</p>
        <Link href="/host" className="app-back">← Host dashboard</Link>
      </>
    );
  }

  const challenges = await getChallenges(league.challengeIds ?? []);

  return (
    <>
      <Link href="/host" className="app-back">← Host dashboard</Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">League admin</p>
          <h1 className="app-title">{league.name}</h1>
          <span className={statusTagClass(league.status)} style={{ marginTop: 12, display: "inline-flex" }}>
            {league.status}
          </span>
        </div>
        <Link href={`/host/${leagueId}/challenges/new`} className="app-btn sm">
          ＋ New challenge
        </Link>
      </div>

      <p className="app-section-label">Challenges ({challenges.length})</p>

      {challenges.length === 0 ? (
        <div className="app-empty">
          <p>No challenges yet. Create one to get started.</p>
        </div>
      ) : (
        <table className="app-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/host/${leagueId}/challenges/${c.id}`}>{c.title}</Link>
                </td>
                <td><span className={statusTagClass(c.status)}>{c.status}</span></td>
                <td>{new Date(c.deadline).toLocaleDateString()}</td>
                <td>
                  <Link href={`/host/${leagueId}/challenges/${c.id}`}>Manage →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
