"use client";

import { useState } from "react";

interface Props {
  leagueId: string;
}

export function EnrollButton({ leagueId }: Props) {
  const [participantId, setParticipantId] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleEnroll() {
    if (!participantId.trim()) {
      setError("Please enter your participant ID.");
      return;
    }
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/v1/leagues/${leagueId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: participantId.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? "Enrollment failed.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] text-[var(--primary-foreground)] rounded-full">
        <span className="text-sm font-medium">Enrolled successfully!</span>
      </div>
    );
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
      >
        Enroll in League
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="flex-1 min-w-[200px]">
        <input
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          placeholder="Your participant UUID"
          autoFocus
          className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
        {error && (
          <p className="text-xs text-[var(--destructive)] mt-1">{error}</p>
        )}
      </div>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Enrolling..." : "Confirm"}
      </button>
      <button
        onClick={() => { setShowInput(false); setError(null); }}
        className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-[var(--foreground)] bg-[var(--secondary)] rounded-full hover:bg-[var(--border-soft)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
