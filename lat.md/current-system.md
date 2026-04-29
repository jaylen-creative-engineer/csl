# Current system

What runs in the repo today: domain services, thin Next.js shell, CLI, Supabase clients, and test harness — summarized so agents map features to folders.

## Capabilities implemented

Matches the feature table in `README.md`: leagues, challenge sprints, showcase, sponsors.

| Area | What exists |
|------|-------------|
| League model | Hosts, seasons, leagues, enrollment, participant listing |
| Challenge intelligence | Sprint lifecycle, submissions, scoring, leaderboard, challenge diff |
| Showcase intelligence | Portfolio, skill signals, top performers, public feed |
| Sponsor intelligence | Sponsors, attachments, briefs, outcomes, sponsor summaries |

## Delivery surfaces

Where users and operators touch the system: web app, CLI, database clients.

### Next.js app

`app/` — App Router landing and [[app/api/supabase/health/route.ts]] health check. Thin UI relative to domain services.

### CLI

`cli/entry.ts` — interactive and CI-safe (`--smoke`, `--demo`) workflows over the same services used in tests.

### Supabase

Clients in `src/lib/supabase/` ([[src/lib/supabase/client.ts#createSupabaseBrowserClient]], [[src/lib/supabase/server.ts#createSupabaseServerClient]], admin). Types: [[src/lib/supabase/database.types.ts]]. Persistence roadmap: [[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 1 — Persistence & data integrity]].

## Source layout

Maps directories to responsibilities for navigation and ownership.

| Path | Role |
|------|------|
| `src/league-model/` | League, season, host, participant |
| `src/challenge-intelligence/` | Challenges, submissions, scoring, leaderboard |
| `src/showcase-intelligence/` | Portfolio and signals |
| `src/sponsor-intelligence/` | Sponsors and attachments |
| `features/` | Cucumber features and step definitions |

## Verification

Automated gates before merge: unit tests, BDD, typecheck.

- **Vitest** — unit tests per service
- **Cucumber** — BDD scenarios tagged `@challenge`, `@league`, `@showcase`
- `npm run verify` — typecheck + unit + BDD

Core services under test: [[src/league-model/league-model.service.ts#LeagueModelService]], [[src/challenge-intelligence/challenge.service.ts#ChallengeService]], [[src/showcase-intelligence/showcase.service.ts#ShowcaseService]], [[src/sponsor-intelligence/sponsor.service.ts#SponsorService]].
