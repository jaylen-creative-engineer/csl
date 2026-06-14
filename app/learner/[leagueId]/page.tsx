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

function statusTone(status: string): string {
  if (status === "open") return "blue";
  if (status === "complete") return "red";
  return "yellow";
}

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
      <div className="csl-page">
        <div className="csl-shell csl-shell--with-side">
          <aside className="csl-rail" aria-label="League discovery context">
            <Link href="/learner" className="csl-arrow">← Discovery</Link>
            <span className="csl-rail__eyebrow">League // {league.id}</span>
            <div className="csl-rail__title">{league.name}</div>
            <p className="csl-rail__copy">Scan open briefs, enroll, and choose the next scored rep.</p>
            <nav className="csl-rail__nav" aria-label="Learner league metrics">
              <span>Status <strong>{league.status}</strong></span>
              <span>Open <strong>{openChallenges.length}</strong></span>
              <span>Archive <strong>{otherChallenges.length}</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                {league.name}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`csl-pill csl-pill--${league.status}`}>{league.status}</span>
              </div>
            </header>

            <div className="csl-kpi-strip" aria-label="Learner league metrics">
              <div className="csl-kpi csl-kpi--blue">
                <div className="csl-kpi__label">Open</div>
                <div className="csl-kpi__value">{openChallenges.length}</div>
                <div className="csl-kpi__note">playable briefs</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Total</div>
                <div className="csl-kpi__value">{challenges.length}</div>
                <div className="csl-kpi__note">league sprints</div>
              </div>
              <div className="csl-kpi csl-kpi--red">
                <div className="csl-kpi__label">Closed</div>
                <div className="csl-kpi__value">{otherChallenges.length}</div>
                <div className="csl-kpi__note">archive track</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Move</div>
                <div className="csl-kpi__value">GO</div>
                <div className="csl-kpi__note">enroll then submit</div>
              </div>
            </div>

            <section>
              <div className="csl-section-row">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Open challenges
                </h2>
                <span className="csl-mini">FIG. 05 // PLAYER BOARD</span>
              </div>

              {openChallenges.length === 0 ? (
                <div className="csl-panel csl-panel--hero">
                  <div className="csl-panel__title">No open briefs.</div>
                  <p className="csl-panel__copy">Check back soon; archived challenges remain visible for context.</p>
                </div>
              ) : (
                <div className="csl-card-grid">
                  {openChallenges.map((c) => (
                    <Link key={c.id} href={`/learner/challenges/${c.id}`} className="csl-card">
                      <span className={`csl-card__block csl-card__block--${statusTone(c.status)}`} aria-hidden="true" />
                      <div className="csl-card__top">
                        <div>
                          <h3 className="csl-card__title">{c.title}</h3>
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
                          <strong>LIVE</strong>
                          <span>entry</span>
                        </div>
                      </div>
                      <div className="csl-card__footer">
                        <span className="csl-mini">Submission route ready</span>
                        <span className="csl-arrow">Open →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {otherChallenges.length > 0 && (
              <section>
                <div className="csl-section-row">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Archive track
                  </h2>
                  <span className="csl-mini">Completed / judging / draft</span>
                </div>
                <div className="csl-card-grid">
                  {otherChallenges.map((c) => (
                    <Link key={c.id} href={`/learner/challenges/${c.id}`} className="csl-card">
                      <span className={`csl-card__block csl-card__block--${statusTone(c.status)}`} aria-hidden="true" />
                      <div className="csl-card__top">
                        <div>
                          <h3 className="csl-card__title">{c.title}</h3>
                          <p className="csl-card__meta">{c.id}</p>
                        </div>
                        <span className={`csl-pill csl-pill--${c.status}`}>{c.status}</span>
                      </div>
                      <div className="csl-card__footer">
                        <span className="csl-mini">{new Date(c.deadline).toLocaleDateString()}</span>
                        <span className="csl-arrow">View →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="csl-side" aria-label="Enrollment">
            <div>
              <div className="csl-side__title">Entry control</div>
              <p className="csl-rail__copy">Enroll with a participant ID before entering league sprints.</p>
            </div>
            <EnrollButton leagueId={leagueId} />
            <div className="csl-side__item">
              <strong>What counts</strong>
              <span>Public scored submissions become part of the portfolio signal.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
