# Domain model

Core nouns and relationships for Creative Sports League services; mirrors `src/*-intelligence` and `src/league-model` ([[lat.md/current-system#Current system#Source layout]]).

## Entities

Primary store is **Postgres** via Supabase repositories (`src/lib/supabase/repositories/`); participants link to `auth.users` when `user_id` is set ([[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 4 — Auth, RBAC, observability]]).

### LeagueHost

Fields include `id`, `name`, `organization`, `leagueIds[]`, `createdAt`. Created via `createLeagueHost()`. Owns one or more leagues.

### Season

Seasons optionally scope leagues (`createSeason()`).

### League

League lifecycle `draft` → `active` → `closed`. Tracks `challengeIds[]` — **known gap:** not populated by [[src/challenge-intelligence/challenge.service.ts#ChallengeService]] ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]).

### Participant

Enrollment with duplicate prevention; disciplines include design, writing, code, video, strategy, photography, illustration, other. Optional `userId` links to Supabase Auth once onboarding wires accounts.

### Challenge

Sprint lifecycle `draft` → `open` → `judging` → `complete`. Scoring uses weighted criteria.

### Submission

Entries while challenge is `open`. **Known gap:** multi-judge flows overwrite instead of aggregating ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]).

### Sponsor

Sponsors attach via `attachToChallenge()` → `SponsorAttachment` with brief and outcomes. **Known gap:** `Challenge.sponsorId` may not stay in sync ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]).

### Showcase Intelligence

Portfolio construction, skill signals, top performers, public feed — implemented in [[src/showcase-intelligence/showcase.service.ts#ShowcaseService]].

## Domain services (implementation)

Async services backed by **Supabase Postgres** through typed repositories; admin/service-role client used in tests and trusted server paths until RLS policies ship ([[lat.md/current-system#Current system#Delivery surfaces#Supabase]]).

### LeagueModelService

Hosts, seasons, leagues, participants, enrollment — see [[lat.md/domain-model#Domain model#Entities]].

### ChallengeService

Challenge lifecycle, submissions, scoring, leaderboard, diff — see [[lat.md/domain-model#Domain model#Entities#Challenge]] and [[lat.md/domain-model#Domain model#Entities#Submission]].

### ShowcaseService

Portfolio, skill signals, top performers, public feed — see [[lat.md/domain-model#Domain model#Entities#Showcase Intelligence]].

### SponsorService

Sponsors, briefs, attachments, outcomes — see [[lat.md/domain-model#Domain model#Entities#Sponsor]].

## Relationships

Who connects to whom in the domain; guides schema foreign keys and service boundaries.

```text
LeagueHost ──owns──► League (1:N)
Season ──scopes──► League (1:N)
League ──contains──► Challenge (1:N)
League ──enrolls──► Participant (N:M via membership)
Challenge ──receives──► Submission (1:N)
Participant ──submits──► Submission (1:N)
Sponsor ──attaches──► Challenge via SponsorAttachment (N:M)
```

## Key decisions

Non-negotiables that implementation and migrations should preserve.

- Domain logic stays in services; repositories can replace maps without changing method signatures.
- **Scoring is deterministic** — same inputs, same leaderboard order.
- BDD uses **real** services ([[lat.md/current-system#Current system#Verification]]).
