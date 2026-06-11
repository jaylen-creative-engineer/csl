import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { NavGate } from "./_components/nav-gate.js";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap"
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

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
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <NavGate />
        {children}
      </body>
    </html>
  );
}
