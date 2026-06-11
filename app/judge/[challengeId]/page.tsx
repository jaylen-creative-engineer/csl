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
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">Challenge not found.</p>
          <Link href="/judge" className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to Judge Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const submissions = await getSubmissions(challengeId);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/judge" 
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Judge Dashboard
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            {challenge.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className={`
              inline-flex px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide
              ${challenge.status === "judging" 
                ? "bg-[var(--secondary)] text-[var(--foreground)]" 
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

        {/* Submissions Section */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Submissions ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">No submissions to judge yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Submission ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Participant</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Submitted</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Actions</th>
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
                        <Link
                          href={`/judge/${challengeId}/submissions/${s.id}`}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
                        >
                          Score
                        </Link>
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
