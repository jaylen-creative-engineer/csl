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
      <div style={{ padding: "1rem", background: "#dcfce7", borderRadius: "0.75rem", color: "#15803d" }}>
        Score submitted successfully! Redirecting...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
      <div>
        <label style={labelStyle} htmlFor="judge-id">Your Judge ID</label>
        <input
          id="judge-id"
          value={judgeId}
          onChange={(e) => setJudgeId(e.target.value)}
          required
          placeholder="Your participant UUID"
          style={inputStyle}
        />
      </div>

      {criteria.length > 0 ? (
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.75rem", color: "#374151" }}>
            Criterion Scores (0–100)
          </p>
          <div style={{ display: "grid", gap: "1rem" }}>
            {criteria.map((c) => (
              <div key={c.name}>
                <label style={labelStyle} htmlFor={`score-${c.name}`}>
                  {c.name} (weight: {c.weight})
                  {c.description && <span style={{ fontWeight: 400, color: "#9ca3af" }}> — {c.description}</span>}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    id={`score-${c.name}`}
                    type="range"
                    min={0}
                    max={100}
                    value={scores[c.name] ?? 50}
                    onChange={(e) => updateScore(c.name, Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: "2.5rem", textAlign: "right", fontWeight: 600 }}>
                    {scores[c.name] ?? 50}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "0.75rem", background: "#fef9c3", borderRadius: "0.5rem", fontSize: "0.875rem", color: "#92400e" }}>
          No scoring criteria defined for this challenge. You can still provide a rationale.
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="rationale">Rationale</label>
        <textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          required
          rows={4}
          placeholder="Explain your scoring decision..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? "Submitting..." : "Submit Score"}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.35rem",
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "0.5rem",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "0.5rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
};
