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
      <div style={{ padding: "0.75rem 1rem", background: "#dcfce7", borderRadius: "0.5rem", color: "#15803d", fontWeight: 500 }}>
        Enrolled successfully!
      </div>
    );
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        style={btnStyle}
      >
        Enroll in League
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <input
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          placeholder="Your participant UUID"
          style={inputStyle}
          autoFocus
        />
        {error && <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.25rem" }}>{error}</p>}
      </div>
      <button onClick={handleEnroll} disabled={loading} style={btnStyle}>
        {loading ? "Enrolling..." : "Confirm Enroll"}
      </button>
      <button
        onClick={() => { setShowInput(false); setError(null); }}
        style={{ ...btnStyle, background: "#f3f4f6", color: "#374151" }}
      >
        Cancel
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "0.5rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "0.5rem",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};
