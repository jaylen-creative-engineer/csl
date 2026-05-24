import Link from "next/link";

interface League {
  id: string;
  name: string;
  status: string;
  challengeIds: string[];
}

async function getLeagues(): Promise<League[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json() as { ok?: boolean; data?: League[] } | League[];
  if (Array.isArray(data)) return data;
  return (data as { data?: League[] }).data ?? [];
}

export default async function LearnerDiscoveryPage() {
  const leagues = await getLeagues();

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            Discover Leagues
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Browse active leagues and join a challenge sprint.
          </p>
        </header>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-12">
          <Link
            href="/learner/portfolio"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--foreground)] bg-[var(--secondary)] rounded-full hover:bg-[var(--border-soft)] transition-colors"
          >
            My Portfolio
          </Link>
        </div>

        {/* Leagues List */}
        {leagues.length === 0 ? (
          <div className="p-8 bg-[var(--secondary)]">
            <p className="font-medium text-[var(--foreground)]">No leagues available right now.</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Check back soon or contact a league host to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/learner/${league.id}`}
                className="block p-6 bg-[var(--secondary)] hover:bg-[var(--border-soft)] transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)] group-hover:underline">
                      {league.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {league.challengeIds?.length ?? 0} challenges
                    </p>
                  </div>
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
