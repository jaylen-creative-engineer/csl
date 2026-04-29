# Domain model

Core nouns and relationships for Creative Sports League services; mirrors `src/*-intelligence` and `src/league-model` ([[lat.md/current-system#Current system#Source layout]]).

## Entities

Persisted in-memory for now; Postgres replaces maps in [[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 1 — Persistence & data integrity]].

### LeagueHost

Fields include `id`, `name`, `organization`, `leagueIds[]`, `createdAt`. Created via `createLeagueHost()`. Owns one or more leagues.

### Season

Seasons optionally scope leagues (`createSeason()`).

### League

League lifecycle `draft` → `active` → `closed`. Tracks `challengeIds[]` — **known gap:** not populated by [[src/challenge-intelligence/challenge.service.ts#ChallengeService]] ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]).

### Participant

Enrollment with duplicate prevention; disciplines include design, writing, code, video, strategy, photography, illustration, other.

### Challenge

Sprint lifecycle `draft` → `open` → `judging` → `complete`. Scoring uses weighted criteria.

### Submission

Entries while challenge is `open`. **Known gap:** multi-judge flows overwrite instead of aggregating ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]).

### Sponsor

Sponsors attach via `attachToChallenge()` → `SponsorAttachment` with brief and outcomes. **Known gap:** `Challenge.sponsorId` may not stay in sync ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]).

### Showcase Intelligence

Portfolio construction, skill signals, top performers, public feed — implemented in [[src/showcase-intelligence/showcase.service.ts#ShowcaseService]].

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
