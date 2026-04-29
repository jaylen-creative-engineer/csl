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

### Known Gaps

| Severity | Domain | Gap |
|---|---|---|
| critical | System | No persistence layer — all state in-memory, lost on restart |
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
| high | Product | No single-player practice mode for one-user project cycles |
| high | Challenge | No revision model (`v1` -> `v2`) to track creative iteration |
| high | Showcase | No skill trend timeline to visualize growth over repeated projects |
| high | Learning | No AI review pipeline to produce actionable critique per rubric criterion |
| high | Learning | No recommendation layer for courses/articles/materials tied to skill gaps |
| medium | Learning | No learner journey state (current level, target level, milestones) |

---

## Key Decisions

- **In-memory maps** are the current storage layer; all service interfaces are DTO-clean so the repository pattern can be inserted without changing method signatures.
- **Scoring is deterministic** — same inputs always produce the same leaderboard order.
- **BDD step definitions use real implementations** — no mocks of domain logic in acceptance tests.
- **Status transitions throw on invalid moves** — `activateLeague()` requires `draft`, `closeLeague()` requires `active`.

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

## Single-Player Experiential Learning Backlog

### North-star Loop

`Start project challenge -> submit v1 -> receive rubric critique -> ship revision v2 -> capture skill delta -> queue next project`

### Prioritized Workstreams

| Priority | Workstream | Why it matters |
|---|---|---|
| P0 | Solo studio mode (`personal` league type) | One creative can run full challenge cycles alone |
| P0 | Project challenge templates + drill packs | Makes practice experiential, constrained, and creation-first |
| P0 | Revision-first submissions | Forces iteration and quality growth through second-pass work |
| P1 | Rubric critique coach | Converts score output into specific creative next actions |
| P1 | AI review engine | Produces structured, criterion-level critique and revision guidance |
| P1 | Learner journey context | Gives each creative a clear path: current state, target, and next best project |
| P1 | Learning resource recommendations | Connects weak criteria to external support (courses, articles, references) |
| P1 | Skill growth timeline | Makes progress legible by criteria-domain trend |
| P1 | Private practice tape | Preserves body of work privately with optional public release |
| P2 | Learning arcs | Sequences projects into progressive mastery paths |
| P3 | Multiplayer overlays | Reintroduces sponsors/leagues/feed as optional amplification |

### Solo Success Criteria

- A single user can complete five project cycles with no additional participants.
- Every completed project includes at least one revision and score delta.
- Next-project recommendation is derived from weakest scoring criteria.
- AI review returns at least one strength, one weakness, and one concrete revision action per major criterion.
- Learning resources are suggested for each weak criterion with rationale and estimated effort.
- Public discovery is optional and not required for core value.
