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
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">Challenge not found.</p>
          <Link href="/learner" className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to Discovery
          </Link>
        </div>
      </main>
    );
  }

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/learner/challenges/${challengeId}`}
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Back to Challenge
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            Leaderboard
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            {challenge.title}
          </p>
        </header>

        {leaderboard.length === 0 ? (
          <div className="p-8 bg-[var(--secondary)] text-center">
            <p className="font-medium text-[var(--foreground)]">No scores yet.</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Rankings will appear once submissions have been scored.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Participant</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Submission</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr
                    key={entry.submissionId ?? i}
                    className={`border-b border-[var(--border-soft)] ${entry.rank === 1 ? "bg-[var(--secondary)]" : ""}`}
                  >
                    <td className={`py-4 px-4 ${entry.rank <= 3 ? "font-bold" : ""}`}>
                      {getRankDisplay(entry.rank)}
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-[var(--muted-foreground)]">
                      {entry.participantId?.slice(0, 16)}...
                    </td>
                    <td className="py-4 px-4 font-semibold text-[var(--foreground)]">
                      {typeof entry.score === "number" ? entry.score.toFixed(1) : "—"}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[var(--muted-foreground)]">
                      {entry.submissionId?.slice(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
