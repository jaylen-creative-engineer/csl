import Link from "next/link";
import { LifecycleButtons } from "./_components/lifecycle-buttons.js";

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

type Props = { params: Promise<{ leagueId: string; challengeId: string }> };

export default async function ChallengeSprintPage({ params }: Props) {
  const { leagueId, challengeId } = await params;
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>Challenge not found.</p>
        <Link href={`/host/${leagueId}`} style={{ color: "#2563eb" }}>Back to League</Link>
      </main>
    );
  }

  const submissions = await getSubmissions(challengeId);

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/host/${leagueId}`} style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to League
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{challenge.title}</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Status: <strong>{challenge.status}</strong> &nbsp;&bull;&nbsp;
            Deadline: {new Date(challenge.deadline).toLocaleDateString()} &nbsp;&bull;&nbsp;
            Submissions: <strong>{submissions.length}</strong>
          </p>
        </div>
      </div>

      <section style={{ marginBottom: "2rem", padding: "1rem", background: "#f9fafb", borderRadius: "0.75rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Challenge Brief</h2>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#374151", margin: 0 }}>{challenge.prompt}</p>
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

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Lifecycle</h2>
        <LifecycleButtons challengeId={challengeId} status={challenge.status} />
      </section>

      <section>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No submissions yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Participant</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Artifact</th>
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
                    {s.artifact?.url ? (
                      <a href={s.artifact.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>
                        View
                      </a>
                    ) : "—"}
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
