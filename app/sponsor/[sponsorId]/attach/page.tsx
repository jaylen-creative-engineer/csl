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
  const [deliverables, setDeliverables] = useState("");
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
    <>
      <Link href={`/sponsor/${sponsorId}`} className="app-back">← Dashboard</Link>
      <h1 className="app-title" style={{ marginBottom: 32 }}>Attach sponsor brief</h1>

      <div className="app-panel" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="app-field">
            <label htmlFor="challenge-id" className="app-label">Challenge ID</label>
            <input id="challenge-id" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} required placeholder="Target challenge UUID" className="app-input" />
          </div>
          <div className="app-field">
            <label htmlFor="headline" className="app-label">Headline</label>
            <input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} required placeholder="e.g. Design the Future of Sport Media" className="app-input" />
          </div>
          <div className="app-field">
            <label htmlFor="description" className="app-label">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="app-textarea" />
          </div>
          <div className="app-field">
            <label htmlFor="deliverables" className="app-label">Deliverables (one per line)</label>
            <textarea id="deliverables" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} className="app-textarea" />
          </div>
          <div className="app-field">
            <label htmlFor="prize" className="app-label">Prize (optional)</label>
            <input id="prize" value={prize} onChange={(e) => setPrize(e.target.value)} className="app-input" />
          </div>
          {error && <p className="app-error">{error}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
            <button type="submit" disabled={loading} className="app-btn">{loading ? "Attaching…" : "Attach brief →"}</button>
            <Link href={`/sponsor/${sponsorId}`} className="app-btn ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
