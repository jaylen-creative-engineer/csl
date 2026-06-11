export default function SponsorIndexPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">
            Sponsor Portal
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            View your attachments, outcome signals, and attach briefs to challenges.
          </p>
        </header>

        {/* Access Form */}
        <div className="p-8 bg-[var(--secondary)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Access Your Dashboard
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Enter your sponsor ID to view attachments and outcome signals.
          </p>
          
          <form method="GET" action="/sponsor/redirect" className="flex flex-wrap gap-3">
            <input
              name="sponsorId"
              required
              placeholder="Your sponsor UUID"
              className="flex-1 min-w-[220px] px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
            />
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </button>
          </form>
        </div>

        {/* Note */}
        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          Note: A listing endpoint would enable automatic session-based routing here.
        </p>
      </div>
    </main>
  );
}
