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
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>Sponsor not found.</p>
        <Link href="/sponsor" style={{ color: "#2563eb" }}>Back to Sponsor Portal</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/sponsor" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Sponsor Portal
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{sponsor.name}</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {sponsor.organization} &nbsp;&bull;&nbsp; {sponsor.contactEmail}
          </p>
        </div>
        <Link
          href={`/sponsor/${sponsorId}/attach`}
          style={{
            padding: "0.5rem 1rem",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          + Attach Brief to Challenge
        </Link>
      </div>

      {summary && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div style={statCard}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}>{summary.challenges}</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Challenges Attached</div>
            </div>
            <div style={statCard}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a" }}>{summary.topSubmissions.length}</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Top Submissions</div>
            </div>
          </div>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
              Top Submissions by Challenge
            </h2>
            {summary.topSubmissions.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No scored submissions yet across your challenges.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                    <th style={thStyle}>Submission ID</th>
                    <th style={thStyle}>Challenge</th>
                    <th style={thStyle}>Participant</th>
                    <th style={thStyle}>Top Score</th>
                    <th style={thStyle}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topSubmissions.map((s) => {
                    const topScore = s.scores?.[0]?.totalScore;
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem" }}>{s.id.slice(0, 10)}…</td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem" }}>{s.challengeId.slice(0, 10)}…</td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.8rem" }}>{s.participantId.slice(0, 10)}…</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#2563eb" }}>
                          {topScore !== undefined ? topScore.toFixed(1) : "—"}
                        </td>
                        <td style={tdStyle}>{new Date(s.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const statCard: React.CSSProperties = {
  padding: "1rem",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
  background: "#fafafa",
  textAlign: "center",
};

const thStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "#374151",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.9rem",
  color: "#111",
};
