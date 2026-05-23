"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MeData {
  user: { id: string; email?: string };
  participant: { id: string; handle: string };
}

export function Nav() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeData | null) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/"
        style={{ fontWeight: 700, fontSize: "1.1rem", textDecoration: "none", color: "#111" }}
      >
        CSL
      </Link>

      <Link href="/learner" style={navLinkStyle}>
        Learner
      </Link>
      <Link href="/host" style={navLinkStyle}>
        Host
      </Link>
      <Link href="/judge" style={navLinkStyle}>
        Judge
      </Link>
      <Link href="/sponsor" style={navLinkStyle}>
        Sponsor
      </Link>

      <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#6b7280" }}>
        {loading
          ? "Loading..."
          : me
          ? `${me.participant.handle} (${me.user.email ?? me.user.id})`
          : <Link href="/login" style={{ color: "#2563eb" }}>Sign in</Link>}
      </span>
    </nav>
  );
}

const navLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#374151",
  fontSize: "0.9rem",
};
