import Link from "next/link";
import { CreateLeagueForm } from "./_components/create-league-form";

interface League {
  id: string;
  name: string;
  hostId: string;
  status: string;
  challengeIds: string[];
  createdAt: string;
}

async function getLeagues(): Promise<League[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: League[]; leagues?: League[] };
  return data.data ?? (data as unknown as League[]) ?? [];
}

export default async function HostDashboardPage() {
  const leagues = await getLeagues();

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            Host Dashboard
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Manage your leagues, create challenges, and advance the sprint lifecycle.
          </p>
        </header>

        {/* Your Leagues Section */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Your Leagues
          </h2>
          
          {leagues.length === 0 ? (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">No leagues yet. Create one below.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/host/${league.id}`}
                  className="block p-6 bg-[var(--secondary)] hover:bg-[var(--border-soft)] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:underline">
                        {league.name}
                      </h3>
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
        </section>

        {/* Create League Section */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Create a League
          </h2>
          <div className="p-8 bg-[var(--secondary)]">
            <CreateLeagueForm />
          </div>
        </section>
      </div>
    </main>
  );
}
