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
      <p className="text-sm text-gray-500" data-testid="supabase-status-loading">
        Checking Supabase connection…
      </p>
    );
  }

  if (state.ok) {
    return (
      <p className="text-sm text-green-700" data-testid="supabase-status-ok">
        {state.message ?? "Supabase integration OK."}
      </p>
    );
  }

  return (
    <div className="text-sm text-red-700" data-testid="supabase-status-error">
      <p className="font-medium">Supabase check failed</p>
      {state.step ? <p className="mt-1">Step: {state.step}</p> : null}
      <p className="mt-1 font-mono text-xs">{state.error ?? "Unknown error"}</p>
    </div>
  );
}
