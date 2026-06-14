"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MeData {
  user: { id: string; email?: string };
  participant: { id: string; handle: string };
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
      .then((data: MeData | null) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <nav className="csl-nav" aria-label="Primary">
      <Link href="/" className="csl-nav__brand">
        CSL<span className="csl-nav__mark">®</span>
      </Link>

      <div className="csl-nav__links">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`csl-nav__link${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="csl-nav__user">
        {loading ? (
          <span className="csl-nav__status">Syncing...</span>
        ) : me ? (
          <span className="csl-nav__status">
            {me.participant.handle}
          </span>
        ) : (
          <Link href="/login" className="csl-nav__cta">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
