import Link from "next/link";
import { EnrollButton } from "./_components/enroll-button";
import { formatDeadlineLong, statusTagClass } from "../../_components/app-shell/app-utils";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
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

export default async function LearnerLeagueDetailPage({ params }: Props) {
  const { leagueId } = await params;
  const league = await getLeague(leagueId);

  if (!league) {
    return (
      <>
        <p className="app-error">League not found.</p>
        <Link href="/learner" className="app-back">
          ← Dashboard
        </Link>
      </>
    );
  }

  const challenges = await getChallenges(league.challengeIds ?? []);
  const openChallenges = challenges.filter((c) => c.status === "open");
  const otherChallenges = challenges.filter((c) => c.status !== "open");

  return (
    <>
      <Link href="/learner" className="app-back">
        ← Dashboard
      </Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">{league.status} league</p>
          <h1 className="app-title">{league.name}</h1>
        </div>
        <EnrollButton leagueId={leagueId} />
      </div>

      <p className="app-section-label">Open challenges ({openChallenges.length})</p>

      {openChallenges.length === 0 ? (
        <div className="app-empty">
          <p>No open challenges right now. Check back soon.</p>
        </div>
      ) : (
        <div className="app-list" style={{ marginBottom: 36 }}>
          {openChallenges.map((c) => (
            <Link key={c.id} href={`/learner/challenges/${c.id}`} className="app-list-row">
              <span className="app-list-dot" />
              <span className="app-list-body">
                <span className="app-list-title">{c.title}</span>
                <span className="app-list-sub">Closes {formatDeadlineLong(c.deadline)}</span>
              </span>
              <span className={statusTagClass(c.status)}>{c.status}</span>
            </Link>
          ))}
        </div>
      )}

      {otherChallenges.length > 0 && (
        <>
          <p className="app-section-label">Other challenges</p>
          <div className="app-list">
            {otherChallenges.map((c) => (
              <div key={c.id} className="app-list-row" style={{ cursor: "default" }}>
                <span className="app-list-body">
                  <span className="app-list-title" style={{ color: "rgba(242,241,237,0.55)" }}>{c.title}</span>
                </span>
                <span className={statusTagClass(c.status)}>{c.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
