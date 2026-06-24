import Link from "next/link";
import { ScoreForm } from "./_components/score-form";

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
      <>
        <p className="app-error">Submission or challenge not found.</p>
        <Link href={`/judge/${challengeId}`} className="app-back">← Challenge</Link>
      </>
    );
  }

  const criteria = challenge.scoringCriteria ?? [];

  return (
    <>
      <Link href={`/judge/${challengeId}`} className="app-back">← {challenge.title}</Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">Score submission</p>
          <h1 className="app-title">Scoring <em>form.</em></h1>
          <p className="app-muted" style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {submissionId.slice(0, 16)}… · participant {submission.participantId.slice(0, 16)}…
          </p>
        </div>
      </div>

      {submission.artifact?.url && (
        <div className="app-panel" style={{ marginBottom: 32 }}>
          <p className="app-section-label">Artifact</p>
          {submission.artifact.description && (
            <p className="app-muted" style={{ marginBottom: 16 }}>{submission.artifact.description}</p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href={submission.artifact.url} target="_blank" rel="noopener noreferrer" className="app-btn sm">
              View artifact
            </a>
            {submission.artifact.mimeType && (
              <span className="app-chip">{submission.artifact.mimeType}</span>
            )}
          </div>
        </div>
      )}

      <div className="app-panel">
        <ScoreForm submissionId={submissionId} challengeId={challengeId} criteria={criteria} />
      </div>
    </>
  );
}
