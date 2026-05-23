"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  challengeId: string;
  status: string;
}

export function LifecycleButtons({ challengeId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transition(action: "open" | "judging" | "complete") {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/v1/challenges/${challengeId}/${action}`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? `Failed to transition to ${action}.`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {status === "draft" && (
          <button
            onClick={() => transition("open")}
            disabled={loading}
            style={{ ...btnStyle, background: "#16a34a" }}
          >
            Open for Submissions
          </button>
        )}
        {status === "open" && (
          <button
            onClick={() => transition("judging")}
            disabled={loading}
            style={{ ...btnStyle, background: "#d97706" }}
          >
            Move to Judging
          </button>
        )}
        {status === "judging" && (
          <button
            onClick={() => transition("complete")}
            disabled={loading}
            style={{ ...btnStyle, background: "#6b7280" }}
          >
            Mark Complete
          </button>
        )}
        {status === "complete" && (
          <span style={{ fontSize: "0.875rem", color: "#6b7280", fontStyle: "italic" }}>
            This challenge is complete.
          </span>
        )}
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  color: "#fff",
  border: "none",
  borderRadius: "0.5rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
};
