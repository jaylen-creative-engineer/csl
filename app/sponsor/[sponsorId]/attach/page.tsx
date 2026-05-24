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
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/sponsor/${sponsorId}`}
          className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <span className="mr-2">←</span> Back to Dashboard
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase mb-8">
          Attach Sponsor Brief
        </h1>

        <div className="p-8 bg-[var(--secondary)]">
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div>
              <label 
                htmlFor="challenge-id" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Challenge ID
              </label>
              <input
                id="challenge-id"
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value)}
                required
                placeholder="Target challenge UUID"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </div>

            <div>
              <label 
                htmlFor="headline" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Headline
              </label>
              <input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
                placeholder="e.g. Design the Future of Sport Media"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </div>

            <div>
              <label 
                htmlFor="description" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe what you're looking for and why..."
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors resize-y"
              />
            </div>

            <div>
              <label 
                htmlFor="deliverables" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Deliverables <span className="text-[var(--muted-foreground)] font-normal">(one per line)</span>
              </label>
              <textarea
                id="deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                rows={4}
                placeholder={"Brand logo pack\nStyle guide PDF\nColor palette"}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors resize-y"
              />
            </div>

            <div>
              <label 
                htmlFor="prize" 
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Prize (optional)
              </label>
              <input
                id="prize"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="e.g. $500 gift card, internship opportunity"
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Attaching..." : "Attach Brief"}
              </button>
              <Link
                href={`/sponsor/${sponsorId}`}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--background)] rounded-full hover:bg-[var(--border-soft)] transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
