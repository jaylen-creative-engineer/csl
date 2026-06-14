export default function SponsorIndexPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="csl-page">
        <div className="csl-shell csl-shell--with-side">
          <aside className="csl-rail" aria-label="Sponsor context">
            <span className="csl-rail__eyebrow">Sponsor // Signal Desk</span>
            <div className="csl-rail__title">Briefs with a scoreboard.</div>
            <p className="csl-rail__copy">
              Attach a real brief to a live sprint and watch outcome signals emerge from public work.
            </p>
            <nav className="csl-rail__nav" aria-label="Sponsor preview">
              <span>Brief attach <strong>01</strong></span>
              <span>Talent signal <strong>LIVE</strong></span>
              <span>Routing <strong>ID</strong></span>
            </nav>
            <div className="csl-rail__glyph" aria-hidden="true" />
          </aside>

          <div className="csl-main-stack">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
                Sponsor Portal
              </h1>
              <p className="mt-3 text-[var(--muted-foreground)]">
                View attachments, outcome signals, and top submissions tied to your briefs.
              </p>
            </header>

            <div className="csl-kpi-strip" aria-label="Sponsor preview metrics">
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Access</div>
                <div className="csl-kpi__value">ID</div>
                <div className="csl-kpi__note">sponsor routed</div>
              </div>
              <div className="csl-kpi csl-kpi--blue">
                <div className="csl-kpi__label">Briefs</div>
                <div className="csl-kpi__value">+</div>
                <div className="csl-kpi__note">attach to challenge</div>
              </div>
              <div className="csl-kpi csl-kpi--red">
                <div className="csl-kpi__label">Talent</div>
                <div className="csl-kpi__value">TOP</div>
                <div className="csl-kpi__note">ranked submissions</div>
              </div>
              <div className="csl-kpi csl-kpi--yellow">
                <div className="csl-kpi__label">Outcome</div>
                <div className="csl-kpi__value">SIG</div>
                <div className="csl-kpi__note">tracked results</div>
              </div>
            </div>

            <section className="csl-panel csl-panel--hero">
              <div className="csl-panel__title">Access your signal room.</div>
              <p className="csl-panel__copy">
                Enter your sponsor ID to open attached briefs, ranked submissions, and outcome signals.
              </p>

              <form method="GET" action="/sponsor/redirect" className="mt-8 flex flex-wrap gap-3">
                <input
                  name="sponsorId"
                  required
                  placeholder="Your sponsor UUID"
                  className="flex-1 min-w-[220px] px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
                />
                <button type="submit" className="csl-action">
                  Go to dashboard
                </button>
              </form>
            </section>
          </div>

          <aside className="csl-side" aria-label="Sponsor outcomes preview">
            <div>
              <div className="csl-side__title">What opens next</div>
              <p className="csl-rail__copy">A sponsor dashboard becomes a talent pipeline view.</p>
            </div>
            <div className="csl-side__item">
              <strong>Attachment map</strong>
              <span>See every challenge where your brief is in play.</span>
            </div>
            <div className="csl-side__item">
              <strong>Top submissions</strong>
              <span>Review ranked work and participant IDs by challenge.</span>
            </div>
            <div className="csl-side__item">
              <strong>Note</strong>
              <span>A listing endpoint would enable automatic sponsor routing here.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
