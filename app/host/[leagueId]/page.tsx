import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
  leagueId: string;
}

interface League {
  id: string;
  name: string;
  status: string;
  challengeIds: string[];
}

async function getLeague(leagueId: string): Promise<League | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues/${leagueId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: League };
  return data.data ?? null;
}

async function getChallenges(challengeIds: string[]): Promise<Challenge[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const results = await Promise.allSettled(
    challengeIds.map((id) =>
      fetch(`${baseUrl}/api/v1/challenges/${id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { ok: boolean; data?: Challenge } | null) => d?.data ?? null)
    )
  );
  return results
    .filter((r): r is PromiseFulfilledResult<Challenge | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value as Challenge);
}

type Props = { params: Promise<{ leagueId: string }> };

export default async function HostLeaguePage({ params }: Props) {
  const { leagueId } = await params;
  const league = await getLeague(leagueId);

  if (!league) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>League not found.</p>
        <Link href="/host" style={{ color: "#2563eb" }}>Back to Dashboard</Link>
      </main>
    );
  }

  const challenges = await getChallenges(league.challengeIds ?? []);

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/host" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Host Dashboard
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {league.name}
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Status: <strong>{league.status}</strong>
      </p>

      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Challenges</h2>
          <Link
            href={`/host/${leagueId}/challenges/new`}
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
            + New Challenge
          </Link>
        </div>

        {challenges.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No challenges yet. Create one to get started.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Deadline</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>
                    <Link
                      href={`/host/${leagueId}/challenges/${c.id}`}
                      style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ ...statusBadge, ...statusColor(c.status) }}>{c.status}</span>
                  </td>
                  <td style={tdStyle}>{new Date(c.deadline).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <Link
                      href={`/host/${leagueId}/challenges/${c.id}`}
                      style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

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

const statusBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "0.15rem 0.6rem",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 600,
};

function statusColor(status: string): React.CSSProperties {
  switch (status) {
    case "open": return { background: "#dcfce7", color: "#15803d" };
    case "judging": return { background: "#fef9c3", color: "#a16207" };
    case "complete": return { background: "#f3f4f6", color: "#6b7280" };
    default: return { background: "#e0f2fe", color: "#0369a1" };
  }
}
