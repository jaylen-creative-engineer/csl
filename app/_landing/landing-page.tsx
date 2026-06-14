"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { HeroScene } from "./hero-scene.js";
import "./landing.css";

const PRELOADER_WORDS = ["COMPETE", "CREATE", "SCORE", "SHOWCASE"];
const PRELOADER_MS = 1600;
const HALFTONE_DOTS = 36;
const VISITED_KEY = "csl-booted";

/* Run before paint on the client (avoids a boot flash for return visits),
   while falling back to a no-op on the server. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const MENU_LINKS = [
  { index: "01", label: "Compete", href: "/learner" },
  { index: "02", label: "Host", href: "/host" },
  { index: "03", label: "Judge", href: "/judge" },
  { index: "04", label: "Sponsor", href: "/sponsor" },
  { index: "05", label: "Showcase", href: "/learner/portfolio" }
] as const;

type Accent = "red" | "blue" | "yellow";

const CHAPTERS: Array<{
  id: string;
  index: string;
  word: string;
  accent: Accent;
  title: ReactNode;
  body: string;
  cta: { label: string; href: string };
}> = [
  {
    id: "compete",
    index: "01",
    word: "Compete",
    accent: "red",
    title: (
      <>
        Prove it
        <br />
        in public.
      </>
    ),
    body: "Time-boxed sprints built on real prompts. Submissions are public, outputs are scored, and the leaderboard doesn't care about your follower count.",
    cta: { label: "Explore challenges", href: "/learner" }
  },
  {
    id: "host",
    index: "02",
    word: "Host",
    accent: "blue",
    title: (
      <>
        Run the league
        <br />
        you wish existed.
      </>
    ),
    body: "Hosts manage cohorts, configure challenges, invite participants, and publish results. Build a community around your craft.",
    cta: { label: "Start a league", href: "/host" }
  },
  {
    id: "judge",
    index: "03",
    word: "Judge",
    accent: "yellow",
    title: (
      <>
        Every rep
        <br />
        gets judged.
      </>
    ),
    body: "Transparent criteria. Real feedback from working professionals. Scores map to skill domains, not vibes — so every sprint makes you measurably better.",
    cta: { label: "Judge a sprint", href: "/judge" }
  },
  {
    id: "sponsor",
    index: "04",
    word: "Sponsor",
    accent: "red",
    title: (
      <>
        Talent, discovered
        <br />
        mid-game.
      </>
    ),
    body: "Embed your brief inside a live challenge and watch the field respond. Discover top performers before anyone else — a talent pipeline from live competition.",
    cta: { label: "Sponsor a sprint", href: "/sponsor" }
  },
  {
    id: "showcase",
    index: "05",
    word: "Showcase",
    accent: "blue",
    title: (
      <>
        Your portfolio
        <br />
        is your record.
      </>
    ),
    body: "Every scored public submission becomes part of a living portfolio. Skill signals compound over time, and top performers get surfaced.",
    cta: { label: "See the showcase", href: "/learner/portfolio" }
  }
];

const STATS = [
  { value: "06", unit: "", label: "Creative disciplines" },
  { value: "72", unit: "H", label: "Sprint window" },
  { value: "100", unit: "%", label: "Public · scored" },
  { value: "01", unit: "", label: "Season enrolling" }
] as const;

export function LandingPage() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [skipBoot, setSkipBoot] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  /* Dark document chrome while the landing is mounted */
  useEffect(() => {
    document.documentElement.classList.add("csl-dark");
    return () => document.documentElement.classList.remove("csl-dark");
  }, []);

  /* Boot counter — runs only on the very first visit */
  useIsoLayoutEffect(() => {
    let visited = false;
    try {
      visited = window.localStorage.getItem(VISITED_KEY) === "1";
    } catch {
      /* storage blocked — treat as a fresh visit */
    }
    const markVisited = () => {
      try {
        window.localStorage.setItem(VISITED_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (visited) {
      setSkipBoot(true);
      setProgress(100);
      setReady(true);
      return;
    }

    if (reduced) {
      setProgress(100);
      setReady(true);
      markVisited();
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
        markVisited();
        window.setTimeout(() => setReady(true), 220);
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
      { threshold: 0.16 }
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

  const word =
    PRELOADER_WORDS[
      Math.min(
        Math.floor((progress / 100) * PRELOADER_WORDS.length),
        PRELOADER_WORDS.length - 1
      )
    ];
  const dotsFilled = Math.round((progress / 100) * HALFTONE_DOTS);

  return (
    <div className={`lp${ready ? " ready" : ""}`}>
      {/* ── Boot sheet (first visit only) ──────────── */}
      <div
        className={`lp-boot${ready ? " done" : ""}${skipBoot ? " skip" : ""}`}
        aria-hidden={ready}
      >
        <span className="lp-cross lp-cross--tl" />
        <span className="lp-cross lp-cross--tr" />
        <span className="lp-cross lp-cross--bl" />
        <span className="lp-cross lp-cross--br" />

        <div className="lp-boot-row">
          <div className="lp-boot-stamp">
            <strong>Creative Sports League</strong>
            <span>Field Manual — №01</span>
            <span>Obsess the craft ©2026</span>
          </div>
          <div className="lp-boot-stamp lp-boot-stamp--r">
            <span>40°49.281′N</span>
            <span>73°55.764′W</span>
            <span>FIG.00 / BOOT</span>
          </div>
        </div>

        <div className="lp-boot-center">
          <span className="lp-boot-word">{word}</span>
          <div className="lp-boot-dots" aria-hidden="true">
            {Array.from({ length: HALFTONE_DOTS }).map((_, i) => (
              <i key={i} className={i < dotsFilled ? "on" : ""} />
            ))}
          </div>
        </div>

        <div className="lp-boot-meter">
          <span className="lp-boot-tick">[</span>
          <span className="lp-boot-count">
            {String(progress).padStart(3, "0")}
            <i>%</i>
          </span>
          <span className="lp-boot-tick">]</span>
        </div>
      </div>

      {/* ── Fixed chrome ───────────────────────────── */}
      <div className="lp-grid" aria-hidden="true" />
      <div className="lp-halftone" aria-hidden="true" />
      <HeroScene />

      <div className="lp-hud" aria-hidden="true">
        <span className="lp-hud-corner lp-hud-corner--tl" />
        <span className="lp-hud-corner lp-hud-corner--tr" />
        <span className="lp-hud-corner lp-hud-corner--bl" />
        <span className="lp-hud-corner lp-hud-corner--br" />
        <span className="lp-hud-tag lp-hud-tag--tl">
          <i className="lp-hud-led" />P1 · Season 01
        </span>
        <span className="lp-hud-tag lp-hud-tag--tr">Sprint 72:00:00</span>
        <span className="lp-hud-tag lp-hud-tag--bl">40°49.281′N · 73°55.764′W</span>
        <span className="lp-hud-tag lp-hud-tag--br">CSL · FIG.01</span>
      </div>

      <div className="lp-progress" aria-hidden="true">
        <div ref={progressBarRef} className="lp-progress-bar" />
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <header className="lp-nav">
        <Link href="/" className="lp-wordmark" aria-label="Creative Sports League home">
          CSL<span>®</span>
        </Link>
        <p className="lp-nav-tag">Field Manual — Season 01 / 2026</p>
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
            <span className="lp-menu-label">{menuOpen ? "Close" : "Index"}</span>
            <span className="lp-menu-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>

      {/* ── Overlay menu ───────────────────────────── */}
      <nav id="lp-menu" className={`lp-menu${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <ol className="lp-menu-list">
          {MENU_LINKS.map((link, i) => (
            <li key={link.href} style={{ transitionDelay: menuOpen ? `${0.06 + i * 0.05}s` : "0s" }}>
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
        {/* ── Hero / welcome sheet (Nike OTC) ──────── */}
        <section className="lp-hero">
          <div className="lp-dossier" data-reveal>
            <span>Field Manual</span>
            <span className="lp-dossier-line" aria-hidden="true" />
            <span>№01 / Season 01 — 2026</span>
          </div>

          <div className="lp-sheet">
            <span className="lp-sheet-tick lp-sheet-tick--top" aria-hidden="true">
              <i />
              <em>1440</em>
              <i />
            </span>
            <span className="lp-sheet-tick lp-sheet-tick--side" aria-hidden="true">
              <i />
              <em>900</em>
              <i />
            </span>

            <p className="lp-kicker">
              <span className="lp-dot" aria-hidden="true" />
              Where creative work becomes sport
            </p>

            <h1 className="lp-hero-title">
              <span className="mask"><span className="line">Where creative</span></span>
              <span className="mask"><span className="line">work becomes</span></span>
              <span className="mask">
                <span className="line lp-rainbow-text">sport.</span>
              </span>
            </h1>

            <div className="lp-hero-foot">
              <p className="lp-hero-sub">
                Time-boxed challenge sprints where emerging creatives compete on
                real briefs, get scored in public, and build a portfolio that
                proves it.
              </p>
              <div className="lp-hero-cta-stack">
                <div className="lp-hero-ctas">
                  <Link href="/learner" className="lp-btn">
                    <span className="lp-btn-glyph" aria-hidden="true">▶</span>
                    Enter the league
                  </Link>
                  <a href="#compete" className="lp-btn ghost">
                    How it works
                  </a>
                </div>
                <p className="lp-press" aria-hidden="true">
                  <span className="lp-press-blink">●</span> Insert coin — Season 01
                  now enrolling
                </p>
              </div>
            </div>
          </div>

          <span className="lp-annot lp-annot--fig" aria-hidden="true">
            FIG.01 — THE FIELD
          </span>
          <div className="lp-scroll-cue" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        {/* ── Spaced band (Foreigner) ──────────────── */}
        <section className="lp-band" aria-hidden="true">
          <div className="lp-band-track">
            {[0, 1].map((copy) => (
              <span key={copy} className="lp-band-copy">
                Compete<i>/</i>Create<i>/</i>Score<i>/</i>Showcase<i>/</i>Repeat
                <i>/</i>
              </span>
            ))}
          </div>
        </section>

        {/* ── Manifesto (Ventura) ──────────────────── */}
        <section className="lp-manifesto" data-reveal>
          <div className="lp-section-head">
            <span className="lp-section-no">02</span>
            <span className="lp-section-word">The thesis</span>
            <span className="lp-annot">FIG.02 — DOCTRINE</span>
          </div>
          <h2 className="lp-manifesto-title">
            <span className="mask"><span className="line">Discipline</span></span>
            <span className="mask"><span className="line">builds craft.</span></span>
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

        {/* ── Chapters (spec rows) ─────────────────── */}
        <section className="lp-chapters">
          {CHAPTERS.map((c) => (
            <article
              key={c.id}
              id={c.id}
              className={`lp-chapter lp-accent-${c.accent}`}
              data-reveal
            >
              <div className="lp-chapter-meta">
                <span className="lp-chapter-index">{c.index}</span>
                <span className="lp-chapter-word">{c.word}</span>
                <span className="lp-chapter-marker" aria-hidden="true" />
              </div>
              <div className="lp-chapter-content">
                <h3 className="lp-chapter-title">{c.title}</h3>
                <p className="lp-chapter-body">{c.body}</p>
                <Link href={c.cta.href} className="lp-arrow-link">
                  {c.cta.label}
                  <span aria-hidden="true"> →</span>
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* ── Stats (Ventura big numbers) ──────────── */}
        <section className="lp-stats" data-reveal>
          <div className="lp-section-head lp-section-head--stats">
            <span className="lp-section-no">03</span>
            <span className="lp-section-word">The record</span>
            <span className="lp-annot">FIG.03 — METRICS</span>
          </div>
          <div className="lp-stats-grid">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="lp-stat">
                <span className="lp-stat-index">{String(i + 1).padStart(2, "0")} /</span>
                <span className="lp-stat-value">
                  {stat.value}
                  <i>{stat.unit}</i>
                </span>
                <span className="lp-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────── */}
        <section className="lp-cta" data-reveal>
          <p className="lp-kicker">
            <span className="lp-dot" aria-hidden="true" />
            Join Season 01
          </p>
          <h2 className="lp-cta-title">
            <span className="mask"><span className="line">The season</span></span>
            <span className="mask"><span className="line lp-rainbow-text">is open.</span></span>
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

        {/* ── Stamp marquee (Nike OTC) ─────────────── */}
        <div className="lp-stamps" aria-hidden="true">
          <span className="lp-stamps-row">
            {[0, 1, 2].map((copy) => (
              <span key={copy} className="lp-stamps-set">
                <i>Obsess the craft ©2026</i>
                <i>40°49.281′N 73°55.764′W</i>
                <i>CSL Field Office</i>
                <i>EHQ / Season 01</i>
                <i>Fig.01 — The Field</i>
              </span>
            ))}
          </span>
        </div>

        {/* ── Footer ───────────────────────────────── */}
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
