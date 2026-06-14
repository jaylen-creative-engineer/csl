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

function statusTone(status: string): string {
  if (status === "open") return "blue";
  if (status === "complete") return "red";
  return "yellow";
}

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
  const openChallenges = challenges.filter((challenge) => challenge.status === "open").length;
  const judgingChallenges = challenges.filter((challenge) => challenge.status === "judging").length;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="csl-page">
        <div className="csl-shell csl-shell--with-side">
          <aside className="csl-rail" aria-label="League context">
            <Link href="/host" className="csl-arrow">← Host</Link>
            <span className="csl-rail__eyebrow">League // {league.id}</span>
            <div className="csl-rail__title">{league.name}</div>
            <p className="csl-rail__copy">Challenge control, lifecycle tracking, and deadline pressure in one board.</p>
            <nav className="csl-rail__nav" aria-label="League metrics">
              <span>Status <strong>{league.status}</strong></span>
              <span>Open <strong>{openChallenges}</strong></span>
              <span>Judging <strong>{judgingChallenges}</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header className="flex flex-wrap items-start justify-between gap-4 mb-12">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                  {league.name}
                </h1>
                <div className="flex items-center gap-3 mt-4">
                  <span className={`csl-pill csl-pill--${league.status}`}>{league.status}</span>
                </div>
              </div>
              <Link href={`/host/${leagueId}/challenges/new`} className="csl-action">
                New challenge
              </Link>
            </header>

            <div className="csl-kpi-strip" aria-label="League metrics">
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Challenges</div>
                <div className="csl-kpi__value">{challenges.length}</div>
                <div className="csl-kpi__note">total briefs</div>
              </div>
              <div className="csl-kpi csl-kpi--blue">
                <div className="csl-kpi__label">Open</div>
                <div className="csl-kpi__value">{openChallenges}</div>
                <div className="csl-kpi__note">accepting work</div>
              </div>
              <div className="csl-kpi csl-kpi--red">
                <div className="csl-kpi__label">Judging</div>
                <div className="csl-kpi__value">{judgingChallenges}</div>
                <div className="csl-kpi__note">needs scores</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Season</div>
                <div className="csl-kpi__value">{league.status === "active" ? "ON" : "STBY"}</div>
                <div className="csl-kpi__note">league state</div>
              </div>
            </div>

            <section>
              <div className="csl-section-row">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Challenge board</h2>
                <span className="csl-mini">FIG. 04 // SPRINT GRID</span>
              </div>

              {challenges.length === 0 ? (
                <div className="csl-panel csl-panel--hero">
                  <div className="csl-panel__title">No briefs loaded.</div>
                  <p className="csl-panel__copy">Create the first challenge to start this league’s competitive track.</p>
                </div>
              ) : (
                <div className="csl-card-grid">
                  {challenges.map((c) => {
                    const tone = statusTone(c.status);
                    return (
                      <Link key={c.id} href={`/host/${leagueId}/challenges/${c.id}`} className="csl-card">
                        <span className={`csl-card__block csl-card__block--${tone}`} aria-hidden="true" />
                        <div className="csl-card__top">
                          <div>
                            <h2 className="csl-card__title">{c.title}</h2>
                            <p className="csl-card__meta">{c.id}</p>
                          </div>
                          <span className={`csl-pill csl-pill--${c.status}`}>{c.status}</span>
                        </div>
                        <div className="csl-card__stats">
                          <div className="csl-card__stat">
                            <strong>{new Date(c.deadline).toLocaleDateString()}</strong>
                            <span>deadline</span>
                          </div>
                          <div className="csl-card__stat">
                            <strong>{c.status === "open" ? "LIVE" : c.status.toUpperCase().slice(0, 4)}</strong>
                            <span>state</span>
                          </div>
                        </div>
                        <div className="csl-card__footer">
                          <span className="csl-mini">{c.leagueId}</span>
                          <span className="csl-arrow">Manage →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="csl-side" aria-label="League operations">
            <div>
              <div className="csl-side__title">Ops rail</div>
              <p className="csl-rail__copy">Use status color to see where each brief sits in the sprint.</p>
            </div>
            <div className="csl-side__item">
              <strong>Blue</strong>
              <span>Open and accepting submissions.</span>
            </div>
            <div className="csl-side__item">
              <strong>Yellow</strong>
              <span>Draft or judging state needs attention.</span>
            </div>
            <div className="csl-side__item">
              <strong>Red</strong>
              <span>Completed and ready for retrospective.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
