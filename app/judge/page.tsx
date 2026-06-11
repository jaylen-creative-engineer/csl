import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
  leagueId: string;
}

async function getJudgingChallenges(): Promise<Challenge[]> {
  // NOTE: There is no GET /api/v1/challenges (list all). This is a missing route.
  return [];
}

export default async function JudgeDashboardPage() {
  const challenges = await getJudgingChallenges();

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            Judge Dashboard
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Challenges currently open for judging. Score submissions below.
          </p>
        </header>

        {challenges.length === 0 ? (
          <div className="p-8 bg-[var(--secondary)]">
            <p className="font-medium text-[var(--foreground)]">
              No challenges in judging state right now.
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              If you have a challenge ID, navigate directly to{" "}
              <code className="px-2 py-0.5 bg-[var(--background)] text-[var(--foreground)] font-mono text-xs">
                /judge/[challengeId]
              </code>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Challenge</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">League</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Deadline</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border-soft)]">
                    <td className="py-4 px-4">
                      <Link 
                        href={`/judge/${c.id}`} 
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[var(--muted-foreground)]">
                      {c.leagueId.slice(0, 8)}...
                    </td>
                    <td className="py-4 px-4 text-[var(--foreground)]">
                      {new Date(c.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <Link 
                        href={`/judge/${c.id}`} 
                        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        Score →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
