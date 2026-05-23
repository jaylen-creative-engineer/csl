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
    <main style={{ padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/host/${leagueId}`} style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to League
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>
        New Challenge
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
        <div>
          <label style={labelStyle} htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Brand Identity Sprint"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="prompt">Brief / Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={5}
            placeholder="Describe the challenge prompt for participants..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="deadline">Deadline</label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="criteria">
            Scoring Criteria (JSON)
          </label>
          <textarea
            id="criteria"
            value={criteriaJson}
            onChange={(e) => setCriteriaJson(e.target.value)}
            rows={6}
            placeholder='[{"name":"Quality","weight":1,"description":"..."}]'
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
          />
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.25rem" }}>
            Array of {`{ name, weight, description }`} objects. Leave empty to skip.
          </p>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Creating..." : "Create Challenge"}
          </button>
          <Link
            href={`/host/${leagueId}`}
            style={{ ...btnStyle, background: "#f3f4f6", color: "#374151", textDecoration: "none", display: "inline-block", textAlign: "center" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
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
