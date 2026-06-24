import Link from "next/link";

interface CriteriaScore {
  criteriaName: string;
  score: number;
}

interface Score {
  submissionId: string;
  judgeId: string;
  criteriaScores: CriteriaScore[];
  totalScore: number;
  rationale: string;
  scoredAt: string;
}

interface SubmissionArtifact {
  url: string;
  mimeType?: string;
  description?: string;
}

interface Submission {
  id: string;
  challengeId: string;
  participantId: string;
  artifact: SubmissionArtifact;
  isPublic: boolean;
  withdrawn: boolean;
  submittedAt: string;
  scores?: Score[];
}

interface ShowcaseEntry {
  submission: Submission;
  participantHandle: string;
  discipline: string;
  challengeTitle: string;
  score?: number;
}

interface SkillSignal {
  participantId: string;
  discipline: string;
  domain: string;
  averageScore: number;
  sampleCount: number;
}

interface Portfolio {
  participantId: string;
  handle: string;
  discipline: string;
  entries: ShowcaseEntry[];
  skillSignals: SkillSignal[];
  aggregateScore: number;
  generatedAt: string;
}

async function getPortfolio(participantId: string): Promise<Portfolio | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/participants/${participantId}/portfolio`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Portfolio };
  return data.data ?? null;
}

type Props = { searchParams: Promise<{ id?: string }> };

export default async function LearnerPortfolioPage({ searchParams }: Props) {
  const { id: participantId } = await searchParams;

  if (!participantId) {
    return (
      <>
        <div className="app-page-head">
          <div>
            <p className="app-kicker">Proof of skill · FIG.05</p>
            <h1 className="app-title">The <em>record.</em></h1>
          </div>
        </div>
        <div className="app-panel">
          <p className="app-label">Enter your participant ID to view your showcase.</p>
          <PortfolioIdForm />
        </div>
      </>
    );
  }

  const portfolio = await getPortfolio(participantId);

  if (!portfolio) {
    return (
      <>
        <Link href="/learner/portfolio" className="app-back">← Showcase</Link>
        <p className="app-error">Portfolio not found for participant ID: {participantId}</p>
        <PortfolioIdForm />
      </>
    );
  }

  return (
    <>
      <div className="app-page-head">
        <div>
          <p className="app-kicker">Proof of skill · FIG.05</p>
          <h1 className="app-title">The <em>record.</em></h1>
          <p className="app-muted" style={{ marginTop: 14 }}>
            @{portfolio.handle} · {portfolio.discipline} · {portfolio.entries.length} scored entries
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="app-section-label" style={{ marginBottom: 6, fontSize: 10 }}>Aggregate</span>
          <span className="app-score-xl">{portfolio.aggregateScore.toFixed(1)}</span>
        </div>
      </div>

      {portfolio.skillSignals.length > 0 && (
        <>
          <p className="app-section-label">Skill signals</p>
          <div className="app-signal-grid">
            {portfolio.skillSignals.map((signal, i) => (
              <div key={i} className="app-signal">
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(242,241,237,0.78)" }}>{signal.domain}</span>
                  <span style={{ fontSize: 20 }}>{signal.averageScore.toFixed(1)}</span>
                </div>
                <div className="app-progress">
                  <i style={{ width: `${Math.min(signal.averageScore, 100)}%` }} />
                </div>
                <span style={{ display: "block", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(242,241,237,0.36)" }}>
                  {signal.sampleCount} sample{signal.sampleCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="app-section-label">Scored entries</p>
      {portfolio.entries.length === 0 ? (
        <div className="app-empty"><p>No scored submissions yet.</p></div>
      ) : (
        portfolio.entries.map((entry, i) => {
          const scores = entry.submission.scores ?? [];
          const latestScore = scores[scores.length - 1];
          return (
            <div key={entry.submission.id ?? i} className="app-entry-card">
              <div className="app-entry-thumb">
                <span>FIG.{String(i + 1).padStart(2, "0")}<br />artifact</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{entry.challengeTitle}</h3>
                    <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(242,241,237,0.45)" }}>
                      {new Date(entry.submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {entry.score !== undefined && (
                    <span className="app-score-lg">{entry.score.toFixed(1)}</span>
                  )}
                </div>

                {entry.submission.artifact?.url && (
                  <a href={entry.submission.artifact.url} target="_blank" rel="noopener noreferrer" className="app-btn ghost sm" style={{ marginTop: 12 }}>
                    View artifact →
                  </a>
                )}

                {latestScore && latestScore.criteriaScores.length > 0 && (
                  <div className="app-chip-row">
                    {latestScore.criteriaScores.map((cs, j) => (
                      <span key={j} className="app-chip">{cs.criteriaName}: {cs.score}</span>
                    ))}
                  </div>
                )}

                {latestScore?.rationale && (
                  <p className="app-text soft" style={{ marginTop: 14, fontSize: 14 }}>
                    &ldquo;{latestScore.rationale}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function PortfolioIdForm() {
  return (
    <form method="GET" action="/learner/portfolio" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
      <input
        name="id"
        required
        placeholder="Your participant UUID"
        className="app-input"
        style={{ flex: 1, minWidth: 220 }}
      />
      <button type="submit" className="app-btn">View showcase →</button>
    </form>
  );
}
