import Link from "next/link";

export default function JudgeDashboardPage() {
  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker">Scoring queue</p>
          <h1 className="app-title">Judge <em>dashboard.</em></h1>
          <p className="app-muted" style={{ marginTop: 14, maxWidth: "42ch" }}>
            Challenges currently open for judging. Score submissions against real criteria.
          </p>
        </div>
        <span className="app-fig">FIG.J1 — Judge</span>
      </div>

      <div className="app-empty">
        <p>
          <strong>No challenges in judging state right now.</strong>
        </p>
        <p style={{ marginTop: 12 }}>
          If you have a challenge ID, navigate directly to{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--app-accent)" }}>
            /judge/[challengeId]
          </code>
        </p>
      </div>
    </>
  );
}
