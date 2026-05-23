import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "./_components/nav.js";

export const metadata: Metadata = {
  title: "Creative Sports League",
  description: "Structured challenge sprints for emerging creatives"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
