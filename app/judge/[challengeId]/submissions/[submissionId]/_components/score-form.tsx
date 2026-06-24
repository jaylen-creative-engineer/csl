"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CriterionRow {
  criteriaName: string;
  score: number;
}

interface ScoringCriterion {
  name: string;
  weight: number;
  description?: string;
}

interface Props {
  submissionId: string;
  challengeId: string;
  criteria: ScoringCriterion[];
}

export function ScoreForm({ submissionId, challengeId, criteria }: Props) {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState("");
  const [rationale, setRationale] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(criteria.map((c) => [c.name, 50]))
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateScore(name: string, value: number) {
    setScores((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const criteriaScores: CriterionRow[] = criteria.map((c) => ({
      criteriaName: c.name,
      score: scores[c.name] ?? 50,
    }));

    const res = await fetch(`/api/v1/submissions/${submissionId}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ judgeId: judgeId.trim(), criteriaScores, rationale: rationale.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? "Failed to submit score.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(`/judge/${challengeId}`), 1500);
  }

  if (success) {
    return (
      <p style={{ margin: 0, fontWeight: 600, color: "var(--app-accent)" }}>
        Score submitted. Redirecting…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-field">
        <label htmlFor="judge-id" className="app-label">Your judge ID</label>
        <input
          id="judge-id"
          value={judgeId}
          onChange={(e) => setJudgeId(e.target.value)}
          required
          placeholder="Your participant UUID"
          className="app-input"
        />
      </div>

      {criteria.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          <p className="app-section-label">Criterion scores (0–100)</p>
          {criteria.map((c) => (
            <div key={c.name} className="app-criterion">
              <div className="app-criterion-head">
                <span className="app-criterion-name">
                  {c.name} <span className="app-muted" style={{ fontSize: 12 }}>(weight {c.weight})</span>
                </span>
                <span className="app-criterion-weight">{scores[c.name] ?? 50}</span>
              </div>
              {c.description && <p className="app-muted" style={{ fontSize: 12, marginBottom: 8 }}>{c.description}</p>}
              <input
                id={`score-${c.name}`}
                type="range"
                min={0}
                max={100}
                value={scores[c.name] ?? 50}
                onChange={(e) => updateScore(c.name, Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--app-accent)" }}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="app-muted" style={{ marginBottom: 20 }}>No scoring criteria defined. You can still provide a rationale.</p>
      )}

      <div className="app-field">
        <label htmlFor="rationale" className="app-label">Rationale</label>
        <textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          required
          rows={4}
          placeholder="Explain your scoring decision…"
          className="app-textarea"
        />
      </div>

      {error && <p className="app-error">{error}</p>}

      <button type="submit" disabled={loading} className="app-btn">
        {loading ? "Submitting…" : "Submit score →"}
      </button>
    </form>
  );
}
