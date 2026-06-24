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
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <div className="app-field">
        <label htmlFor="league-name" className="app-label">League name</label>
        <input
          id="league-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Spring Design Cohort"
          className="app-input"
        />
      </div>

      <div className="app-field">
        <label htmlFor="host-id" className="app-label">Host ID</label>
        <input
          id="host-id"
          value={hostId}
          onChange={(e) => setHostId(e.target.value)}
          required
          placeholder="Your host UUID"
          className="app-input"
        />
      </div>

      {error && <p className="app-error">{error}</p>}
      {success && <p style={{ color: "var(--app-accent)", fontSize: 13 }}>League created.</p>}

      <button type="submit" disabled={loading} className="app-btn" style={{ marginTop: 8 }}>
        {loading ? "Creating…" : "Create league →"}
      </button>
    </form>
  );
}
