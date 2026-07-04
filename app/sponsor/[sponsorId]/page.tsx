import Link from "next/link";
import { DataTable, type DataTableRow } from "../../_components/dashboard/data-table";
import { EmptyState } from "../../_components/dashboard/empty-state";

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
          {(() => {
            const scores = summary.topSubmissions
              .map((s) => s.scores?.[0]?.totalScore)
              .filter((n): n is number => n !== undefined);
            const bestScore = scores.length ? Math.max(...scores) : null;
            const avgScore = scores.length
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : null;
            return (
              <div className="app-stat-grid">
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
                <div className="app-stat">
                  <span className="app-stat-idx">03</span>
                  <span className="app-stat-value">
                    {bestScore !== null ? bestScore.toFixed(1) : "—"}
                  </span>
                  <span className="app-stat-label">Best score</span>
                </div>
                <div className="app-stat">
                  <span className="app-stat-idx">04</span>
                  <span className="app-stat-value">
                    {avgScore !== null ? avgScore.toFixed(1) : "—"}
                  </span>
                  <span className="app-stat-label">Average top score</span>
                </div>
              </div>
            );
          })()}

          <p className="app-section-label">Top submissions by challenge</p>
          {summary.topSubmissions.length === 0 ? (
            <EmptyState
              fig="FIG.S2 — Signals"
              title="No scored submissions yet"
              body="Once judges score work against your attached challenges, the top submissions and their outcome signals will surface here."
              ctaHref={`/sponsor/${sponsorId}/attach`}
              ctaLabel="Attach a brief →"
            />
          ) : (
            <DataTable
              columns={[
                { key: "shortId", label: "Submission", kind: "primary", subKey: "challengeShort" },
                { key: "participantShort", label: "Participant", kind: "mono" },
                { key: "topScore", label: "Top score", kind: "score", numeric: true, width: "120px" },
                { key: "submittedAt", label: "Submitted", kind: "date", numeric: true, width: "120px" },
              ]}
              rows={summary.topSubmissions.map(
                (s): DataTableRow => ({
                  id: s.id,
                  shortId: `${s.id.slice(0, 10)}…`,
                  challengeShort: `Challenge ${s.challengeId.slice(0, 10)}…`,
                  participantShort: `${s.participantId.slice(0, 10)}…`,
                  topScore: s.scores?.[0]?.totalScore ?? null,
                  submittedAt: s.submittedAt,
                }),
              )}
              searchKeys={["shortId", "challengeShort", "participantShort"]}
              searchPlaceholder="Search submissions"
              countLabel="submissions"
              initialSort={{ key: "topScore", dir: "desc" }}
            />
          )}
        </>
      )}
    </>
  );
}
