import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
}

interface Submission {
  id: string;
  participantId: string;
  status: string;
  createdAt: string;
  artifact?: { url: string };
}

async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Challenge };
  return data.data ?? null;
}

async function getSubmissions(challengeId: string): Promise<Submission[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}/submissions`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: Submission[] };
  return data.data ?? [];
}

type Props = { params: Promise<{ challengeId: string }> };

export default async function JudgeChallengeSubmissionsPage({ params }: Props) {
  const { challengeId } = await params;
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>Challenge not found.</p>
        <Link href="/judge" style={{ color: "#2563eb" }}>Back to Judge Dashboard</Link>
      </main>
    );
  }

  const submissions = await getSubmissions(challengeId);

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/judge" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Judge Dashboard
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {challenge.title}
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.875rem" }}>
        Status: <strong>{challenge.status}</strong> &nbsp;&bull;&nbsp;
        Deadline: {new Date(challenge.deadline).toLocaleDateString()}
      </p>

      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Submissions ({submissions.length})
        </h2>

        {submissions.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No submissions to judge yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={thStyle}>Submission ID</th>
                <th style={thStyle}>Participant</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem" }}>{s.id.slice(0, 8)}…</td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem" }}>{s.participantId.slice(0, 8)}…</td>
                  <td style={tdStyle}>{s.status}</td>
                  <td style={tdStyle}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <Link
                      href={`/judge/${challengeId}/submissions/${s.id}`}
                      style={{ color: "#2563eb", fontSize: "0.875rem", textDecoration: "none", fontWeight: 500 }}
                    >
                      Score →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
