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

function statusTone(status: string): string {
  if (status === "active") return "blue";
  if (status === "closed") return "red";
  return "yellow";
}

export default async function HostDashboardPage() {
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
          <aside className="csl-rail" aria-label="Host controls">
            <span className="csl-rail__eyebrow">Host // League Ops</span>
            <div className="csl-rail__title">Run the circuit.</div>
            <p className="csl-rail__copy">
              Manage seasons, spin up briefs, and move every challenge through the sprint lifecycle.
            </p>
            <nav className="csl-rail__nav" aria-label="Host sections">
              <span>Leagues <strong>{leagues.length}</strong></span>
              <span>Active <strong>{activeLeagues}</strong></span>
              <span>Sprints <strong>{challengeCount}</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                Host Dashboard
              </h1>
              <p className="mt-3 text-[var(--muted-foreground)]">
                A command view for cohorts, briefs, and live competition state.
              </p>
            </header>

            <div className="csl-kpi-strip" aria-label="Host metrics">
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Leagues</div>
                <div className="csl-kpi__value">{leagues.length}</div>
                <div className="csl-kpi__note">registered</div>
              </div>
              <div className="csl-kpi csl-kpi--blue">
                <div className="csl-kpi__label">Active</div>
                <div className="csl-kpi__value">{activeLeagues}</div>
                <div className="csl-kpi__note">live cohorts</div>
              </div>
              <div className="csl-kpi csl-kpi--red">
                <div className="csl-kpi__label">Sprints</div>
                <div className="csl-kpi__value">{challengeCount}</div>
                <div className="csl-kpi__note">challenge briefs</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Review</div>
                <div className="csl-kpi__value">—</div>
                <div className="csl-kpi__note">awaiting queue</div>
              </div>
            </div>

            <section>
              <div className="csl-section-row">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                  League control room
                </h2>
                <span className="csl-mini">FIG. 02 // ACTIVE FIELD</span>
              </div>

              {leagues.length === 0 ? (
                <div className="csl-panel csl-panel--hero">
                  <div className="csl-panel__title">No leagues on the board.</div>
                  <p className="csl-panel__copy">Create the first league to unlock challenge scheduling and sprint operations.</p>
                </div>
              ) : (
                <div className="csl-card-grid">
                  {leagues.map((league) => {
                    const tone = statusTone(league.status);
                    return (
                <Link
                  key={league.id}
                  href={`/host/${league.id}`}
                        className="csl-card"
                >
                        <span className={`csl-card__block csl-card__block--${tone}`} aria-hidden="true" />
                        <div className="csl-card__top">
                          <div>
                            <h3 className="csl-card__title">{league.name}</h3>
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
                            <strong>{league.status === "active" ? "ON" : "STBY"}</strong>
                            <span>signal</span>
                          </div>
                        </div>
                        <div className="csl-card__footer">
                          <span className="csl-mini">Created {new Date(league.createdAt).toLocaleDateString()}</span>
                          <span className="csl-arrow">Open →</span>
                        </div>
                </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="csl-side" aria-label="Create league">
            <div>
              <div className="csl-side__title">Quick create</div>
              <p className="csl-rail__copy">Launch a new league without leaving the dashboard.</p>
            </div>
            <CreateLeagueForm />
            <div className="csl-side__item">
              <strong>Lifecycle tip</strong>
              <span>Draft the league first, then attach challenge briefs before activation.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
