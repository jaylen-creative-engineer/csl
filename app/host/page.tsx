import Link from "next/link";
import { CreateLeagueForm } from "./_components/create-league-form.js";

interface League {
  id: string;
  name: string;
  hostId: string;
  status: string;
  challengeIds: string[];
  createdAt: string;
}

async function getLeagues(): Promise<League[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/leagues`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: League[]; leagues?: League[] };
  // Support both possible response shapes
  return data.data ?? (data as unknown as League[]) ?? [];
}

export default async function HostDashboardPage() {
  const leagues = await getLeagues();

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Host Dashboard
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Manage your leagues, create challenges, and advance the sprint lifecycle.
      </p>

      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Your Leagues
        </h2>
        {leagues.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No leagues yet. Create one below.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/host/${league.id}`}
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
                  Status: {league.status} &nbsp;&bull;&nbsp;
                  Challenges: {league.challengeIds?.length ?? 0}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Create a League
        </h2>
        <CreateLeagueForm />
      </section>
    </main>
  );
}
