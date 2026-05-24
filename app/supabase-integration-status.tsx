"use client";

import { useEffect, useState } from "react";

type Health = { ok: boolean; message?: string; error?: string; step?: string };

export function SupabaseIntegrationStatus() {
  const [state, setState] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/supabase/health")
      .then((r) => r.json() as Promise<Health>)
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === null) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]" data-testid="supabase-status-loading">
        Checking Supabase connection...
      </p>
    );
  }

  if (state.ok) {
    return (
      <div className="flex items-center gap-2" data-testid="supabase-status-ok">
        <span className="inline-block w-2 h-2 bg-[var(--success)] rounded-full" />
        <p className="text-sm text-[var(--success)]">
          {state.message ?? "Supabase integration OK"}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="supabase-status-error">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-[var(--destructive)] rounded-full" />
        <p className="text-sm font-medium text-[var(--destructive)]">Supabase check failed</p>
      </div>
      {state.step && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Step: {state.step}</p>
      )}
      <p className="mt-1 text-xs font-mono text-[var(--muted-foreground)]">
        {state.error ?? "Unknown error"}
      </p>
    </div>
  );
}
