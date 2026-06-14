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
      <div className="csl-page">
        <div className="csl-shell csl-shell--with-side">
          <aside className="csl-rail" aria-label="Judge context">
            <span className="csl-rail__eyebrow">Judge // Scoring Bay</span>
            <div className="csl-rail__title">Every rep gets scored.</div>
            <p className="csl-rail__copy">
              Use direct challenge links for now while the challenge listing endpoint comes online.
            </p>
            <nav className="csl-rail__nav" aria-label="Judge filters">
              <span>Open scoring <strong>{challenges.length}</strong></span>
              <span>Session scored <strong>0</strong></span>
              <span>Queue source <strong>API</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                Judge Dashboard
              </h1>
              <p className="mt-3 text-[var(--muted-foreground)]">
                Challenges currently open for judging. Score submissions below.
              </p>
            </header>

            <div className="csl-kpi-strip" aria-label="Judge metrics">
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Open scoring</div>
                <div className="csl-kpi__value">{challenges.length}</div>
                <div className="csl-kpi__note">listed challenges</div>
              </div>
              <div className="csl-kpi csl-kpi--blue">
                <div className="csl-kpi__label">Scored</div>
                <div className="csl-kpi__value">0</div>
                <div className="csl-kpi__note">this session</div>
              </div>
              <div className="csl-kpi csl-kpi--red">
                <div className="csl-kpi__label">Pending</div>
                <div className="csl-kpi__value">—</div>
                <div className="csl-kpi__note">awaiting list endpoint</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Mode</div>
                <div className="csl-kpi__value">ID</div>
                <div className="csl-kpi__note">deep-link entry</div>
              </div>
            </div>

            {challenges.length === 0 ? (
              <section className="csl-panel csl-panel--hero">
                <div className="csl-panel__title">Queue awaiting signal.</div>
                <p className="csl-panel__copy">
                  The judge index is ready for a challenge-list feed. Until then, open a known challenge directly at{" "}
                  <code className="px-2 py-0.5 bg-[var(--background)] text-[var(--foreground)] font-mono text-xs">
                    /judge/[challengeId]
                  </code>
                  .
                </p>
                <div className="mt-6">
                  <Link href="/judge/challenge:2" className="csl-action">
                    Open seeded challenge
                  </Link>
                </div>
              </section>
            ) : (
              <section className="csl-card-grid">
                {challenges.map((c) => (
                  <Link key={c.id} href={`/judge/${c.id}`} className="csl-card">
                    <span className="csl-card__block csl-card__block--yellow" aria-hidden="true" />
                    <div className="csl-card__top">
                      <div>
                        <h2 className="csl-card__title">{c.title}</h2>
                        <p className="csl-card__meta">{c.leagueId}</p>
                      </div>
                      <span className={`csl-pill csl-pill--${c.status}`}>{c.status}</span>
                    </div>
                    <div className="csl-card__footer">
                      <span className="csl-mini">{new Date(c.deadline).toLocaleDateString()}</span>
                      <span className="csl-arrow">Score →</span>
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </div>

          <aside className="csl-side" aria-label="Judge activity">
            <div>
              <div className="csl-side__title">Score protocol</div>
              <p className="csl-rail__copy">Transparent criteria, rationale, and weighted totals.</p>
            </div>
            <div className="csl-side__item">
              <strong>Direct access</strong>
              <span>Use a challenge ID to enter the scoring bay.</span>
            </div>
            <div className="csl-side__item">
              <strong>Next data gap</strong>
              <span>Challenge list endpoint will turn this into a live review queue.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
