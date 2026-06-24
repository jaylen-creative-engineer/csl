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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {status === "draft" && (
          <button type="button" onClick={() => transition("open")} disabled={loading} className="app-btn sm">
            Open for submissions
          </button>
        )}
        {status === "open" && (
          <button type="button" onClick={() => transition("judging")} disabled={loading} className="app-btn sm">
            Move to judging
          </button>
        )}
        {status === "judging" && (
          <button type="button" onClick={() => transition("complete")} disabled={loading} className="app-btn ghost sm">
            Mark complete
          </button>
        )}
        {status === "complete" && (
          <span className="app-muted" style={{ fontSize: 13, fontStyle: "italic" }}>
            This challenge is complete.
          </span>
        )}
      </div>
      {error && <p className="app-error" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
