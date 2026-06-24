import Link from "next/link";
import { LifecycleButtons } from "./_components/lifecycle-buttons";
import { statusTagClass } from "../../../../_components/app-shell/app-utils";

interface ScoringCriterion {
  name: string;
  weight: number;
  description?: string;
}

interface Challenge {
  id: string;
  title: string;
  prompt: string;
  status: string;
  deadline: string;
  leagueId: string;
  scoringCriteria?: ScoringCriterion[];
}

interface Submission {
  id: string;
  participantId: string;
  status: string;
  createdAt: string;
  artifact?: { url: string };
}

async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Challenge };
  return data.data ?? null;
}

async function getSubmissions(challengeId: string): Promise<Submission[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}/submissions`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json() as { ok: boolean; data?: Submission[] };
  return data.data ?? [];
}

type Props = { params: Promise<{ leagueId: string; challengeId: string }> };

export default async function ChallengeSprintPage({ params }: Props) {
  const { leagueId, challengeId } = await params;
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return (
      <>
        <p className="app-error">Challenge not found.</p>
        <Link href={`/host/${leagueId}`} className="app-back">← League</Link>
      </>
    );
  }

  const submissions = await getSubmissions(challengeId);

  return (
    <>
      <Link href={`/host/${leagueId}`} className="app-back">← League</Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">Sprint admin</p>
          <h1 className="app-title">{challenge.title}</h1>
          <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span className={statusTagClass(challenge.status)}>{challenge.status}</span>
            <span className="app-muted" style={{ fontSize: 13 }}>
              Deadline {new Date(challenge.deadline).toLocaleDateString()} · {submissions.length} submissions
            </span>
          </div>
        </div>
      </div>

      <div className="app-panel" style={{ marginBottom: 32 }}>
        <p className="app-section-label accent">The brief</p>
        <p className="app-text">{challenge.prompt}</p>
      </div>

      {challenge.scoringCriteria && challenge.scoringCriteria.length > 0 && (
        <>
          <p className="app-section-label">Scoring criteria</p>
          <table className="app-table" style={{ marginBottom: 32 }}>
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Weight</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {challenge.scoringCriteria.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.weight}</td>
                  <td className="app-muted">{c.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="app-section-label">Lifecycle</p>
      <div className="app-panel" style={{ marginBottom: 32 }}>
        <LifecycleButtons challengeId={challengeId} status={challenge.status} />
      </div>

      <p className="app-section-label">Submissions ({submissions.length})</p>
      {submissions.length === 0 ? (
        <div className="app-empty"><p>No submissions yet.</p></div>
      ) : (
        <table className="app-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Participant</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Artifact</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.id.slice(0, 8)}…</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.participantId.slice(0, 8)}…</td>
                <td>{s.status}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  {s.artifact?.url ? (
                    <a href={s.artifact.url} target="_blank" rel="noopener noreferrer">View</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
