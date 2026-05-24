import Link from "next/link";
import { LifecycleButtons } from "./_components/lifecycle-buttons";

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
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">Challenge not found.</p>
          <Link href={`/host/${leagueId}`} className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to League
          </Link>
        </div>
      </main>
    );
  }

  const submissions = await getSubmissions(challengeId);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "open": return "bg-[var(--success)] text-[var(--primary-foreground)]";
      case "judging": return "bg-[var(--secondary)] text-[var(--foreground)]";
      case "complete": return "bg-[var(--border)] text-[var(--foreground)]";
      default: return "bg-[var(--secondary)] text-[var(--foreground)]";
    }
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/host/${leagueId}`}
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Back to League
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            {challenge.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide ${getStatusStyles(challenge.status)}`}>
              {challenge.status}
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              Deadline: {new Date(challenge.deadline).toLocaleDateString()}
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              Submissions: <span className="text-[var(--foreground)] font-medium">{submissions.length}</span>
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

        {/* Lifecycle */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Lifecycle</h2>
          <div className="p-6 bg-[var(--secondary)]">
            <LifecycleButtons challengeId={challengeId} status={challenge.status} />
          </div>
        </section>

        {/* Submissions */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Submissions ({submissions.length})
          </h2>
          
          {submissions.length === 0 ? (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">No submissions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Participant</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Submitted</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Artifact</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border-soft)]">
                      <td className="py-4 px-4 font-mono text-sm text-[var(--muted-foreground)]">
                        {s.id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-[var(--muted-foreground)]">
                        {s.participantId.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-4 text-[var(--foreground)]">{s.status}</td>
                      <td className="py-4 px-4 text-[var(--foreground)]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        {s.artifact?.url ? (
                          <a 
                            href={s.artifact.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[var(--accent)] hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
