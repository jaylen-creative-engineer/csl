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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
      <div>
        <label style={labelStyle} htmlFor="league-name">League Name</label>
        <input
          id="league-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Spring Design Cohort"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="host-id">Host ID</label>
        <input
          id="host-id"
          value={hostId}
          onChange={(e) => setHostId(e.target.value)}
          required
          placeholder="Your host UUID"
          style={inputStyle}
        />
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}
      {success && <p style={{ color: "#16a34a", fontSize: "0.875rem" }}>League created!</p>}
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? "Creating..." : "Create League"}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.25rem",
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
