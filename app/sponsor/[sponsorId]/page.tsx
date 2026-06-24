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
      <>
        <p className="app-error">Sponsor not found.</p>
        <Link href="/sponsor" className="app-back">← Sponsor portal</Link>
      </>
    );
  }

  return (
    <>
      <Link href="/sponsor" className="app-back">← Sponsor portal</Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">Outcome signals</p>
          <h1 className="app-title">{sponsor.name}</h1>
          <p className="app-muted" style={{ marginTop: 14 }}>
            {sponsor.organization} · {sponsor.contactEmail}
          </p>
        </div>
        <Link href={`/sponsor/${sponsorId}/attach`} className="app-btn sm">
          ＋ Attach brief
        </Link>
      </div>

      {summary && (
        <>
          <div className="app-stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="app-stat">
              <span className="app-stat-idx">01</span>
              <span className="app-stat-value">{summary.challenges}</span>
              <span className="app-stat-label">Challenges attached</span>
            </div>
            <div className="app-stat">
              <span className="app-stat-idx">02</span>
              <span className="app-stat-value">{summary.topSubmissions.length}</span>
              <span className="app-stat-label">Top submissions</span>
            </div>
          </div>

          <p className="app-section-label">Top submissions by challenge</p>
          {summary.topSubmissions.length === 0 ? (
            <div className="app-empty"><p>No scored submissions yet across your challenges.</p></div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Submission</th>
                  <th>Challenge</th>
                  <th>Participant</th>
                  <th>Top score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {summary.topSubmissions.map((s) => {
                  const topScore = s.scores?.[0]?.totalScore;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.id.slice(0, 10)}…</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.challengeId.slice(0, 10)}…</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.participantId.slice(0, 10)}…</td>
                      <td style={{ color: "var(--app-accent)", fontWeight: 600 }}>
                        {topScore !== undefined ? topScore.toFixed(1) : "—"}
                      </td>
                      <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}
