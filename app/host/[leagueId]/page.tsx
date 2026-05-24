import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
  leagueId: string;
}

interface League {
  id: string;
  name: string;
  status: string;
  challengeIds: string[];
}

async function getLeague(leagueId: string): Promise<League | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues/${leagueId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: League };
  return data.data ?? null;
}

async function getChallenges(challengeIds: string[]): Promise<Challenge[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const results = await Promise.allSettled(
    challengeIds.map((id) =>
      fetch(`${baseUrl}/api/v1/challenges/${id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { ok: boolean; data?: Challenge } | null) => d?.data ?? null)
    )
  );
  return results
    .filter((r): r is PromiseFulfilledResult<Challenge | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value as Challenge);
}

type Props = { params: Promise<{ leagueId: string }> };

export default async function HostLeaguePage({ params }: Props) {
  const { leagueId } = await params;
  const league = await getLeague(leagueId);

  if (!league) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">League not found.</p>
          <Link href="/host" className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const challenges = await getChallenges(league.challengeIds ?? []);

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
          href="/host" 
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Host Dashboard
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            {league.name}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <span className={`
              inline-flex px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide
              ${league.status === "active" 
                ? "bg-[var(--success)] text-[var(--primary-foreground)]" 
                : "bg-[var(--border)] text-[var(--foreground)]"
              }
            `}>
              {league.status}
            </span>
          </div>
        </header>

        {/* Challenges Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Challenges</h2>
            <Link
              href={`/host/${leagueId}/challenges/new`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
            >
              + New Challenge
            </Link>
          </div>

          {challenges.length === 0 ? (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">
                No challenges yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Deadline</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--border-soft)]">
                      <td className="py-4 px-4">
                        <Link
                          href={`/host/${leagueId}/challenges/${c.id}`}
                          className="font-medium text-[var(--accent)] hover:underline"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wide ${getStatusStyles(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[var(--foreground)]">
                        {new Date(c.deadline).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          href={`/host/${leagueId}/challenges/${c.id}`}
                          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          Manage →
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
