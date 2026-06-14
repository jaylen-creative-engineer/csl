import Link from "next/link";

interface Submission {
  id: string;
  challengeId: string;
  participantId: string;
  submittedAt: string;
  scores?: { totalScore: number }[];
}

interface SponsorSummary {
  challenges: number;
  topSubmissions: Submission[];
}

interface Sponsor {
  id: string;
  name: string;
  organization: string;
  contactEmail: string;
}

async function getSponsor(sponsorId: string): Promise<Sponsor | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/sponsors/${sponsorId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Sponsor };
  return data.data ?? null;
}

async function getSponsorSummary(sponsorId: string): Promise<SponsorSummary | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/sponsors/${sponsorId}/summary`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: SponsorSummary };
  return data.data ?? null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

type Props = { params: Promise<{ sponsorId: string }> };

export default async function SponsorDashboardPage({ params }: Props) {
  const { sponsorId } = await params;

  const [sponsor, summary] = await Promise.all([
    getSponsor(sponsorId),
    getSponsorSummary(sponsorId),
  ]);

  if (!sponsor) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--destructive)]">Sponsor not found.</p>
          <Link href="/sponsor" className="text-[var(--accent)] hover:underline mt-4 inline-block">
            Back to Sponsor Portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="csl-page">
        <div className="csl-shell csl-shell--with-side">
          <aside className="csl-rail" aria-label="Sponsor profile">
            <Link href="/sponsor" className="csl-arrow">← Portal</Link>
            <span className="csl-rail__eyebrow">Sponsor // {sponsor.organization}</span>
            <div className="csl-rail__title">{sponsor.name}</div>
            <p className="csl-rail__copy">{sponsor.contactEmail}</p>
            <nav className="csl-rail__nav" aria-label="Sponsor data">
              <span>ID <strong>{sponsor.id}</strong></span>
              <span>Challenges <strong>{summary?.challenges ?? 0}</strong></span>
              <span>Top work <strong>{summary?.topSubmissions.length ?? 0}</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header className="flex flex-wrap items-start justify-between gap-4 mb-12">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                  {sponsor.name}
                </h1>
                <p className="mt-2 text-[var(--muted-foreground)]">
                  {sponsor.organization} &bull; {sponsor.contactEmail}
                </p>
              </div>
              <Link href={`/sponsor/${sponsorId}/attach`} className="csl-action">
                Attach brief
              </Link>
            </header>

            {summary && (
              <>
                <div className="csl-kpi-strip" aria-label="Sponsor metrics">
                  <div className="csl-kpi csl-kpi--yellow">
                    <div className="csl-kpi__label">Attached</div>
                    <div className="csl-kpi__value">{summary.challenges}</div>
                    <div className="csl-kpi__note">challenge briefs</div>
                  </div>
                  <div className="csl-kpi csl-kpi--blue">
                    <div className="csl-kpi__label">Top work</div>
                    <div className="csl-kpi__value">{summary.topSubmissions.length}</div>
                    <div className="csl-kpi__note">ranked entries</div>
                  </div>
                  <div className="csl-kpi csl-kpi--red">
                    <div className="csl-kpi__label">Outcomes</div>
                    <div className="csl-kpi__value">—</div>
                    <div className="csl-kpi__note">recorded later</div>
                  </div>
                  <div className="csl-kpi csl-kpi--yellow">
                    <div className="csl-kpi__label">Signal</div>
                    <div className="csl-kpi__value">LIVE</div>
                    <div className="csl-kpi__note">talent board</div>
                  </div>
                </div>

                <section>
                  <div className="csl-section-row">
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                      Top submissions
                    </h2>
                    <span className="csl-mini">Sponsor signal feed</span>
                  </div>

                  {summary.topSubmissions.length === 0 ? (
                    <div className="csl-panel csl-panel--hero">
                      <div className="csl-panel__title">No scored work yet.</div>
                      <p className="csl-panel__copy">
                        Top submissions will appear once sponsored challenges are scored.
                      </p>
                    </div>
                  ) : (
                    <div className="csl-card-grid">
                      {summary.topSubmissions.map((s) => {
                        const topScore = s.scores?.[0]?.totalScore;
                        return (
                          <article key={s.id} className="csl-card">
                            <span className="csl-card__block csl-card__block--blue" aria-hidden="true" />
                            <div className="csl-card__top">
                              <div>
                                <h3 className="csl-card__title">{s.id}</h3>
                                <p className="csl-card__meta">Challenge {s.challengeId}</p>
                              </div>
                              <span className="csl-pill csl-pill--active">top</span>
                            </div>
                            <div className="csl-card__stats">
                              <div className="csl-card__stat">
                                <strong>{topScore !== undefined ? topScore.toFixed(1) : "—"}</strong>
                                <span>score</span>
                              </div>
                              <div className="csl-card__stat">
                                <strong>{formatDate(s.submittedAt)}</strong>
                                <span>submitted</span>
                              </div>
                            </div>
                            <div className="csl-card__footer">
                              <span className="csl-mini">Participant {s.participantId}</span>
                              <span className="csl-arrow">Signal →</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="csl-side" aria-label="Sponsor activity">
            <div>
              <div className="csl-side__title">Outcome stack</div>
              <p className="csl-rail__copy">A compact readout for active briefs and talent signals.</p>
            </div>
            <div className="csl-side__item">
              <strong>Next action</strong>
              <span>Attach a new sponsor brief to a challenge sprint.</span>
            </div>
            <div className="csl-side__item">
              <strong>Talent pipeline</strong>
              <span>Top submissions are grouped by challenge and score.</span>
            </div>
            <Link href={`/sponsor/${sponsorId}/attach`} className="csl-action csl-action--ghost">
              Attach brief
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
