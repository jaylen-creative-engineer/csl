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
      <div className="flex items-center gap-3 p-4 bg-[var(--success)] text-[var(--primary-foreground)]">
        <span className="font-medium">Submission received! Good luck.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div>
        <label 
          htmlFor="participant-id" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Your Participant ID
        </label>
        <input
          id="participant-id"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          required
          placeholder="Your participant UUID"
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div>
        <label 
          htmlFor="artifact-url" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Artifact URL
        </label>
        <input
          id="artifact-url"
          type="url"
          value={artifactUrl}
          onChange={(e) => setArtifactUrl(e.target.value)}
          required
          placeholder="https://..."
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div>
        <label 
          htmlFor="mime-type" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          MIME Type (optional)
        </label>
        <input
          id="mime-type"
          value={mimeType}
          onChange={(e) => setMimeType(e.target.value)}
          placeholder="e.g. application/pdf, image/png"
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      <div>
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of your submission..."
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is-public"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-5 h-5 accent-[var(--primary)]"
        />
        <label htmlFor="is-public" className="text-sm text-[var(--muted-foreground)]">
          Make submission public (visible in leaderboard)
        </label>
      </div>

      {error && (
        <p className="text-sm text-[var(--destructive)]">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Submit Entry"}
      </button>
    </form>
  );
}
