import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  participantId: string;
  score: number;
  submissionId: string;
}

interface Challenge {
  id: string;
  title: string;
  status: string;
}

async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Challenge };
  return data.data ?? null;
}

async function getLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}/leaderboard`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: LeaderboardEntry[] };
  return data.data ?? [];
}

type Props = { params: Promise<{ challengeId: string }> };

export default async function LeaderboardPage({ params }: Props) {
  const { challengeId } = await params;
  const [challenge, leaderboard] = await Promise.all([
    getChallenge(challengeId),
    getLeaderboard(challengeId),
  ]);

  if (!challenge) {
    return (
      <>
        <p className="app-error">Challenge not found.</p>
        <Link href="/learner" className="app-back">← Dashboard</Link>
      </>
    );
  }

  return (
    <>
      <Link href={`/learner/challenges/${challengeId}`} className="app-back">
        ← Sprint
      </Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">Signals · FIG.04</p>
          <h1 className="app-title">Leaderboard</h1>
          <p className="app-muted" style={{ marginTop: 14 }}>{challenge.title}</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="app-empty">
          <p><strong>No scores yet.</strong> Rankings appear once submissions are scored.</p>
        </div>
      ) : (
        <div className="app-panel-rail">
          {leaderboard.map((entry, i) => (
            <div key={entry.submissionId ?? i} className="app-lb-row">
              <span className={`app-lb-rank${entry.rank <= 3 ? " top" : ""}`}>
                {String(entry.rank).padStart(2, "0")}
              </span>
              <span className={`app-lb-name${entry.rank === 1 ? " you" : ""}`}>
                {entry.participantId?.slice(0, 16)}…
              </span>
              <span className={`app-lb-score${entry.rank <= 3 ? " top" : ""}`}>
                {typeof entry.score === "number" ? entry.score.toFixed(1) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
