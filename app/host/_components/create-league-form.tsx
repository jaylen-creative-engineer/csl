"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateLeagueForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [hostId, setHostId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/v1/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), hostId: hostId.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? "Failed to create league");
      return;
    }

    setSuccess(true);
    setName("");
    setHostId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 max-w-md">
      <div>
        <label 
          htmlFor="league-name" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          League Name
        </label>
        <input
          id="league-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Spring Design Cohort"
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>
      
      <div>
        <label 
          htmlFor="host-id" 
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Host ID
        </label>
        <input
          id="host-id"
          value={hostId}
          onChange={(e) => setHostId(e.target.value)}
          required
          placeholder="Your host UUID"
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--destructive)]">{error}</p>
      )}
      
      {success && (
        <p className="text-sm text-[var(--success)]">League created!</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating..." : "Create League"}
      </button>
    </form>
  );
}
