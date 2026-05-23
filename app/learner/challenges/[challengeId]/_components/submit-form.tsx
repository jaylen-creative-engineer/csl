"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  challengeId: string;
}

export function SubmitForm({ challengeId }: Props) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/v1/challenges/${challengeId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: participantId.trim(),
        artifact: {
          url: artifactUrl.trim(),
          mimeType: mimeType.trim() || undefined,
          description: description.trim() || undefined,
        },
        isPublic,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? "Submission failed.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.refresh(), 1500);
  }

  if (success) {
    return (
      <div style={{ padding: "1rem", background: "#dcfce7", borderRadius: "0.75rem", color: "#15803d", fontWeight: 500 }}>
        Submission received! Good luck.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
      <div>
        <label style={labelStyle} htmlFor="participant-id">Your Participant ID</label>
        <input
          id="participant-id"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          required
          placeholder="Your participant UUID"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="artifact-url">Artifact URL</label>
        <input
          id="artifact-url"
          type="url"
          value={artifactUrl}
          onChange={(e) => setArtifactUrl(e.target.value)}
          required
          placeholder="https://..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="mime-type">MIME Type (optional)</label>
        <input
          id="mime-type"
          value={mimeType}
          onChange={(e) => setMimeType(e.target.value)}
          placeholder="e.g. application/pdf, image/png"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of your submission..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          id="is-public"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          style={{ width: "1rem", height: "1rem" }}
        />
        <label htmlFor="is-public" style={{ fontSize: "0.875rem", color: "#374151" }}>
          Make submission public (visible in leaderboard)
        </label>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? "Submitting..." : "Submit Entry"}
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
