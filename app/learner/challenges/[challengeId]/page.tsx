import Link from "next/link";
import { SubmitForm } from "./_components/submit-form";

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

  const isOpen = challenge.status === "open";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/learner/${challenge.leagueId}`} 
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Back to League
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
              {challenge.title}
            </h1>
            <Link
              href={`/learner/challenges/${challengeId}/leaderboard`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--secondary)] rounded-full hover:bg-[var(--border-soft)] transition-colors"
            >
              View Leaderboard
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className={`
              inline-flex px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide
              ${challenge.status === "open" 
                ? "bg-[var(--success)] text-[var(--primary-foreground)]" 
                : "bg-[var(--border)] text-[var(--foreground)]"
              }
            `}>
              {challenge.status}
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              Deadline: {new Date(challenge.deadline).toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* Challenge Brief */}
        <section className="p-8 bg-[var(--secondary)] mb-8">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-4">
            Challenge Brief
          </h2>
          <p className="text-[var(--foreground)] leading-relaxed">
            {challenge.prompt}
          </p>
        </section>

        {/* Scoring Criteria */}
        {challenge.scoringCriteria && challenge.scoringCriteria.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
              Scoring Criteria
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Criterion</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Weight</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {challenge.scoringCriteria.map((c, i) => (
                    <tr key={i} className="border-b border-[var(--border-soft)]">
                      <td className="py-4 px-4 text-[var(--foreground)]">{c.name}</td>
                      <td className="py-4 px-4 text-[var(--foreground)]">{c.weight}</td>
                      <td className="py-4 px-4 text-[var(--muted-foreground)]">{c.description ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Submission Section */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Submit Your Entry
          </h2>
          {isOpen ? (
            <div className="p-8 bg-[var(--secondary)]">
              <SubmitForm challengeId={challengeId} />
            </div>
          ) : (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">
                This challenge is not currently accepting submissions.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
