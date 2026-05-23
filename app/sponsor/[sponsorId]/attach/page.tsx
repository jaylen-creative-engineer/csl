"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

interface Props {
  params: Promise<{ sponsorId: string }>;
}

export default function SponsorAttachPage({ params }: Props) {
  const { sponsorId } = use(params);
  const router = useRouter();

  const [challengeId, setChallengeId] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState(""); // newline-separated
  const [prize, setPrize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const deliverablesList = deliverables
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    const res = await fetch(`/api/v1/sponsors/${sponsorId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: challengeId.trim(),
        brief: {
          headline: headline.trim(),
          description: description.trim(),
          deliverables: deliverablesList,
          prize: prize.trim() || undefined,
        },
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? "Failed to attach brief.");
      return;
    }

    router.push(`/sponsor/${sponsorId}`);
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/sponsor/${sponsorId}`} style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>
        Attach Sponsor Brief
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
        <div>
          <label style={labelStyle} htmlFor="challenge-id">Challenge ID</label>
          <input
            id="challenge-id"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            required
            placeholder="Target challenge UUID"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="headline">Headline</label>
          <input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            required
            placeholder="e.g. Design the Future of Sport Media"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe what you're looking for and why..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="deliverables">
            Deliverables
            <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              (one per line)
            </span>
          </label>
          <textarea
            id="deliverables"
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            rows={4}
            placeholder={"Brand logo pack\nStyle guide PDF\nColor palette"}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="prize">Prize (optional)</label>
          <input
            id="prize"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="e.g. $500 gift card, internship opportunity"
            style={inputStyle}
          />
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Attaching..." : "Attach Brief"}
          </button>
          <Link
            href={`/sponsor/${sponsorId}`}
            style={{ ...btnStyle, background: "#f3f4f6", color: "#374151", textDecoration: "none", display: "inline-block", textAlign: "center" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.35rem",
  color: "#374151",
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
