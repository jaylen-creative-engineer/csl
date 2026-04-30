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
└── lat.md/                     # Knowledge graph (lat.md) — vision, domain, work backlog
```

**Guiding principles:**
- Domain logic lives in services — repositories encapsulate Supabase table access
- Services take `SupabaseClient<Database>` (typically admin on server/tests until RLS policies exist)
- BDD step definitions use real implementations against Postgres (requires `.env.local`)
- Scoring is deterministic — same inputs, same leaderboard order, every time

### Supabase

| Supabase product | Role in CSL |
|---|---|
| **Postgres** | Hosted database; repositories in `src/lib/supabase/repositories/` |
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
| lat.md | Knowledge graph (`lat.md/` vault — wiki-linked concepts and backlog) |
| tsx | TypeScript execution for scripts and BDD |

---

## Knowledge graph

Interlinked markdown under `lat.md/` documents product vision, the domain model, what is implemented, and a **work graph** (phases, themes, known gaps). Entry: `lat.md/README.md`. Validate links and `@lat` anchors with `npm run lat:check` (runs `npx lat check`). Use `npx lat refs "<section-id>"` to find code that references a vault section.

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # Fill Supabase URL + service role key for DB-backed tests/BDD
npm run dev        # Start Next.js dev server
npm test           # Vitest (integration specs skip if Supabase env vars are missing)
npm run bdd        # Cucumber BDD — requires `.env.local` with Supabase credentials
npm run verify     # typecheck + tests + BDD
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

The partnership and growth sequencing from the product design:

1. **Community anchors first** — Meetup groups, design schools, local orgs seed the talent supply
2. **Challenge sponsors second** — real stakes and briefs give output legitimacy
3. **Distribution and hiring partners last** — they're a reward for density, not a way to create it

The biggest near-term unlock: one well-run challenge sprint with one real sponsor, one community host, and public outputs.

---

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| 0 | Domain services + in-memory core | Done |
| 1 | Repository layer + database migrations | Next |
| 2 | API routes (REST, validation, idempotency) | Planned |
| 3 | UX workflows (challenge editor, leaderboard view, portfolio page) | Planned |
| 4 | Auth, RBAC, audit log, observability | Planned |
