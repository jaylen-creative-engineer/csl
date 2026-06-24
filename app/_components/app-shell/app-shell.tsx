"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar.js";
import "./app.css";

interface MeData {
  user: { id: string; email?: string };
  participant: { id: string; handle: string; discipline?: string };
}

type AppShellProps = {
  children: ReactNode;
};

function crumbForPath(pathname: string): string {
  if (pathname === "/learner") return "Dashboard";
  if (pathname.startsWith("/learner/sprints")) return "Sprints";
  if (pathname.startsWith("/learner/portfolio")) return "Showcase";
  if (pathname.startsWith("/learner/challenges")) return "Sprint";
  if (pathname.startsWith("/learner/")) return "League";
  if (pathname === "/host") return "Host";
  if (pathname.startsWith("/host/")) return "League Admin";
  if (pathname === "/judge") return "Judge";
  if (pathname.startsWith("/judge/")) return "Scoring";
  if (pathname === "/sponsor") return "Sponsor";
  if (pathname.startsWith("/sponsor/")) return "Sponsor";
  return "App";
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [me, setMe] = useState<MeData | null>(null);

  useEffect(() => {
    fetch("/api/v1/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeData | null) => setMe(data))
      .catch(() => undefined);
  }, []);

  const crumb = crumbForPath(pathname);
  const ctaHref = pathname.startsWith("/host")
    ? "/host"
    : pathname.startsWith("/judge")
      ? "/judge"
      : pathname.startsWith("/sponsor")
        ? "/sponsor"
        : "/learner/sprints";

  const ctaLabel = pathname.startsWith("/host")
    ? "＋ New league"
    : pathname.startsWith("/judge")
      ? "Open queue"
      : pathname.startsWith("/sponsor")
        ? "Attach brief"
        : "＋ Enter a sprint";

  return (
    <div className="app">
      <AppSidebar
        handle={me?.participant.handle}
        discipline={me?.participant.discipline}
      />

      <div className="app-main-col">
        <header className="app-topbar">
          <span className="app-crumb">CSL / {crumb}</span>
          <div className="app-search" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(242,241,237,0.4)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Search leagues, sprints, makers</span>
            <kbd>⌘K</kbd>
          </div>
          <span className="app-live-pill">Sprint live</span>
          <Link href={ctaHref} className="app-btn sm">
            {ctaLabel}
          </Link>
        </header>

        <div className="app-body">
          <div className="app-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
