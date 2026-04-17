# CSL Knowledge Graph

> Tracks domain entities, relationships, implementation state, and key decisions.

---

## Entities

### LeagueHost
- Fields: `id`, `name`, `organization`, `leagueIds[]`, `createdAt`
- Created via `createLeagueHost()`
- Owns one or more Leagues

### Season
- Fields: `id`, `name`, `startDate`, `endDate`, `createdAt`
- Created via `createSeason()`
- Optionally attached to a League at creation time

### League
- Fields: `id`, `name`, `hostId`, `seasonId?`, `status`, `challengeIds[]`, `createdAt`
- Status enum: `draft` → `active` → `closed`
- Lifecycle methods: `createLeague()`, `activateLeague()`, `closeLeague()`
- `challengeIds` is not yet populated by ChallengeService (gap: high)

### Participant
- Fields: `id`, `handle`, `discipline`, `leagueMemberships[]`, `createdAt`
- Disciplines: design, writing, code, video, strategy, photography, illustration, other
- Enrolled via `enrollParticipant()`; membership tracks `leagueId`, `status`, `enrolledAt`

### Challenge
- Fields: `id`, `leagueId`, `title`, `prompt`, `deadline`, `status`, `scoringCriteria[]`, `sponsorId?`, `createdAt`
- Status enum: `draft` → `open` → `judging` → `complete`
- Lifecycle: `createChallenge()`, `openChallenge()`, `closeForJudging()`, `completeChallenge()`

### Submission
- Fields: `id`, `challengeId`, `participantId`, `artifact`, `isPublic`, `score?`, `submittedAt`
- Created via `submitEntry()` (challenge must be `open`)
- Scored via `scoreSubmission()` — currently single-judge only (gap: high)

### Sponsor
- Fields: `id`, `name`, `organization`, `contactEmail`, `createdAt`
- Attached to challenges via `attachToChallenge()` → creates `SponsorAttachment`
- `Challenge.sponsorId` is not updated by `attachToChallenge()` (gap: high)

### SponsorAttachment
- Fields: `id`, `sponsorId`, `challengeId`, `brief`, `outcome?`, `createdAt`
- Brief: `headline`, `description`, `deliverables[]`, `prize?`
- Outcome: `status` (pending/delivered/cancelled), `notes?`, `opportunityExtendedTo?`

---

## Relationships

```
LeagueHost ──── owns ──────────────► League (1:N)
Season ──────── optionally scopes ──► League (1:N)
League ──────── contains ───────────► Challenge (1:N) [challengeIds gap]
League ──────── has ────────────────► Participant via LeagueMembership (N:M)
Challenge ───── receives ───────────► Submission (1:N)
Participant ──── submits ───────────► Submission (1:N)
Sponsor ──────── attaches to ────────► Challenge via SponsorAttachment (N:M)
```

---

## Implementation Status

### Completed

| Domain | Feature |
|---|---|
| League Model | Create leagues, hosts, seasons |
| League Model | League lifecycle: draft → active → closed |
| League Model | Participant enrollment with duplicate prevention |
| League Model | List participants per league |
| Challenge Intelligence | Full sprint lifecycle: draft → open → judging → complete |
| Challenge Intelligence | Submit entries to open challenges |
| Challenge Intelligence | Score submissions with weighted criteria |
| Challenge Intelligence | Deterministic leaderboard |
| Challenge Intelligence | Structural diff between two challenges |
| Showcase Intelligence | Portfolio from public submissions |
| Showcase Intelligence | Skill signals from scoring criteria |
| Showcase Intelligence | Top performers per league |
| Showcase Intelligence | Public showcase feed |
| Sponsor Intelligence | Create sponsors and attach to challenges |
| Sponsor Intelligence | Brief delivery tied to challenge prompt |
| Sponsor Intelligence | Record sponsor outcomes |
| Sponsor Intelligence | Sponsor summary with top submission references |
| Persistence | Repository interfaces (`IRepository<T>`) for all aggregates |
| Persistence | In-memory repository implementations (swap-ready for DB) |
| Persistence | Services refactored to repository injection (backward-compatible) |
| Persistence | Drizzle ORM schema (`src/db/schema.ts`) for all 8 domain tables |
| Persistence | Drizzle-backed repository implementations (`src/db/repositories/`) |
| Persistence | DB service factory (`createDbServices()`) wires Drizzle repos into services |
| Persistence | Drizzle Kit config (`drizzle.config.ts`), `db:generate` / `db:push` scripts |

### Known Gaps

| Severity | Domain | Gap |
|---|---|---|
| critical | System | No Supabase project connected yet — run `db:push` once `DATABASE_URL` is set in `.env.local` |
| high | League | `League.challengeIds` never populated by ChallengeService |
| high | League | No `listLeagues()` / `listHosts()` |
| high | Challenge | No `getChallengesForLeague()` |
| high | Challenge | Multi-judge scoring overwrites instead of aggregates |
| high | Sponsor | `attachToChallenge()` does not update `Challenge.sponsorId` |
| medium | League | No `withdrawParticipant()` |
| medium | Challenge | No `updateChallenge()` |
| medium | Challenge | No `withdrawSubmission()` |
| medium | Challenge | `sponsorId` not validated against SponsorService on creation |
| medium | Sponsor | `opportunityExtendedTo` has no follow-up query path |
| low | System | No typed error classes for programmatic error handling |
| low | Showcase | No pagination on list operations |

---

## Key Decisions

- **Repository pattern** — services accept `IRepository<T>` instances via constructor injection with in-memory defaults, so existing call sites require no change while DB implementations can be injected.
- **Explicit `save()` after mutation** — services call `repo.save(entity)` after every in-place mutation so database-backed implementations don't require a separate "dirty tracking" layer.
- **JSONB for embedded value objects** — `scoring_criteria`, `artifact`, `score`, `brief`, `outcome` are stored as JSONB rather than normalized join tables; normalized if access patterns require it later.
- **Text IDs generated in application code** — all IDs use prefixed format (`host:uuid`, `league:uuid`, etc.) generated via `crypto.randomUUID()`, never by the DB sequence. `nextId()` remains synchronous.
- **Scoring is deterministic** — same inputs always produce the same leaderboard order.
- **BDD step definitions use real implementations** — no mocks of domain logic in acceptance tests.
- **Status transitions throw on invalid moves** — `activateLeague()` requires `draft`, `closeLeague()` requires `active`.
- **Supabase + Drizzle** — hosted Postgres via Supabase; Drizzle ORM for schema definition and type-safe queries; Drizzle Kit for migration generation. Use pooled URL (port 6543) at runtime, direct URL (port 5432) for migrations.

---

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| 0 | Domain services + in-memory core | Done |
| 1a | Repository interfaces + in-memory implementations | Done |
| 1b | Drizzle schema + Drizzle-backed repositories + service factory | Done |
| 1c | Connect Supabase project — set `DATABASE_URL`, run `db:push` | Next |
| 2 | API routes (REST, validation, idempotency) | Planned |
| 3 | UX workflows (challenge editor, leaderboard view, portfolio page) | Planned |
| 4 | Auth, RBAC, audit log, observability | Planned |
