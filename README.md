# Creative Sports League (CSL)

A structured challenge sprint platform for emerging creatives — built to prove skill publicly, run leagues without a marketing budget, and surface talent signals for sponsors and hiring organizations.

---

## Features Completed

| Domain | Feature | Status |
|---|---|---|
| League Model | Create leagues with a named host and season | Done |
| League Model | Participant enrollment with duplicate prevention | Done |
| League Model | List participants per league | Done |
| Challenge Intelligence | Challenge sprint lifecycle: draft → open → judging → complete | Done |
| Challenge Intelligence | Submit entries to open challenges | Done |
| Challenge Intelligence | Score submissions with per-criteria breakdown | Done |
| Challenge Intelligence | Deterministic leaderboard sorted by score | Done |
| Challenge Intelligence | Structural diff between two challenges | Done |
| Showcase Intelligence | Build participant portfolio from public submissions | Done |
| Showcase Intelligence | Derive skill signals from scoring criteria domains | Done |
| Showcase Intelligence | Surface top performers per league by aggregate score | Done |
| Showcase Intelligence | Public showcase feed (most recent first) | Done |
| Sponsor Intelligence | Create sponsors and attach to challenges | Done |
| Sponsor Intelligence | Brief delivery tied to challenge prompt | Done |
| Sponsor Intelligence | Record sponsor outcomes post-challenge | Done |
| Sponsor Intelligence | Sponsor summary with top submission references | Done |

---

## Project Description

The Creative Sports League is built on one core insight: **emerging creatives need a structured, public way to prove their skill** — and once that supply exists, everything else follows.

The platform operates at three levels simultaneously:

- **Rep layer for creatives** — each challenge sprint produces a public artifact that lives in a participant's portfolio. Skill signals are derived from scored criteria, not self-reported claims.
- **Talent signal for organizations** — sponsors embed real briefs into challenges. Hiring orgs get a ranked, credentialed pool without a sourcing process.
- **Content engine for communities** — league hosts publish challenge results as a feed. Every sprint is a content event with a leaderboard, a story, and real stakes.

The MVP obsesses over one user: the **emerging creative** who needs a structured, public way to prove their skill. The **league host** is the distribution engine — community organizers with existing trust and audience who gain structure and content output in exchange for running the cohort.

---

## Architecture

CSL mirrors the `future-org-design` project architecture: intelligence-first domain services, tested independently of delivery interfaces, with a thin Next.js layer consuming them via API.

```
csl/
├── src/
│   ├── league-model/          # Core entities: League, Season, LeagueHost, Participant
│   ├── challenge-intelligence/ # Sprint lifecycle, scoring, leaderboard, diff
│   ├── showcase-intelligence/  # Portfolio, skill signals, top performers feed
│   ├── sponsor-intelligence/   # Sponsor attachment, brief, outcome tracking
│   └── lib/supabase/          # Supabase browser/server/admin clients (@supabase/ssr + supabase-js)
├── features/
│   ├── challenge.feature
│   ├── league.feature
│   ├── showcase.feature
│   └── step_definitions/       # Cucumber BDD steps using real service instances
│       └── support/world.ts    # Shared Cucumber World — all services wired here
├── app/                        # Next.js App Router (landing page)
└── docs/                       # Product roadmap and feature design specs
```

**Guiding principles:**
- Domain logic lives in services — no direct DB or UI coupling
- All services use in-memory maps now; repository layer slots in without changing the service interface
- BDD step definitions use real implementations, not mocks of domain logic
- Scoring is deterministic — same inputs, same leaderboard order, every time

### Supabase

| Supabase product | Role in CSL |
|---|---|
| **Postgres** | Hosted database; use `DATABASE_URL` when you add the repository layer (Phase 1) |
| **Auth** | User sessions via `src/lib/supabase/*` (see roadmap Phase 4) |
| **Storage** | Public or signed URLs for challenge submission artifacts (`SubmissionArtifact.url`) |
| **Realtime** | Optional live feed or leaderboard updates |

Copy `.env.local.example` to `.env.local` and fill values from the Supabase dashboard.

---

## Tech Stack

| Tool | Role |
|---|---|
| Next.js 16 + TypeScript | App framework |
| Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | Auth session, Storage, and other platform APIs |
| Vitest | Unit tests |
| Cucumber.js | BDD acceptance scenarios |
| lat.md | Knowledge graph |
| tsx | TypeScript execution for scripts and BDD |

---

## Getting Started

