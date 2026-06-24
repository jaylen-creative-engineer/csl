import Link from "next/link";
import { SubmitForm } from "./_components/submit-form";
import { formatDeadlineLong, statusTagClass } from "../../../_components/app-shell/app-utils";

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

async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/challenges/${challengeId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as { ok: boolean; data?: Challenge };
  return data.data ?? null;
}

type Props = { params: Promise<{ challengeId: string }> };

export default async function LearnerChallengePage({ params }: Props) {
  const { challengeId } = await params;
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return (
      <>
        <p className="app-error">Challenge not found.</p>
        <Link href="/learner" className="app-back">
          ← Dashboard
        </Link>
      </>
    );
  }

  const isOpen = challenge.status === "open";
  const totalWeight = challenge.scoringCriteria?.reduce((s, c) => s + c.weight, 0) ?? 100;

  return (
    <>
      <Link href={`/learner/${challenge.leagueId}`} className="app-back">
        ← League
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <span className="app-tag purple">Sprint</span>
        <span className={isOpen ? "app-tag open" : statusTagClass(challenge.status)}>{challenge.status}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(242,241,237,0.4)" }}>
          FIG.03 — Sprint
        </span>
      </div>

      <h1 className="app-title" style={{ maxWidth: "20ch" }}>{challenge.title}</h1>
      <p className="app-muted" style={{ margin: "14px 0 0", fontSize: 13 }}>
        League {challenge.leagueId.slice(0, 8)}… · Closes {formatDeadlineLong(challenge.deadline)}
      </p>

      <div className="app-panel" style={{ marginTop: 32 }}>
        <p className="app-section-label accent">The brief</p>
        <p className="app-text">{challenge.prompt}</p>
      </div>

      {challenge.scoringCriteria && challenge.scoringCriteria.length > 0 && (
        <>
          <p className="app-section-label" style={{ marginTop: 34 }}>Scoring criteria</p>
          {challenge.scoringCriteria.map((c, i) => (
            <div key={i} className="app-criterion">
              <div className="app-criterion-head">
                <span className="app-criterion-name">{c.name}</span>
                <span className="app-criterion-weight">{c.weight}%</span>
              </div>
              <div className="app-progress">
                <i style={{ width: `${(c.weight / totalWeight) * 100}%` }} />
              </div>
              {c.description && (
                <p className="app-muted" style={{ marginTop: 8, fontSize: 13 }}>{c.description}</p>
              )}
            </div>
          ))}
        </>
      )}

      <p className="app-section-label" style={{ marginTop: 34 }}>Submit your entry</p>
      {isOpen ? (
        <div className="app-panel">
          <SubmitForm challengeId={challengeId} />
        </div>
      ) : (
        <div className="app-empty">
          <p>This challenge is not currently accepting submissions.</p>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href={`/learner/challenges/${challengeId}/leaderboard`} className="app-btn ghost">
          View leaderboard
        </Link>
      </div>
    </>
  );
}
