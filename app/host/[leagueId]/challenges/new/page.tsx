"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

interface CriterionRow {
  name: string;
  weight: number;
  description: string;
}

interface Props {
  params: Promise<{ leagueId: string }>;
}

export default function NewChallengePage({ params }: Props) {
  const { leagueId } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [criteriaJson, setCriteriaJson] = useState(
    JSON.stringify([{ name: "Quality", weight: 1, description: "Overall quality" }], null, 2)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let scoringCriteria: CriterionRow[] | undefined;
    if (criteriaJson.trim()) {
      try {
        scoringCriteria = JSON.parse(criteriaJson) as CriterionRow[];
      } catch {
        setError("Scoring Criteria must be valid JSON.");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/v1/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leagueId,
        title: title.trim(),
        prompt: prompt.trim(),
        deadline,
        scoringCriteria,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? "Failed to create challenge.");
      return;
    }

    const data = await res.json() as { data?: { id: string } };
    const challengeId = data.data?.id;
    if (challengeId) {
      router.push(`/host/${leagueId}/challenges/${challengeId}`);
    } else {
      router.push(`/host/${leagueId}`);
    }
  }

  return (
    <>
      <Link href={`/host/${leagueId}`} className="app-back">← League</Link>
      <h1 className="app-title" style={{ marginBottom: 32 }}>New challenge</h1>

      <div className="app-panel" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="app-field">
            <label htmlFor="title" className="app-label">Title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Brand Identity Sprint" className="app-input" />
          </div>
          <div className="app-field">
            <label htmlFor="prompt" className="app-label">Brief / prompt</label>
            <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} required rows={5} placeholder="Describe the challenge prompt…" className="app-textarea" />
          </div>
          <div className="app-field">
            <label htmlFor="deadline" className="app-label">Deadline</label>
            <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="app-input" />
          </div>
          <div className="app-field">
            <label htmlFor="criteria" className="app-label">Scoring criteria (JSON)</label>
            <textarea id="criteria" value={criteriaJson} onChange={(e) => setCriteriaJson(e.target.value)} rows={6} className="app-textarea" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <p className="app-muted" style={{ marginTop: 8, fontSize: 12 }}>Array of {"{ name, weight, description }"} objects.</p>
          </div>
          {error && <p className="app-error">{error}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
            <button type="submit" disabled={loading} className="app-btn">{loading ? "Creating…" : "Create challenge →"}</button>
            <Link href={`/host/${leagueId}`} className="app-btn ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
