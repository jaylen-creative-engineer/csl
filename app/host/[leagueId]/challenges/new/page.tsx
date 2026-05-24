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
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/host/${leagueId}`}
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Back to League
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase mb-8">
          New Challenge
        </h1>

        <div className="p-8 bg-[var(--secondary)]">
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div>
              <label 
                htmlFor="title" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Brand Identity Sprint"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </div>

            <div>
              <label 
                htmlFor="prompt" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Brief / Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={5}
                placeholder="Describe the challenge prompt for participants..."
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors resize-y"
              />
            </div>

            <div>
              <label 
                htmlFor="deadline" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Deadline
              </label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </div>

            <div>
              <label 
                htmlFor="criteria" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Scoring Criteria (JSON)
              </label>
              <textarea
                id="criteria"
                value={criteriaJson}
                onChange={(e) => setCriteriaJson(e.target.value)}
                rows={6}
                placeholder='[{"name":"Quality","weight":1,"description":"..."}]'
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors resize-y font-mono text-sm"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Array of {"{ name, weight, description }"} objects. Leave empty to skip.
              </p>
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Challenge"}
              </button>
              <Link
                href={`/host/${leagueId}`}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--background)] rounded-full hover:bg-[var(--border-soft)] transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
