import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans, GeistMono } from "geist/font";
import { NavGate } from "./_components/nav-gate.js";
import "./globals.css";

const sans = GeistSans;
const mono = GeistMono;

export const metadata: Metadata = {
  title: "Creative Sports League — Where creative work becomes sport",
  description:
    "Time-boxed challenge sprints where emerging creatives compete on real briefs, get scored in public, and build a portfolio that proves it."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} csl-dark`}
      style={{
        ["--font-sans" as string]: "var(--font-geist-sans)",
        ["--font-mono" as string]: "var(--font-geist-mono)",
        ["--font-serif" as string]: "var(--font-geist-sans)",
      }}
    >
      <body>
        <NavGate>{children}</NavGate>
      </body>
    </html>
  );
}
