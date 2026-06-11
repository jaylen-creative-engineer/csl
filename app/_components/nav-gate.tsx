"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./nav.js";

/**
 * The landing page ("/") ships its own designed navigation,
 * so the utility nav is hidden there and shown everywhere else.
 */
export function NavGate() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Nav />;
}
