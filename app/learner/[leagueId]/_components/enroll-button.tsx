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
      <span className="app-tag open">Enrolled</span>
    );
  }

  if (!showInput) {
    return (
      <button type="button" onClick={() => setShowInput(true)} className="app-btn sm">
        Enroll in league
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <input
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          placeholder="Your participant UUID"
          autoFocus
          className="app-input"
        />
        {error && <p className="app-error" style={{ marginTop: 6, fontSize: 12 }}>{error}</p>}
      </div>
      <button type="button" onClick={handleEnroll} disabled={loading} className="app-btn sm">
        {loading ? "Enrolling…" : "Confirm"}
      </button>
      <button type="button" onClick={() => { setShowInput(false); setError(null); }} className="app-btn ghost sm">
        Cancel
      </button>
    </div>
  );
}
