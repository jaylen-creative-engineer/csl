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

function statusTone(status: string): string {
  if (status === "active") return "blue";
  if (status === "closed") return "red";
  return "yellow";
}

export default async function LearnerDiscoveryPage() {
  const leagues = await getLeagues();
  const activeLeagues = leagues.filter((league) => league.status === "active").length;
  const challengeCount = leagues.reduce(
    (total, league) => total + (league.challengeIds?.length ?? 0),
    0
  );

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="csl-page">
        <div className="csl-shell csl-shell--with-side">
          <aside className="csl-rail" aria-label="Learner context">
            <span className="csl-rail__eyebrow">Learner // Discovery</span>
            <div className="csl-rail__title">Pick your next rep.</div>
            <p className="csl-rail__copy">
              Find live creative sprints, enter with a brief, and turn scored submissions into a public record.
            </p>
            <nav className="csl-rail__nav" aria-label="Learner actions">
              <Link href="/learner/portfolio">Portfolio <span>↗</span></Link>
              <span>Leagues <strong>{leagues.length}</strong></span>
              <span>Open field <strong>{activeLeagues}</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                Discover Leagues
              </h1>
              <p className="mt-3 text-[var(--muted-foreground)]">
                Browse active leagues and join a challenge sprint.
              </p>
            </header>

            <div className="csl-kpi-strip" aria-label="Learner discovery metrics">
              <div className="csl-kpi csl-kpi--blue">
                <div className="csl-kpi__label">Active leagues</div>
                <div className="csl-kpi__value">{activeLeagues}</div>
                <div className="csl-kpi__note">ready to enter</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Sprints</div>
                <div className="csl-kpi__value">{challengeCount}</div>
                <div className="csl-kpi__note">briefs listed</div>
              </div>
              <div className="csl-kpi csl-kpi--red">
                <div className="csl-kpi__label">Portfolio</div>
                <div className="csl-kpi__value">∞</div>
                <div className="csl-kpi__note">compounds over time</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Next move</div>
                <div className="csl-kpi__value">01</div>
                <div className="csl-kpi__note">choose a league</div>
              </div>
            </div>

            <section>
              <div className="csl-section-row">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                  League field
                </h2>
                <span className="csl-mini">FIG. 03 // ENTRY BOARD</span>
              </div>

              {leagues.length === 0 ? (
                <div className="csl-panel csl-panel--hero">
                  <div className="csl-panel__title">No leagues are live.</div>
                  <p className="csl-panel__copy">
                    Check back soon or ask a host for the next sprint window.
                  </p>
                </div>
              ) : (
                <div className="csl-card-grid">
                  {leagues.map((league) => {
                    const tone = statusTone(league.status);
                    return (
                      <Link
                        key={league.id}
                        href={`/learner/${league.id}`}
                        className="csl-card"
                      >
                        <span className={`csl-card__block csl-card__block--${tone}`} aria-hidden="true" />
                        <div className="csl-card__top">
                          <div>
                            <h2 className="csl-card__title">{league.name}</h2>
                            <p className="csl-card__meta">{league.id}</p>
                          </div>
                          <span className={`csl-pill csl-pill--${league.status}`}>{league.status}</span>
                        </div>
                        <div className="csl-card__stats">
                          <div className="csl-card__stat">
                            <strong>{league.challengeIds?.length ?? 0}</strong>
                            <span>challenges</span>
                          </div>
                          <div className="csl-card__stat">
                            <strong>{league.status === "active" ? "PLAY" : "WAIT"}</strong>
                            <span>entry state</span>
                          </div>
                        </div>
                        <div className="csl-card__footer">
                          <span className="csl-mini">Public scored reps</span>
                          <span className="csl-arrow">Enter →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="csl-side" aria-label="Learner prompts">
            <div>
              <div className="csl-side__title">Field notes</div>
              <p className="csl-rail__copy">Use the dashboard as a scouting board. Every scored public submission can feed your portfolio.</p>
            </div>
            <div className="csl-side__item">
              <strong>Start with live leagues</strong>
              <span>Active leagues are marked blue and ready for enrollment.</span>
            </div>
            <div className="csl-side__item">
              <strong>Track your record</strong>
              <span>Open your portfolio after submitting to see scored signals compound.</span>
            </div>
            <Link href="/learner/portfolio" className="csl-action csl-action--ghost">
              View portfolio
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
