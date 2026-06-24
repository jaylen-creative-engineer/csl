"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../../_components/app-shell/app.css";

const ROLES = [
  { id: "compete", idx: "01", label: "Compete", sub: "Enter sprints, get scored, build proof.", href: "/learner" },
  { id: "host", idx: "02", label: "Host", sub: "Run a league and a cohort.", href: "/host" },
  { id: "judge", idx: "03", label: "Judge", sub: "Score real work, real criteria.", href: "/judge" },
  { id: "sponsor", idx: "04", label: "Sponsor", sub: "Embed a brief, discover talent.", href: "/sponsor" },
] as const;

const DISCIPLINES = ["Design", "Film", "Code", "Writing", "Motion", "Sound"];
const HORIZONS = ["Season 01", "12 months", "Open-ended"];

export function IntakePage() {
  const router = useRouter();
  const [role, setRole] = useState("compete");
  const [intent, setIntent] = useState("Motion");
  const [horizon, setHorizon] = useState("Season 01");

  const selectedRole = ROLES.find((r) => r.id === role) ?? ROLES[0];

  const enter = () => {
    router.push(selectedRole.href);
  };

  return (
    <div className="app-intake">
      <span className="app-intake-cross tl" aria-hidden>+</span>
      <span className="app-intake-cross tr" aria-hidden>+</span>
      <span className="app-intake-cross bl" aria-hidden>+</span>
      <span className="app-intake-cross br" aria-hidden>+</span>

      <header className="app-intake-header">
        <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "0.03em" }}>
          CSL<sup style={{ fontSize: "0.55em", verticalAlign: "super", color: "#d8ff3d" }}>®</sup>
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(242,241,237,0.4)" }}>
          FIG.00 — Intake · Season 01
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(242,241,237,0.32)" }}>
          40°49.281′N · 73°55.764′W
        </span>
      </header>

      <div className="app-intake-grid">
        <div className="app-intake-inner">
          <div>
            <p className="app-kicker pulse" style={{ marginBottom: 26 }}>
              You&apos;re in. Set your line of play.
            </p>
            <h1 className="app-intake-title">
              Enter the
              <br />
              league as
              <br />
              a <em>maker.</em>
            </h1>
            <p className="app-muted" style={{ marginTop: 34, maxWidth: "38ch", fontSize: 15, lineHeight: 1.7 }}>
              Two steps to a working season. Pick how you&apos;ll play, declare the skill you&apos;re here to master, and we&apos;ll line up your first sprint.
            </p>

            <div style={{ marginTop: 40 }}>
              <div className="app-step">
                <span className="app-step-idx">01</span>
                <span style={{ fontSize: 13, color: "rgba(242,241,237,0.78)" }}>Choose your role</span>
                <span className="app-step-line" />
              </div>
              <div className="app-step">
                <span className="app-step-idx">02</span>
                <span style={{ fontSize: 13, color: "rgba(242,241,237,0.78)" }}>Declare skill intent</span>
                <span className="app-step-line" />
              </div>
            </div>
          </div>

          <div className="app-intake-card">
            <span style={{ position: "absolute", top: 14, right: 16, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(242,241,237,0.3)" }}>
              INTAKE / 02
            </span>

            <p className="app-section-label" id="intake-role-label">01 — Role</p>
            <div className="app-role-grid" role="radiogroup" aria-labelledby="intake-role-label">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={role === r.id}
                  className={`app-role-btn${role === r.id ? " active" : ""}`}
                  onClick={() => setRole(r.id)}
                >
                  <span className="app-role-btn-head">
                    <strong>{r.label}</strong>
                    <span>{r.idx}</span>
                  </span>
                  <small>{r.sub}</small>
                </button>
              ))}
            </div>

            <p className="app-section-label" style={{ marginTop: 24 }} id="intake-skill-label">02 — Skill intent</p>
            <p className="app-label" style={{ marginBottom: 12 }} id="intake-discipline-prompt">I want to master</p>
            <div
              className="app-chip-row-btns"
              style={{ marginBottom: 22 }}
              role="radiogroup"
              aria-labelledby="intake-discipline-prompt"
            >
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={intent === d}
                  className={`app-chip-btn${intent === d ? " active" : ""}`}
                  onClick={() => setIntent(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="app-label" style={{ marginBottom: 12 }} id="intake-horizon-prompt">over a horizon of</p>
            <div className="app-chip-row-btns" role="radiogroup" aria-labelledby="intake-horizon-prompt">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={horizon === h}
                  className={`app-chip-btn mono${horizon === h ? " active" : ""}`}
                  onClick={() => setHorizon(h)}
                >
                  {h}
                </button>
              ))}
            </div>

            <button type="button" className="app-intake-submit" onClick={enter}>
              Enter the league →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
