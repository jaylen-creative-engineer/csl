import Link from "next/link";
import { EnrollButton } from "./_components/enroll-button";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
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

export default async function LearnerLeagueDetailPage({ params }: Props) {
  const { leagueId } = await params;
  const league = await getLeague(leagueId);

  if (!league) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">League not found.</p>
          <Link href="/learner" className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to Discovery
          </Link>
        </div>
      </main>
    );
  }

  const challenges = await getChallenges(league.challengeIds ?? []);
  const openChallenges = challenges.filter((c) => c.status === "open");
  const otherChallenges = challenges.filter((c) => c.status !== "open");

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/learner" 
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Discovery
        </Link>

        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
              {league.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
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
          </div>
          <EnrollButton leagueId={leagueId} />
        </header>

        {/* Open Challenges */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Open Challenges ({openChallenges.length})
          </h2>

          {openChallenges.length === 0 ? (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">
                No open challenges right now. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {openChallenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/learner/challenges/${c.id}`}
                  className="block p-6 bg-[var(--secondary)] hover:bg-[var(--border-soft)] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:underline">
                        {c.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Deadline: {new Date(c.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex px-3 py-1 text-xs font-medium bg-[var(--success)] text-[var(--primary-foreground)] rounded-full uppercase tracking-wide">
                      {c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Other Challenges */}
        {otherChallenges.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[var(--muted-foreground)] mb-4">
              Other Challenges
            </h2>
            <div className="grid gap-2">
              {otherChallenges.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-[var(--secondary)] text-[var(--muted-foreground)]"
                >
                  <span className="font-medium">{c.title}</span>
                  <span className="ml-2 text-sm">— {c.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
