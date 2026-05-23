import Link from "next/link";
import { SubmitForm } from "./_components/submit-form.js";

interface ScoringCriterion {
  name: string;
  weight: number;
  description?: string;
}

interface Challenge {
  id: string;
  title: string;
  prompt: string;
  status: string;
  deadline: string;
  leagueId: string;
  scoringCriteria?: ScoringCriterion[];
}

async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Challenge };
  return data.data ?? null;
}

type Props = { params: Promise<{ challengeId: string }> };

export default async function LearnerChallengePage({ params }: Props) {
  const { challengeId } = await params;
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>Challenge not found.</p>
        <Link href="/learner" style={{ color: "#2563eb" }}>Back to Discovery</Link>
      </main>
    );
  }

  const isOpen = challenge.status === "open";

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/learner/${challenge.leagueId}`} style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to League
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{challenge.title}</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            href={`/learner/challenges/${challengeId}/leaderboard`}
            style={{ fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" }}
          >
            View Leaderboard
          </Link>
        </div>
      </div>

      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "2rem" }}>
        Status: <strong>{challenge.status}</strong> &nbsp;&bull;&nbsp;
        Deadline: {new Date(challenge.deadline).toLocaleDateString()}
      </p>

      <section style={{ marginBottom: "2rem", padding: "1.25rem", background: "#f9fafb", borderRadius: "0.75rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Challenge Brief</h2>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#374151", margin: 0 }}>{challenge.prompt}</p>
      </section>

      {challenge.scoringCriteria && challenge.scoringCriteria.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Scoring Criteria</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={thStyle}>Criterion</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {challenge.scoringCriteria.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>{c.name}</td>
                  <td style={tdStyle}>{c.weight}</td>
                  <td style={tdStyle}>{c.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Submit Your Entry</h2>
        {isOpen ? (
          <SubmitForm challengeId={challengeId} />
        ) : (
          <div style={{ padding: "1rem", background: "#f3f4f6", borderRadius: "0.75rem", color: "#6b7280" }}>
            This challenge is not currently accepting submissions. Status: <strong>{challenge.status}</strong>
          </div>
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
