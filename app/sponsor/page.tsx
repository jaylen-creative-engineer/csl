export default function SponsorIndexPage() {
  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker">Outcome signals</p>
          <h1 className="app-title">Sponsor <em>portal.</em></h1>
          <p className="app-muted" style={{ marginTop: 14, maxWidth: "42ch" }}>
            View attachments, outcome signals, and attach briefs to challenges.
          </p>
        </div>
        <span className="app-fig">FIG.S1 — Sponsor</span>
      </div>

      <div className="app-panel">
        <p className="app-section-label">Access your dashboard</p>
        <p className="app-label">Enter your sponsor ID to view attachments and outcome signals.</p>

        <form method="GET" action="/sponsor/redirect" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
          <input
            name="sponsorId"
            required
            placeholder="Your sponsor UUID"
            className="app-input"
            style={{ flex: 1, minWidth: 220 }}
          />
          <button type="submit" className="app-btn">Go to dashboard →</button>
        </form>
      </div>
    </>
  );
}
