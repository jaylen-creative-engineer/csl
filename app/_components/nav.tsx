"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MeData {
  user: { id: string; email?: string };
  participant: { id: string; handle: string };
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
}

const navLinks = [
  { href: "/learner", label: "Learner" },
  { href: "/host", label: "Host" },
  { href: "/judge", label: "Judge" },
  { href: "/sponsor", label: "Sponsor" },
];

export function Nav() {
  const pathname = usePathname();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ApiEnvelope<MeData> | null) => {
        setMe(data?.ok ? data.data ?? null : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-6 px-6 py-4 bg-[var(--background)] border-b border-[var(--border-soft)]">
      {/* Logo */}
      <Link
        href="/"
        className="text-lg font-bold tracking-tight text-[var(--foreground)] hover:opacity-70 transition-opacity"
      >
        CSL
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-4 py-2 text-sm font-medium transition-colors rounded-full
                ${isActive 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                }
              `}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* User Status */}
      <div className="ml-auto">
        {loading ? (
          <span className="text-sm text-[var(--muted-foreground)]">Loading...</span>
        ) : me ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted-foreground)]">
              {me.participant.handle}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
