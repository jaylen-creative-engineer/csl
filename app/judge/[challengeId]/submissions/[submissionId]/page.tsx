import Link from "next/link";
import { ScoreForm } from "./_components/score-form.js";

interface ScoringCriterion {
  name: string;
  weight: number;
  description?: string;
}

interface Challenge {
  id: string;
  title: string;
  status: string;
  scoringCriteria?: ScoringCriterion[];
}

interface Submission {
  id: string;
  participantId: string;
  status: string;
  createdAt: string;
  artifact?: { url: string; mimeType?: string; description?: string };
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

type Props = { params: Promise<{ challengeId: string; submissionId: string }> };

export default async function JudgeSubmissionPage({ params }: Props) {
  const { challengeId, submissionId } = await params;

  const [challenge, submissions] = await Promise.all([
    getChallenge(challengeId),
    getSubmissions(challengeId),
  ]);

  const submission = submissions.find((s) => s.id === submissionId) ?? null;

  if (!challenge || !submission) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>Submission or challenge not found.</p>
        <Link href={`/judge/${challengeId}`} style={{ color: "#2563eb" }}>Back to Challenge</Link>
      </main>
    );
  }

  const criteria = challenge.scoringCriteria ?? [];

  return (
    <main style={{ padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/judge/${challengeId}`} style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to {challenge.title}
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Score Submission
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "2rem" }}>
        Submission: <code style={{ background: "#f3f4f6", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>{submissionId.slice(0, 16)}…</code>
        &nbsp;&bull;&nbsp; Participant: <code style={{ background: "#f3f4f6", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>{submission.participantId.slice(0, 16)}…</code>
        &nbsp;&bull;&nbsp; Status: {submission.status}
      </p>

      {submission.artifact?.url && (
        <section style={{ marginBottom: "2rem", padding: "1rem", background: "#f0f9ff", borderRadius: "0.75rem", border: "1px solid #bae6fd" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Artifact</h2>
          {submission.artifact.description && (
            <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "0.5rem" }}>
              {submission.artifact.description}
            </p>
          )}
          <a
            href={submission.artifact.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "0.4rem 0.9rem",
              background: "#0ea5e9",
              color: "#fff",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            View Artifact →
          </a>
          {submission.artifact.mimeType && (
            <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", color: "#9ca3af" }}>
              {submission.artifact.mimeType}
            </span>
          )}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Scoring Form</h2>
        <ScoreForm submissionId={submissionId} challengeId={challengeId} criteria={criteria} />
      </section>
    </main>
  );
}
