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
      <div className="app-panel" style={{ borderColor: "rgba(216,255,61,0.35)", background: "rgba(216,255,61,0.08)" }}>
        <p style={{ margin: 0, fontWeight: 600, color: "var(--app-accent)" }}>Submission received. Good luck.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="app-dropzone">
        <p>[ paste artifact URL below — file upload coming soon ]</p>
        <small>URL to your work · video, image, or live link</small>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        <div className="app-field" style={{ flex: 1, minWidth: 200, margin: 0 }}>
          <input
            id="artifact-url"
            type="url"
            value={artifactUrl}
            onChange={(e) => setArtifactUrl(e.target.value)}
            required
            placeholder="Artifact URL"
            className="app-input"
          />
        </div>
        <div className="app-field" style={{ flex: 1, minWidth: 200, margin: 0 }}>
          <input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One-line description"
            className="app-input"
          />
        </div>
      </div>

      <div className="app-field" style={{ marginTop: 16 }}>
        <label htmlFor="participant-id" className="app-label">Your participant ID</label>
        <input
          id="participant-id"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          required
          placeholder="Your participant UUID"
          className="app-input"
        />
      </div>

      <div className="app-field">
        <label htmlFor="mime-type" className="app-label">MIME type (optional)</label>
        <input
          id="mime-type"
          value={mimeType}
          onChange={(e) => setMimeType(e.target.value)}
          placeholder="e.g. video/mp4"
          className="app-input"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(242,241,237,0.1)" }}>
        <label htmlFor="is-public" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(242,241,237,0.56)", cursor: "pointer" }}>
          <input
            id="is-public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ accentColor: "var(--app-accent)" }}
          />
          Submit publicly
        </label>
        <button type="submit" disabled={loading} className="app-btn">
          {loading ? "Submitting…" : "Submit entry →"}
        </button>
      </div>

      {error && <p className="app-error" style={{ marginTop: 12 }}>{error}</p>}
    </form>
  );
}
