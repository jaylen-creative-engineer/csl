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

// This page requires a participantId query param since we can't call Supabase from here
// without a Server Component pattern. The learner provides their ID in the URL.
type Props = { searchParams: Promise<{ id?: string }> };

export default async function LearnerPortfolioPage({ searchParams }: Props) {
  const { id: participantId } = await searchParams;

  if (!participantId) {
    return (
      <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/learner" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
            ← Discovery
          </Link>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>My Portfolio</h1>
        <div style={{ padding: "1.5rem", background: "#fef9c3", borderRadius: "0.75rem", color: "#92400e" }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Enter your participant ID to view your portfolio.</p>
          <PortfolioIdForm />
        </div>
      </main>
    );
  }

  const portfolio = await getPortfolio(participantId);

  if (!portfolio) {
    return (
      <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/learner" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
            ← Discovery
          </Link>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>My Portfolio</h1>
        <p style={{ color: "#dc2626" }}>Portfolio not found for participant ID: {participantId}</p>
        <PortfolioIdForm />
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/learner" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Discovery
        </Link>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          {portfolio.handle}&apos;s Portfolio
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
          Discipline: {portfolio.discipline} &nbsp;&bull;&nbsp;
          Aggregate Score: <strong>{portfolio.aggregateScore.toFixed(1)}</strong> &nbsp;&bull;&nbsp;
          Entries: {portfolio.entries.length}
        </p>
      </div>

      {portfolio.skillSignals.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Skill Signals</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {portfolio.skillSignals.map((signal, i) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{signal.domain}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2563eb", marginTop: "0.25rem" }}>
                  {signal.averageScore.toFixed(1)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  {signal.sampleCount} sample{signal.sampleCount !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Submissions ({portfolio.entries.length})
        </h2>
        {portfolio.entries.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No scored submissions yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {portfolio.entries.map((entry, i) => {
              const scores = entry.submission.scores ?? [];
              const latestScore = scores[scores.length - 1];
              return (
                <div
                  key={entry.submission.id ?? i}
                  style={{
                    padding: "1rem 1.25rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{entry.challengeTitle}</div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.15rem" }}>
                        Submitted: {new Date(entry.submission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {entry.score !== undefined && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563eb" }}>
                          {entry.score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>score</div>
                      </div>
                    )}
                  </div>

                  {entry.submission.artifact?.url && (
                    <a
                      href={entry.submission.artifact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: "0.5rem", color: "#2563eb", fontSize: "0.875rem" }}
                    >
                      View Artifact →
                    </a>
                  )}

                  {latestScore && latestScore.criteriaScores.length > 0 && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.35rem" }}>
                        Criterion Breakdown
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {latestScore.criteriaScores.map((cs, j) => (
                          <span
                            key={j}
                            style={{
                              padding: "0.15rem 0.5rem",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {cs.criteriaName}: {cs.score}
                          </span>
                        ))}
                      </div>
                      {latestScore.rationale && (
                        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.5rem", fontStyle: "italic" }}>
                          "{latestScore.rationale}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function PortfolioIdForm() {
  return (
    <form method="GET" action="/learner/portfolio" style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <input
        name="id"
        required
        placeholder="Your participant UUID"
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "0.5rem 0.75rem",
          border: "1px solid #d1d5db",
          borderRadius: "0.5rem",
          fontSize: "0.95rem",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "0.5rem 1rem",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        View Portfolio
      </button>
    </form>
  );
}
