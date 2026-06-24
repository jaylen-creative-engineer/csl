import Link from "next/link";
import { statusTagClass } from "../../_components/app-shell/app-utils";

interface Challenge {
  id: string;
  title: string;
  status: string;
  deadline: string;
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

type Props = { params: Promise<{ challengeId: string }> };

export default async function JudgeChallengeSubmissionsPage({ params }: Props) {
  const { challengeId } = await params;
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return (
      <>
        <p className="app-error">Challenge not found.</p>
        <Link href="/judge" className="app-back">← Judge dashboard</Link>
      </>
    );
  }

  const submissions = await getSubmissions(challengeId);

  return (
    <>
      <Link href="/judge" className="app-back">← Judge dashboard</Link>

      <div className="app-page-head">
        <div>
          <p className="app-kicker">Scoring queue</p>
          <h1 className="app-title">{challenge.title}</h1>
          <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center" }}>
            <span className={statusTagClass(challenge.status)}>{challenge.status}</span>
            <span className="app-muted" style={{ fontSize: 13 }}>
              Deadline {new Date(challenge.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <p className="app-section-label">Submissions ({submissions.length})</p>

      {submissions.length === 0 ? (
        <div className="app-empty"><p>No submissions to judge yet.</p></div>
      ) : (
        <table className="app-table">
          <thead>
            <tr>
              <th>Submission</th>
              <th>Participant</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
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
                  <Link href={`/judge/${challengeId}/submissions/${s.id}`} className="app-btn sm" style={{ display: "inline-flex" }}>
                    Score
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
