import Link from "next/link";

interface League {
  id: string;
  name: string;
  status: string;
  challengeIds: string[];
}

async function getLeagues(): Promise<League[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  // GET /api/v1/leagues only supports POST (create). No list endpoint exists yet.
  // See missing routes in build report.
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json() as { ok?: boolean; data?: League[] } | League[];
  if (Array.isArray(data)) return data;
  return (data as { data?: League[] }).data ?? [];
}

export default async function LearnerDiscoveryPage() {
  const leagues = await getLeagues();

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Discover Leagues &amp; Challenges
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Browse active leagues and join a challenge sprint.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link
          href="/learner/portfolio"
          style={{
            padding: "0.5rem 1rem",
            background: "#f3f4f6",
            borderRadius: "0.5rem",
            textDecoration: "none",
            color: "#374151",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          My Portfolio
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div style={{ padding: "2rem", background: "#f9fafb", borderRadius: "0.75rem", color: "#6b7280" }}>
          <p style={{ margin: 0, fontWeight: 500 }}>No leagues available right now.</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
            Note: A <code>GET /api/v1/leagues</code> listing endpoint is needed to populate this page. Currently only POST (create) is available.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/learner/${league.id}`}
              style={{
                display: "block",
                padding: "1rem 1.25rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                textDecoration: "none",
                color: "#111",
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 600 }}>{league.name}</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                Status: {league.status} &nbsp;&bull;&nbsp; Challenges: {league.challengeIds?.length ?? 0}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
