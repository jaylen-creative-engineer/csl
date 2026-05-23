import Link from "next/link";
import { EnrollButton } from "./_components/enroll-button.js";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
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

export default async function LearnerLeagueDetailPage({ params }: Props) {
  const { leagueId } = await params;
  const league = await getLeague(leagueId);

  if (!league) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#dc2626" }}>League not found.</p>
        <Link href="/learner" style={{ color: "#2563eb" }}>Back to Discovery</Link>
      </main>
    );
  }

  const challenges = await getChallenges(league.challengeIds ?? []);
  const openChallenges = challenges.filter((c) => c.status === "open");

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/learner" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Discovery
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{league.name}</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Status: <strong>{league.status}</strong>
          </p>
        </div>
        <EnrollButton leagueId={leagueId} />
      </div>

      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Open Challenges ({openChallenges.length})
        </h2>

        {openChallenges.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No open challenges right now. Check back soon.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {openChallenges.map((c) => (
              <Link
                key={c.id}
                href={`/learner/challenges/${c.id}`}
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
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                  Deadline: {new Date(c.deadline).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}

        {challenges.length > openChallenges.length && (
          <div style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#9ca3af", marginBottom: "0.5rem" }}>
              Other Challenges
            </h3>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {challenges
                .filter((c) => c.status !== "open")
                .map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "0.75rem 1rem",
                      border: "1px solid #f3f4f6",
                      borderRadius: "0.5rem",
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                    }}
                  >
                    {c.title} — <em>{c.status}</em>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
