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
      <div className="flex items-center gap-3 p-4 bg-[var(--success)] text-[var(--primary-foreground)]">
        <span className="font-medium">Score submitted successfully! Redirecting...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div>
        <label 
          htmlFor="judge-id" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Your Judge ID
        </label>
        <input
          id="judge-id"
          value={judgeId}
          onChange={(e) => setJudgeId(e.target.value)}
          required
          placeholder="Your participant UUID"
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      {criteria.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
            Criterion Scores (0-100)
          </p>
          <div className="grid gap-4">
            {criteria.map((c) => (
              <div key={c.name} className="p-4 bg-[var(--background)]">
                <label 
                  htmlFor={`score-${c.name}`}
                  className="block text-sm font-medium text-[var(--foreground)] mb-1"
                >
                  {c.name} <span className="text-[var(--muted-foreground)]">(weight: {c.weight})</span>
                </label>
                {c.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">{c.description}</p>
                )}
                <div className="flex items-center gap-4">
                  <input
                    id={`score-${c.name}`}
                    type="range"
                    min={0}
                    max={100}
                    value={scores[c.name] ?? 50}
                    onChange={(e) => updateScore(c.name, Number(e.target.value))}
                    className="flex-1 h-2 bg-[var(--border)] appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                  <span className="min-w-[3rem] text-right font-bold text-[var(--foreground)]">
                    {scores[c.name] ?? 50}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
          No scoring criteria defined for this challenge. You can still provide a rationale.
        </div>
      )}

      <div>
        <label 
          htmlFor="rationale" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Rationale
        </label>
        <textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          required
          rows={4}
          placeholder="Explain your scoring decision..."
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors resize-y"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--destructive)]">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Submit Score"}
      </button>
    </form>
  );
}