```bash
npm install
npm run dev        # Start Next.js dev server
npm test           # Run Vitest unit tests (41 tests)
npm run bdd        # Run Cucumber BDD scenarios (9 scenarios, 35 steps)
npm run verify     # Run full integration check: typecheck + tests + BDD
```

Tag-scoped BDD runs:

```bash
npm run bdd:challenge   # @challenge scenarios only
npm run bdd:league      # @league scenarios only
npm run bdd:showcase    # @showcase scenarios only
```

### Validation CLI (interactive + CI-safe modes)

```bash
npm run csl:cli                 # interactive menus (requires TTY)
npm run csl:cli -- --smoke      # fast non-interactive wiring check
npm run csl:cli -- --demo       # non-interactive guided workflow with JSON output
npm run csl:cli -- --help       # usage + troubleshooting notes
```

Notes:
- Interactive mode is intentionally disabled when stdin is not a TTY (common in CI and some IDE Run configs). Use `--smoke` or `--demo` there.
- The CLI uses `node ./node_modules/tsx/dist/cli.mjs ./cli/entry.ts` to avoid double-loading `tsx`.
- Do not set `NODE_OPTIONS=--import tsx` for this command path.

---

## Test Coverage

```
Unit tests:   41 passing
BDD scenarios: 9 passing
BDD steps:    35 passing
```

**Unit test breakdown:**

| Service | Tests |
|---|---|
| LeagueModelService | 13 |
| ChallengeService | 12 |
| ShowcaseService | 7 |
| SponsorService | 9 |

**BDD scenario breakdown:**

| Feature | Scenarios |
|---|---|
| Challenge sprint lifecycle | 4 |
| League model and enrollment | 3 |
| Showcase and talent signals | 2 |

---

## Strategic Sequencing

The near-term sequencing is now **single-player creation value first**, then network effects:

1. **Solo experiential loop first** — one creative can run repeated project-based challenges, receive critique, ship revisions, and see skill growth
2. **Optional social overlays second** — private work can be published into feeds, cohorts, and ranked formats when the creator chooses
3. **Sponsor and hiring signals third** — external demand layers on only after solo outcomes are strong and repeatable

The biggest near-term unlock: a solo creative can complete multiple end-to-end project cycles (`v1 -> critique -> v2`) and measurably improve without any dependency on hosts, sponsors, or audience density.

---

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| 0 | Domain services + in-memory core | Done |
| 1 | Repository layer + database migrations | Next |
| 2 | API routes (REST, validation, idempotency) | Planned |
| 3 | UX workflows (challenge editor, leaderboard view, portfolio page) | Planned |
| 4 | Auth, RBAC, audit log, observability | Planned |

---

## Product Backlog (Single-Player Experiential Learning First)

The next product milestone is to make CSL valuable for one creative without relying on community density, sponsor demand, or leaderboard effects.

### North-star loop

`Start project challenge -> submit v1 -> receive rubric critique -> ship revision v2 -> capture skill delta -> queue next project`

### Prioritized backlog

| Priority | Workstream | Outcome for solo creative | Domain impact |
|---|---|---|---|
| P0 | Solo studio mode | One user can start and complete project-based sprints privately | `league-model`: personal studio or auto-provisioned personal league |
| P0 | Project challenge templates | Users can practice creation through constrained, experiential projects | `challenge-intelligence`: challenge templates, drill packs, seeded criteria |
| P0 | Revision-first submissions | Creation quality improves through required second pass, not one-and-done uploads | `challenge-intelligence`: submission revisions (`v1`, `v2`, etc.), revision state |
| P1 | Rubric critique coach | Feedback translates directly into concrete next creative actions | `challenge-intelligence`: rubric-level feedback, revision prompt generation |
| P1 | Skill growth timeline | User sees craft improvement over time, by criteria domain | `showcase-intelligence`: growth profile, per-domain trend aggregation |
| P1 | Private practice tape | User retains a personal archive of projects, drafts, and reflection | `showcase-intelligence`: private portfolio feed with publish toggle |
| P2 | Learning arcs | Project series builds mastery via sequenced creative outcomes | new learning-path service or extension of challenge templates |
| P3 | Multiplayer overlays | Public leagues, sponsor briefs, and ranked feeds become optional accelerators | existing league/sponsor/showcase modules re-enabled on top of solo core |

### Definition of success for this backlog

- A solo user can complete 5 project cycles end-to-end with no other participants.
- Each project cycle produces at least one revision event and a measurable score delta.
- The app can recommend the next project based on weakest scoring criteria.
- Public discovery features remain optional, not required, for core value delivery.
