"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell/app-shell.js";

const STANDALONE_ROUTES = new Set(["/"]);

type NavGateProps = {
  children: ReactNode;
};

/**
 * Landing ships its own navigation; in-app routes use the editorial shell.
 */
export function NavGate({ children }: NavGateProps) {
  const pathname = usePathname();

  if (STANDALONE_ROUTES.has(pathname) || pathname.startsWith("/enter")) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
