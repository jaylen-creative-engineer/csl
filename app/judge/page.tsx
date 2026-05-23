import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
  leagueId: string;
}

// GET /api/v1/challenges does not exist yet — using diff endpoint as fallback.
// See missing routes section in build report.
async function getJudgingChallenges(): Promise<Challenge[]> {
  // NOTE: There is no GET /api/v1/challenges (list all). This is a missing route.
  // Returning an empty list as a safe fallback until the route is added.
  return [];
}

export default async function JudgeDashboardPage() {
  const challenges = await getJudgingChallenges();

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Judge Dashboard
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Challenges currently open for judging. Score submissions below.
      </p>

      {challenges.length === 0 ? (
        <div style={{ padding: "2rem", background: "#fef9c3", borderRadius: "0.75rem", color: "#92400e" }}>
          <p style={{ margin: 0, fontWeight: 500 }}>No challenges in judging state right now.</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
            If you have a challenge ID, navigate directly to{" "}
            <code style={{ background: "#fef3c7", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>
              /judge/[challengeId]
            </code>
            .
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#a16207" }}>
            Note: A <code>GET /api/v1/challenges</code> listing endpoint is needed to populate this page automatically.
          </p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={thStyle}>Challenge</th>
              <th style={thStyle}>League</th>
              <th style={thStyle}>Deadline</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={tdStyle}>
                  <Link href={`/judge/${c.id}`} style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                    {c.title}
                  </Link>
                </td>
                <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem" }}>{c.leagueId.slice(0, 8)}…</td>
                <td style={tdStyle}>{new Date(c.deadline).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <Link href={`/judge/${c.id}`} style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
                    Score →
                  </Link>
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
