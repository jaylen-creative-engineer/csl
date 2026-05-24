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
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/sponsor"
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Sponsor Portal
        </Link>

        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
              {sponsor.name}
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              {sponsor.organization} &bull; {sponsor.contactEmail}
            </p>
          </div>
          <Link
            href={`/sponsor/${sponsorId}/attach`}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
          >
            + Attach Brief to Challenge
          </Link>
        </header>

        {summary && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="p-6 bg-[var(--secondary)] text-center">
                <div className="text-3xl font-bold text-[var(--foreground)]">{summary.challenges}</div>
                <div className="text-sm text-[var(--muted-foreground)] mt-1">Challenges Attached</div>
              </div>
              <div className="p-6 bg-[var(--secondary)] text-center">
                <div className="text-3xl font-bold text-[var(--success)]">{summary.topSubmissions.length}</div>
                <div className="text-sm text-[var(--muted-foreground)] mt-1">Top Submissions</div>
              </div>
            </div>

            {/* Top Submissions */}
            <section>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                Top Submissions by Challenge
              </h2>
              
              {summary.topSubmissions.length === 0 ? (
                <div className="p-8 bg-[var(--secondary)]">
                  <p className="text-[var(--muted-foreground)]">
                    No scored submissions yet across your challenges.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[var(--border)]">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Submission ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Challenge</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Participant</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Top Score</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--foreground)]">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.topSubmissions.map((s) => {
                        const topScore = s.scores?.[0]?.totalScore;
                        return (
                          <tr key={s.id} className="border-b border-[var(--border-soft)]">
                            <td className="py-4 px-4 font-mono text-sm text-[var(--muted-foreground)]">
                              {s.id.slice(0, 10)}...
                            </td>
                            <td className="py-4 px-4 font-mono text-sm text-[var(--muted-foreground)]">
                              {s.challengeId.slice(0, 10)}...
                            </td>
                            <td className="py-4 px-4 font-mono text-sm text-[var(--muted-foreground)]">
                              {s.participantId.slice(0, 10)}...
                            </td>
                            <td className="py-4 px-4 font-semibold text-[var(--foreground)]">
                              {topScore !== undefined ? topScore.toFixed(1) : "—"}
                            </td>
                            <td className="py-4 px-4 text-[var(--foreground)]">
                              {new Date(s.submittedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
