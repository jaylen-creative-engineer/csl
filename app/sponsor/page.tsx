import Link from "next/link";

// The sponsor page requires a sponsor ID. Since GET /api/v1/sponsors (list) does not exist,
// we prompt the user to enter their sponsor ID, then redirect to the sponsor detail page.

export default function SponsorIndexPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Sponsor Portal
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        View your attachments, outcome signals, and attach briefs to challenges.
      </p>

      <div style={{ padding: "1.5rem", background: "#f9fafb", borderRadius: "0.75rem", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Access Your Sponsor Dashboard</h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
          Enter your sponsor ID to view attachments and outcome signals.
        </p>
        <form method="GET" action="/sponsor/redirect" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            name="sponsorId"
            required
            placeholder="Your sponsor UUID"
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.95rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to Dashboard
          </button>
        </form>
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#9ca3af" }}>
        <p>
          Note: A <code>GET /api/v1/sponsors</code> listing endpoint would enable automatic session-based routing here.
        </p>
      </div>
    </main>
  );
}
