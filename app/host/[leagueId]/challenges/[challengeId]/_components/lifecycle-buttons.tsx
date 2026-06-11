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
      <div className="flex flex-wrap gap-3">
        {status === "draft" && (
          <button
            onClick={() => transition("open")}
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--success)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Open for Submissions
          </button>
        )}
        {status === "open" && (
          <button
            onClick={() => transition("judging")}
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Move to Judging
          </button>
        )}
        {status === "judging" && (
          <button
            onClick={() => transition("complete")}
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[var(--foreground)] bg-[var(--border)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Mark Complete
          </button>
        )}
        {status === "complete" && (
          <span className="text-sm text-[var(--muted-foreground)] italic">
            This challenge is complete.
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-[var(--destructive)] mt-3">{error}</p>
      )}
    </div>
  );
}
