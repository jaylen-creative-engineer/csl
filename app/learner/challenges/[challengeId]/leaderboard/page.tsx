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
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>Challenge not found.</p>
        <Link href="/learner" style={{ color: "#2563eb" }}>Back to Discovery</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href={`/learner/challenges/${challengeId}`}
          style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}
        >
          ← Back to Challenge
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Leaderboard
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.875rem" }}>
        {challenge.title} &nbsp;&bull;&nbsp; Status: {challenge.status}
      </p>

      {leaderboard.length === 0 ? (
        <div style={{ padding: "2rem", background: "#f9fafb", borderRadius: "0.75rem", color: "#6b7280", textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 500 }}>No scores yet.</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
            Rankings will appear once submissions have been scored.
          </p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Participant</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Submission</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr
                key={entry.submissionId ?? i}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  background: entry.rank === 1 ? "#fffbeb" : "transparent",
                }}
              >
                <td style={{ ...tdStyle, fontWeight: entry.rank <= 3 ? 700 : 400 }}>
                  {entry.rank === 1 ? "1st" : entry.rank === 2 ? "2nd" : entry.rank === 3 ? "3rd" : `${entry.rank}th`}
                </td>
                <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.85rem" }}>
                  {entry.participantId?.slice(0, 16)}…
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>
                  {typeof entry.score === "number" ? entry.score.toFixed(1) : "—"}
                </td>
                <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem", color: "#9ca3af" }}>
                  {entry.submissionId?.slice(0, 12)}…
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "#374151",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.9rem",
  color: "#111",
};
