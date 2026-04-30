# Work graph

Backlog and phases linking vision to engineering: persistence, APIs, UX, auth, then learner and social themes ([[lat.md/product-vision#Product vision#North star]]).

## Phases (execution spine)

Ordered roadmap from `README.md`; later phases unlock personalization and collective features.

### Phase 0 — Domain services + in-memory core

**Status:** superseded — contracts preserved; storage moved to Postgres ([[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 1 — Persistence & data integrity]]).

### Phase 1 — Persistence & data integrity

**Status:** repository layer + migrations landed (`src/lib/supabase/repositories/`). Remaining: broaden automated coverage against live DB in CI when secrets available.

**Goal:** durable state in Postgres (Supabase), migrations, repository implementations — unlocks learner journeys.

| Work item | Notes |
|-----------|--------|
| Schema & migrations | Align DB with [[lat.md/domain-model#Domain model#Entities]]; optional `participants.user_id` → `auth.users` |
| Repository layer | Done — typed access + JSON mappers |
| RLS policies | Deferred to [[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 4 — Auth, RBAC, observability]] (tables have RLS enabled without policies; server uses service role where needed) |
| Close tracked consistency gaps | [[lat.md/work-graph#Work graph#Known domain gaps (tracked)]] |

#### Next steps (post–Phase 1)

1. **Auth** — Supabase Auth + Next middleware session refresh; set `participants.user_id` on signup.
2. **RLS** — Policies per role; prefer user-scoped server client over service role in Route Handlers.
3. **API routes** — Phase 2 REST / Server Actions wrapping services.

Core services: [[src/league-model/league-model.service.ts#LeagueModelService]], [[src/challenge-intelligence/challenge.service.ts#ChallengeService]], [[src/showcase-intelligence/showcase.service.ts#ShowcaseService]], [[src/sponsor-intelligence/sponsor.service.ts#SponsorService]]. See [[lat.md/current-system#Current system#Verification]].

### Phase 2 — API routes

**Goal:** external REST (or RPC) with validation and idempotency for clients and integrations.

| Work item | Notes |
|-----------|--------|
| Challenge & submission APIs | External submit flows; signed URLs for artifacts |
| League & enrollment APIs | Host operations; duplicate enrollment rules |
| Showcase & leaderboard APIs | Feed pagination (also a gap today) |
| Sponsor APIs | Brief + outcome reporting |

### Phase 3 — UX workflows

**Goal:** learners and hosts complete loops without the CLI.

| Work item | Notes |
|-----------|--------|
| Challenge editor & sprint dashboard | Host POV |
| Leaderboard & judging UI | Judge POV; informs multi-judge design |
| Portfolio & public profile | Learner POV |
| Sponsor brief surfaces | Sponsor POV |

### Phase 4 — Auth, RBAC, observability

**Goal:** identities, roles, audit trail — foundation for trusted competition and collaboration.

| Work item | Notes |
|-----------|--------|
| Supabase Auth wiring | [[src/lib/supabase/server.ts#createSupabaseServerClient]] session path |
| RBAC | League-scoped permissions |
| Audit log | Scoring and enrollment changes |
| Metrics / tracing | Operational confidence at scale |

## Work themes

Cross-cutting capabilities after foundations ship; optional ordering within a theme.

### Theme — Individual progression & learning loops

Implements the [[lat.md/individual-learner-journey#Individual learner journey#Behavior vision]]: skill intent, mastery framing, AI-coordinated paths, resources, accountability — still individualized even when social features engage ([[lat.md/product-vision#Product vision#Individual learner journey]]).

| Work item | Enables |
|-----------|---------|
| Accounts & learner identity | Skill profile and longitudinal evidence |
| Skill intent & mastery surfaces | Maps rubric/criteria to “skill X” progress ([[lat.md/individual-learner-journey#Individual learner journey#Skill intent & mastery framing]]) |
| AI-coordinated paths | Recommend frameworks, plans, next actions ([[lat.md/individual-learner-journey#Individual learner journey#AI-coordinated guidance]]) |
| Plans, frameworks, path library | Executable sequences tied to challenges and resources ([[lat.md/individual-learner-journey#Individual learner journey#Frameworks, plans, and paths]]) |
| Resources & brief linking | Step-level materials and sponsor/host briefs as learning substrate ([[lat.md/individual-learner-journey#Individual learner journey#Resources]]) |
| Accountability | Milestones, commitments, drift-aware prompts ([[lat.md/individual-learner-journey#Individual learner journey#Accountability]]) |
| Feedback beyond aggregate score | Rubric comments, critique — feeds mastery model |
| Personal dashboard | Progress, upcoming steps, artifacts |

Also grounded in [[lat.md/domain-model#Domain model#Entities#Showcase Intelligence]].

### Theme — Social & collective layers

Makes collaboration and mixed formats first-class ([[lat.md/product-vision#Product vision#Collective playground]]).

| Work item | Enables |
|-----------|---------|
| Teams or cohort groups | Collaborative production |
| Peer / panel judging | Community participation |
| Async discussion on submissions | Critique and mentorship |
| Season narratives & mixed formats | Playground variety |

### Theme — Competition design

Strengthens fairness and sponsor stakes alongside [[lat.md/domain-model#Domain model#Entities#Challenge]] and [[lat.md/domain-model#Domain model#Entities#Sponsor]].

| Work item | Enables |
|-----------|---------|
| Multi-judge aggregation | Replace single-score overwrite ([[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]) |
| Anti-gaming & dispute hooks | Trust in public proof |
| Sponsor stakes UX | Outcomes ↔ visibility |

## Known domain gaps (tracked)

Concrete inconsistencies and omissions to close in Phase 1–2 unless noted.

| Severity | Topic | Work |
|----------|-------|------|
| critical | Auth + RLS not wired — services/tests use service-role bypass | Phase 4 |
| high | `League.challengeIds` not populated from challenges | Service + league linkage |
| high | No `listLeagues()` / `listHosts()` | Discovery APIs |
| high | No `getChallengesForLeague()` | Host UX & queries |
| high | Multi-judge scoring overwrites | Aggregation model |
| high | `attachToChallenge()` vs `Challenge.sponsorId` sync | Data consistency |
| medium | Withdraw participant / submission | Lifecycle completeness |
| medium | No `updateChallenge()` | Editorial workflows |
| medium | `sponsorId` validation vs sponsor service | Validation rules |
| low | Typed error classes | API ergonomics |
| low | Showcase list pagination | Scale |

## How to use this graph

Process notes for humans and agents maintaining this vault.

- Link PRs to a **phase** and **theme** when relevant.
- When closing a gap, update or remove its row in [[lat.md/work-graph#Work graph#Known domain gaps (tracked)]].
- Run `npx lat check` after editing markdown under `lat.md/`.
