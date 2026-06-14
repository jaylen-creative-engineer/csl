"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HeroScene } from "./hero-scene.js";
import "./landing.css";

const PRELOADER_WORDS = ["Compete", "Create", "Score", "Showcase"];
const PRELOADER_MS = 1600;

const MENU_LINKS = [
  { index: "01", label: "Compete", href: "/learner" },
  { index: "02", label: "Host", href: "/host" },
  { index: "03", label: "Judge", href: "/judge" },
  { index: "04", label: "Sponsor", href: "/sponsor" },
  { index: "05", label: "Showcase", href: "/learner/portfolio" }
] as const;

const STATS = [
  { value: "06", label: "Creative disciplines" },
  { value: "72h", label: "Time-boxed sprint windows" },
  { value: "100%", label: "Public, scored submissions" },
  { value: "S/01", label: "Season now enrolling" }
] as const;

export function LandingPage() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  /* Dark document chrome while the landing is mounted */
  useEffect(() => {
    document.documentElement.classList.add("csl-dark");
    return () => document.documentElement.classList.remove("csl-dark");
  }, []);

  /* Preloader count */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(100);
      setReady(true);
      return;
    }
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / PRELOADER_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setReady(true), 250);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  /* Scroll-triggered reveals + top progress bar */
  useEffect(() => {
    if (!ready) return;

    const revealed = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18 }
    );
    revealed.forEach((el) => observer.observe(el));

    const onScroll = () => {
      const bar = progressBarRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [ready]);

  /* Lock scroll while the menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const word = PRELOADER_WORDS[
    Math.min(
      Math.floor((progress / 100) * PRELOADER_WORDS.length),
      PRELOADER_WORDS.length - 1
    )
  ];

  const HALFTONE_DOTS = 32;
  const dotsFilled = Math.round((progress / 100) * HALFTONE_DOTS);

  return (
    <div className={`lp${ready ? " ready" : ""}`}>
      {/* ── Blueprint welcome / boot sequence ─────── */}
      <div className={`lp-preloader${ready ? " done" : ""}`} aria-hidden={ready}>
        <span className="lp-cross lp-cross--tl" aria-hidden="true" />
        <span className="lp-cross lp-cross--tr" aria-hidden="true" />
        <span className="lp-cross lp-cross--bl" aria-hidden="true" />
        <span className="lp-cross lp-cross--br" aria-hidden="true" />

        <div className="lp-pre-grid">
          <div className="lp-pre-stamp">
            <strong>Creative Sports League</strong>
            <span>Obsess the craft — ©2026</span>
            <span>EHQ / Field Manual · Season 01</span>
          </div>
          <div className="lp-pre-coords">
            <span>40°49.281′N</span>
            <span>73°55.764′W</span>
            <span>FIG.00 — BOOT</span>
          </div>
        </div>

        <div className="lp-pre-center">
          <span className="lp-pre-word">{word}</span>
          <div className="lp-pre-dots" aria-hidden="true">
            {Array.from({ length: HALFTONE_DOTS }).map((_, i) => (
              <i key={i} className={i < dotsFilled ? "on" : ""} />
            ))}
          </div>
        </div>

        <div className="lp-pre-meter" aria-hidden="true">
          <span className="lp-pre-dim">{"|<"}</span>
          <span className="lp-preloader-count">
            {String(progress).padStart(3, "0")}
            <i>%</i>
          </span>
          <span className="lp-pre-dim">{">|"}</span>
        </div>
      </div>

      {/* ── Backdrop ──────────────────────────────── */}
      <div className="lp-backdrop" aria-hidden="true" />
      <div className="lp-halftone" aria-hidden="true" />
      <HeroScene />

      {/* ── Persistent blueprint frame ────────────── */}
      <div className="lp-frame" aria-hidden="true">
        <span className="lp-cross lp-cross--tl" />
        <span className="lp-cross lp-cross--tr" />
        <span className="lp-cross lp-cross--bl" />
        <span className="lp-cross lp-cross--br" />
        <span className="lp-frame-coord lp-frame-coord--l">
          40°49.281′N · 73°55.764′W
        </span>
        <span className="lp-frame-coord lp-frame-coord--r">
          CSL · SEASON 01 · FIG.01
        </span>
      </div>

      {/* ── Scroll progress ───────────────────────── */}
      <div className="lp-progress" aria-hidden="true">
        <div ref={progressBarRef} className="lp-progress-bar" />
      </div>

      {/* ── Navigation ────────────────────────────── */}
      <header className="lp-nav">
        <Link href="/" className="lp-wordmark" aria-label="Creative Sports League home">
          CSL<span>®</span>
        </Link>
        <p className="lp-nav-tag">Creative Sports League — Season 01</p>
        <div className="lp-nav-actions">
          <Link href="/login" className="lp-nav-link">
            Sign in
          </Link>
          <button
            type="button"
            className={`lp-menu-btn${menuOpen ? " open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="lp-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="lp-menu-label">{menuOpen ? "Close" : "Menu"}</span>
            <span className="lp-menu-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>

      {/* ── Overlay menu ──────────────────────────── */}
      <nav id="lp-menu" className={`lp-menu${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <ol className="lp-menu-list">
          {MENU_LINKS.map((link, i) => (
            <li key={link.href} style={{ transitionDelay: menuOpen ? `${0.08 + i * 0.06}s` : "0s" }}>
              <Link href={link.href} onClick={() => setMenuOpen(false)}>
                <span className="lp-menu-index">{link.index}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ol>
        <div className="lp-menu-foot">
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
          <span>Season 01 — Now enrolling</span>
        </div>
      </nav>

      <main className="lp-main">
        {/* ── Hero ──────────────────────────────── */}
        <section className="lp-hero">
          <span className="lp-annot lp-annot--hero-top" aria-hidden="true">
            FIG.01 — THE FIELD
          </span>
          <span className="lp-annot lp-annot--hero-side" aria-hidden="true">
            ↳ 06 disciplines / 72h sprint window
          </span>
          <p className="lp-kicker lp-hero-kicker">
            <span className="lp-dot" aria-hidden="true" />
            Creative Sports League — Season 01
          </p>
          <h1 className="lp-hero-title">
            <span className="mask"><span className="line">Where creative</span></span>
            <span className="mask"><span className="line">work becomes</span></span>
            <span className="mask">
              <span className="line">
                <em className="lp-grad">sport.</em>
              </span>
            </span>
          </h1>
          <div className="lp-hero-foot">
            <p className="lp-hero-sub">
              Time-boxed challenge sprints where emerging creatives compete on
              real briefs, get scored in public, and build a portfolio that
              proves it.
            </p>
            <div className="lp-hero-ctas">
              <Link href="/learner" className="lp-btn">
                Enter the league
              </Link>
              <a href="#compete" className="lp-btn ghost">
                How it works
              </a>
            </div>
          </div>
          <div className="lp-scroll-cue" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        {/* ── Manifesto (editorial statement) ───── */}
        <section className="lp-manifesto" data-reveal>
          <div className="lp-manifesto-head">
            <p className="lp-kicker">
              <span className="lp-dot" aria-hidden="true" />
              The thesis
            </p>
            <span className="lp-annot" aria-hidden="true">FIG.02 — DOCTRINE</span>
          </div>
          <h2 className="lp-manifesto-title">
            <span className="mask"><span className="line">Discipline builds</span></span>
            <span className="mask"><span className="line lp-stroke">craft.</span></span>
            <span className="mask">
              <span className="line lp-rainbow-text">Competition builds careers.</span>
            </span>
          </h2>
          <div className="lp-manifesto-foot">
            <p className="lp-manifesto-body">
              No follower counts. No gatekeepers. Just real briefs, public
              submissions, and scores that compound into a record of proof.
            </p>
            <div className="lp-chevrons" aria-hidden="true">
              <span className="lp-chevron lp-chevron--blue" />
              <span className="lp-chevron lp-chevron--red" />
              <span className="lp-chevron lp-chevron--yellow" />
            </div>
          </div>
        </section>

        {/* ── Chapters ──────────────────────────── */}
        <Chapter
          id="compete"
          index="01"
          word="Compete"
          title={
            <>
              <span className="mask"><span className="line">Prove it</span></span>
              <span className="mask"><span className="line"><em>in public.</em></span></span>
            </>
          }
          body="Time-boxed sprints built on real prompts. Submissions are public, outputs are scored, and the leaderboard doesn't care about your follower count. Your work speaks for itself."
          cta={{ label: "Explore challenges", href: "/learner" }}
        />

        <Chapter
          id="host"
          index="02"
          word="Host"
          title={
            <>
              <span className="mask"><span className="line">Run the league</span></span>
              <span className="mask"><span className="line">you wish <em>existed.</em></span></span>
            </>
          }
          body="Hosts manage cohorts, configure challenges, invite participants, and publish results. Build a community around your craft — and become a grassroots distribution engine for new talent."
          cta={{ label: "Start a league", href: "/host" }}
        />

        <Chapter
          id="judge"
          index="03"
          word="Judge"
          title={
            <>
              <span className="mask"><span className="line">Every rep</span></span>
              <span className="mask"><span className="line">gets <em>judged.</em></span></span>
            </>
          }
          body="Transparent criteria. Real feedback from working professionals. Scores map to skill domains, not vibes — so every sprint makes you measurably better."
          cta={{ label: "Judge a sprint", href: "/judge" }}
        />

        <Chapter
          id="sponsor"
          index="04"
          word="Sponsor"
          title={
            <>
              <span className="mask"><span className="line">Talent, discovered</span></span>
              <span className="mask"><span className="line"><em>mid-game.</em></span></span>
            </>
          }
          body="Embed your brief inside a live challenge and watch the field respond. Discover top performers before anyone else does — and turn creative competition into a talent pipeline."
          cta={{ label: "Sponsor a sprint", href: "/sponsor" }}
        />

        <Chapter
          id="showcase"
          index="05"
          word="Showcase"
          title={
            <>
              <span className="mask"><span className="line">Your portfolio</span></span>
              <span className="mask"><span className="line">is your <em>record.</em></span></span>
            </>
          }
          body="Every scored public submission becomes part of a living portfolio. Skill signals compound over time, and top performers get surfaced to the people looking for them."
          cta={{ label: "See the showcase", href: "/learner/portfolio" }}
        />

        {/* ── Stats ─────────────────────────────── */}
        <section className="lp-stats" data-reveal>
          {STATS.map((stat, i) => (
            <div key={stat.label} className="lp-stat">
              <span className="lp-stat-index">
                {String(i + 1).padStart(2, "0")} /
              </span>
              <span className="lp-stat-value">{stat.value}</span>
              <span className="lp-stat-label">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* ── Marquee ───────────────────────────── */}
        <section className="lp-marquee" aria-hidden="true">
          <div className="lp-marquee-track">
            {[0, 1].map((copy) => (
              <span key={copy} className="lp-marquee-copy">
                Compete <i>—</i> Create <i>—</i> Score <i>—</i> Showcase{" "}
                <i>—</i> Repeat <i>—</i>{" "}
              </span>
            ))}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────── */}
        <section className="lp-cta" data-reveal>
          <p className="lp-kicker">
            <span className="lp-dot" aria-hidden="true" />
            Join Season 01
          </p>
          <h2 className="lp-cta-title">
            <span className="mask"><span className="line">The season</span></span>
            <span className="mask"><span className="line"><em>is open.</em></span></span>
          </h2>
          <div className="lp-cta-actions">
            <Link href="/learner" className="lp-btn">
              Enter as a creative
            </Link>
            <Link href="/host" className="lp-btn ghost">
              Host a league
            </Link>
            <Link href="/sponsor" className="lp-btn ghost">
              Sponsor a sprint
            </Link>
          </div>
        </section>

        {/* ── Footer ────────────────────────────── */}
        <div className="lp-stamps" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy} className="lp-stamps-row">
              <i>Obsess the craft ©2026</i>
              <i>40°49.281′N 73°55.764′W</i>
              <i>CSL Field Office</i>
              <i>EHQ / Season 01</i>
              <i>Fig.01 — The Field</i>
            </span>
          ))}
        </div>
        <footer className="lp-footer">
          <span className="lp-footer-brand">
            CSL<span>®</span> — Creative Sports League
          </span>
          <nav className="lp-footer-links" aria-label="Footer">
            {MENU_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/login">Sign in</Link>
          </nav>
          <span className="lp-footer-copy">© 2026 — All work remains the maker's.</span>
        </footer>
      </main>
    </div>
  );
}

/* ── Chapter section ─────────────────────────── */

type ChapterProps = {
  id: string;
  index: string;
  word: string;
  title: ReactNode;
  body: string;
  cta: { label: string; href: string };
};

function Chapter({ id, index, word, title, body, cta }: ChapterProps) {
  return (
    <section id={id} className="lp-chapter" data-reveal>
      <div className="lp-chapter-meta">
        <span className="lp-chapter-index">{index}</span>
        <span className="lp-chapter-word">{word}</span>
      </div>
      <div className="lp-chapter-content">
        <h2 className="lp-chapter-title">{title}</h2>
        <p className="lp-chapter-body">{body}</p>
        <Link href={cta.href} className="lp-arrow-link">
          {cta.label}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </section>
  );
}
