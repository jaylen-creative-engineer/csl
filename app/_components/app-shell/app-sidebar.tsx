"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: { type: "live" | "accent" | "muted"; text: string };
  match?: (pathname: string) => boolean;
};

const competeLinks: NavItem[] = [
  {
    href: "/learner",
    label: "Dashboard",
    match: (p) => p === "/learner",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/learner/sprints",
    label: "Sprints",
    match: (p) =>
      p.startsWith("/learner/sprints") ||
      p.startsWith("/learner/challenges") ||
      (p.startsWith("/learner/") && p !== "/learner" && !p.startsWith("/learner/portfolio")),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="12" y1="14" x2="12" y2="9" />
        <circle cx="12" cy="14" r="8" />
      </svg>
    ),
    badge: { type: "live", text: "LIVE" },
  },
  {
    href: "/learner/portfolio",
    label: "Showcase",
    match: (p) => p.startsWith("/learner/portfolio"),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </svg>
    ),
  },
];

const operateLinks: NavItem[] = [
  { href: "/host", label: "Host", match: (p) => p.startsWith("/host"), icon: <span style={{ fontSize: 11, fontWeight: 700 }}>H</span> },
  { href: "/judge", label: "Judge", match: (p) => p.startsWith("/judge"), icon: <span style={{ fontSize: 11, fontWeight: 700 }}>J</span> },
  { href: "/sponsor", label: "Sponsor", match: (p) => p.startsWith("/sponsor"), icon: <span style={{ fontSize: 11, fontWeight: 700 }}>S</span> },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div>
      <p className="app-nav-group-label">{label}</p>
      <div className="app-nav-links">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.href);
          return (
            <Link
              key={`${label}-${item.label}`}
              href={item.href}
              className={`app-nav-link${active ? " active" : ""}`}
            >
              <span className="app-nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className={`app-nav-badge ${item.badge.type}`}>{item.badge.text}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type AppSidebarProps = {
  handle?: string;
  discipline?: string;
};

export function AppSidebar({ handle, discipline }: AppSidebarProps) {
  const initials = handle
    ? handle.slice(0, 2).toUpperCase()
    : "CS";

  return (
    <aside className="app-sidebar">
      <Link href="/learner" className="app-brand">
        <span className="app-brand-mark">
          <i />
        </span>
        <span className="app-brand-text">
          <span className="app-brand-name">
            CSL<sup>®</sup>
          </span>
          <span className="app-brand-tag">Creative Sports League</span>
        </span>
      </Link>

      <nav className="app-nav">
        <NavGroup label="Compete" items={competeLinks} />
        <NavGroup label="Operate" items={operateLinks} />
      </nav>

      <div className="app-user">
        <span className="app-user-avatar">{initials}</span>
        <span className="app-user-meta">
          <span className="app-user-handle">{handle ? `@${handle}` : "Guest maker"}</span>
          <span className="app-user-sub">{discipline ?? "Season 01"}</span>
        </span>
      </div>
    </aside>
  );
}
