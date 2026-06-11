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
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">Submission or challenge not found.</p>
          <Link href={`/judge/${challengeId}`} className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to Challenge
          </Link>
        </div>
      </main>
    );
  }

  const criteria = challenge.scoringCriteria ?? [];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/judge/${challengeId}`}
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Back to {challenge.title}
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            Score Submission
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[var(--muted-foreground)]">
            <span>
              Submission: <code className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--foreground)] font-mono text-xs">{submissionId.slice(0, 16)}...</code>
            </span>
            <span>
              Participant: <code className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--foreground)] font-mono text-xs">{submission.participantId.slice(0, 16)}...</code>
            </span>
          </div>
        </header>

        {/* Artifact */}
        {submission.artifact?.url && (
          <section className="p-6 bg-[var(--secondary)] mb-8">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-4">
              Artifact
            </h2>
            {submission.artifact.description && (
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {submission.artifact.description}
              </p>
            )}
            <div className="flex items-center gap-4">
              <a
                href={submission.artifact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
              >
                View Artifact
              </a>
              {submission.artifact.mimeType && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  {submission.artifact.mimeType}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Scoring Form */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Scoring Form</h2>
          <div className="p-8 bg-[var(--secondary)]">
            <ScoreForm submissionId={submissionId} challengeId={challengeId} criteria={criteria} />
          </div>
        </section>
      </div>
    </main>
  );
}
