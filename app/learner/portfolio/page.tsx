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
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/learner" 
            className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
          >
            <span className="mr-2">←</span> Discovery
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase mb-8">
            My Portfolio
          </h1>
          
          <div className="p-8 bg-[var(--secondary)]">
            <p className="font-medium text-[var(--foreground)] mb-4">
              Enter your participant ID to view your portfolio.
            </p>
            <PortfolioIdForm />
          </div>
        </div>
      </main>
    );
  }

  const portfolio = await getPortfolio(participantId);

  if (!portfolio) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/learner" 
            className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
          >
            <span className="mr-2">←</span> Discovery
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase mb-8">
            My Portfolio
          </h1>
          
          <p className="text-[var(--destructive)] mb-6">
            Portfolio not found for participant ID: {participantId}
          </p>
          <PortfolioIdForm />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/learner" 
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Discovery
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            {portfolio.handle}&apos;s Portfolio
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="text-sm text-[var(--muted-foreground)]">
              Discipline: <span className="text-[var(--foreground)]">{portfolio.discipline}</span>
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              Score: <span className="font-semibold text-[var(--foreground)]">{portfolio.aggregateScore.toFixed(1)}</span>
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              Entries: <span className="text-[var(--foreground)]">{portfolio.entries.length}</span>
            </span>
          </div>
        </header>

        {/* Skill Signals */}
        {portfolio.skillSignals.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Skill Signals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {portfolio.skillSignals.map((signal, i) => (
                <div key={i} className="p-4 bg-[var(--secondary)]">
                  <div className="text-sm font-medium text-[var(--foreground)]">{signal.domain}</div>
                  <div className="text-2xl font-bold text-[var(--foreground)] mt-1">
                    {signal.averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {signal.sampleCount} sample{signal.sampleCount !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Submissions */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Submissions ({portfolio.entries.length})
          </h2>
          
          {portfolio.entries.length === 0 ? (
            <div className="p-8 bg-[var(--secondary)]">
              <p className="text-[var(--muted-foreground)]">No scored submissions yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {portfolio.entries.map((entry, i) => {
                const scores = entry.submission.scores ?? [];
                const latestScore = scores[scores.length - 1];
                return (
                  <div key={entry.submission.id ?? i} className="p-6 bg-[var(--secondary)]">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{entry.challengeTitle}</h3>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Submitted: {new Date(entry.submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {entry.score !== undefined && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[var(--foreground)]">
                            {entry.score.toFixed(1)}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">score</div>
                        </div>
                      )}
                    </div>

                    {entry.submission.artifact?.url && (
                      <a
                        href={entry.submission.artifact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-sm text-[var(--accent)] hover:underline"
                      >
                        View Artifact →
                      </a>
                    )}

                    {latestScore && latestScore.criteriaScores.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
                        <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">
                          Criterion Breakdown
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {latestScore.criteriaScores.map((cs, j) => (
                            <span
                              key={j}
                              className="inline-flex px-3 py-1 text-xs font-medium bg-[var(--background)] text-[var(--foreground)] rounded-full"
                            >
                              {cs.criteriaName}: {cs.score}
                            </span>
                          ))}
                        </div>
                        {latestScore.rationale && (
                          <p className="text-sm text-[var(--muted-foreground)] mt-3 italic">
                            &ldquo;{latestScore.rationale}&rdquo;
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
      </div>
    </main>
  );
}

function PortfolioIdForm() {
  return (
    <form method="GET" action="/learner/portfolio" className="flex flex-wrap gap-3">
      <input
        name="id"
        required
        placeholder="Your participant UUID"
        className="flex-1 min-w-[200px] px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
      />
      <button
        type="submit"
        className="inline-flex items-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
      >
        View Portfolio
      </button>
    </form>
  );
}
