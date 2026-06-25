# Work graph

Backlog and phases linking vision to engineering: persistence, APIs, UX, auth, then learner, social, and rollout themes ([[lat.md/product-vision#Product vision#North star]], [[lat.md/rollout-strategy#Rollout strategy]]).

## Phases (execution spine)

Ordered roadmap from `README.md`; later phases unlock personalization and collective features. Rollout milestones are mapped to phases in [[lat.md/rollout-strategy#Rollout strategy#Relation to engineering phases]].

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

**Status (partial):** v1 REST handlers under `app/api/v1/` — see [[lat.md/api-architecture#HTTP API architecture#Resource map]]. Still missing: Zod validation, auth gates, idempotency keys, pagination, OpenAPI.

| Work item | Notes |
|-----------|--------|
| Challenge & submission APIs | v1 routes live; add signed URLs for artifacts |
| League & enrollment APIs | v1 routes live; wire auth + RLS |
| Showcase & leaderboard APIs | v1 routes live; add feed pagination |
| Sponsor APIs | v1 routes live |

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

### Phase 5 — Coordination network

**Goal:** multi-phase project coordination across specialized player types — with structured handoffs, bounties, and a headless channel. Full spec: [[lat.md/coordination-network#Coordination network]].

**Depends on:** Phase 2 (hardened APIs) + Phase 4 (auth + RBAC).

| Work item | Notes |
|-----------|--------|
| Project + Phase schema and services | New top-level entities; build phases reuse Challenge sprint model |
| Player type model | Extends `Participant` disciplines: builder, product, amplifier, delivery, analyst, synthesizer |
| Handoff protocol | Stable-state gate + `Handoff` record with deliverables and notes |
| Bounty allocation model | `BountyAllocation` per phase; released on accepted handoff |
| Opportunity discovery surface | Open phases with bounties surfaced as browsable + matchable opportunities |
| Headless channel (SMS / webhook) | Twilio SMS + webhook; stateless command protocol (ACCEPT, STATUS, FLAG) |
| Coordination Dashboard (host) | Cross-project phase status, handoff queue, bounty spend — enterprise POV |
| AI match scoring | Fit score per participant × opportunity using Showcase signals |

## Work themes

Cross-cutting capabilities after foundations ship; optional ordering within a theme.

### Theme — Individual progression & learning loops

Implements the [[lat.md/individual-learner-journey#Individual learner journey#Behavior vision]]: skill intent, mastery framing, AI-coordinated paths, resources, accountability — still individualized even when social features engage ([[lat.md/product-vision#Product vision#Individual learner journey]]). This theme is the backbone of single-player mode ([[lat.md/rollout-strategy#Rollout strategy#Interaction patterns#Single-player mode (open source)]]).

| Work item | Status | Enables |
|-----------|--------|---------|
| Accounts & learner identity | Pending | Skill profile and longitudinal evidence |
| Skill intent & mastery surfaces | Done — [[src/skill-journey/skill-intent.service.ts#SkillIntentService]] + migration `20260522010001_skill_intent.sql` | Maps rubric/criteria to "skill X" progress ([[lat.md/individual-learner-journey#Individual learner journey#Skill intent & mastery framing]]) |
| AI-coordinated paths | Done — `app/api/v1/learners/[participantId]/{recommend-path,synthesize-plan,next-actions}` with prompt caching ([[src/skill-journey/ai-client.ts]]) | Recommend frameworks, plans, next actions ([[lat.md/individual-learner-journey#Individual learner journey#AI-coordinated guidance]]) |
| Plans, frameworks, path library | Done — [[src/skill-journey/learning.service.ts#LearningService]] + migration `20260522010002_learning_plans.sql` | Executable sequences tied to challenges and resources ([[lat.md/individual-learner-journey#Individual learner journey#Frameworks, plans, and paths]]) |
| Resources & brief linking | Done — `LearningService.addResource` + migration `20260522010003_resources.sql` | Step-level materials and sponsor/host briefs as learning substrate ([[lat.md/individual-learner-journey#Individual learner journey#Resources]]) |
| Accountability | Done — milestones / commitments / `checkMilestonesDue` + migration `20260522010004_accountability.sql` | Milestones, commitments, drift-aware prompts ([[lat.md/individual-learner-journey#Individual learner journey#Accountability]]) |
| Feedback beyond aggregate score | Pending | Rubric comments, critique — feeds mastery model |
| Personal dashboard | Pending | Progress, upcoming steps, artifacts |

Also grounded in [[lat.md/domain-model#Domain model#Entities#Showcase Intelligence]].

### Theme — Social & collective layers

Makes collaboration and mixed formats first-class ([[lat.md/product-vision#Product vision#Collective playground]]). This theme powers the transition from single-player to network mode ([[lat.md/rollout-strategy#Rollout strategy#Interaction patterns#Network mode (community platform)]]).

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

### Theme — Single-player open-source readiness

Engineering work to make CSL downloadable and self-hostable as a single-player tool ([[lat.md/rollout-strategy#Rollout strategy#Interaction patterns#Single-player mode (open source)]]). Target: Q4 public launch.

| Work item | Enables |
|-----------|---------|
| Frictionless local setup | `clone → configure → run` in under 5 minutes |
| API key as sole external dependency | Single environment variable to activate AI coordination |
| Local Supabase or lightweight DB fallback | Self-hosted without cloud dependency |
| CLI-driven goal and strategy workflows | Single-player loops without web UI |
| README-driven onboarding | First-run experience that works without documentation hunting |
| Open-source licensing and contribution guide | Community adoption and contribution |

### Theme — Network mode infrastructure

Engineering work to support the community-level Creative Sports League network ([[lat.md/rollout-strategy#Rollout strategy#Interaction patterns#Network mode (community platform)]]).

| Work item | Enables |
|-----------|---------|
| Public profiles and portable portfolios | Meritocratic visibility beyond single leagues |
| League and host discovery | New participants find communities without warm intros |
| Network-wide showcase feed | Cross-league talent surfacing |
| Sponsor and hiring org dashboards | Demand-side access to talent signals |
| Invitation and onboarding flows | Community growth without gatekeeping |
| Reputation portability | Skill signals belong to the participant, not the platform |

### Theme — Multi-phase coordination

Engineering work for the coordination network — Project, Phase, Handoff, and player type model ([[lat.md/coordination-network#Coordination network]]). Depends on Phase 4 auth.

| Work item | Enables |
|-----------|---------|
| `Project` and `Phase` schema + migrations | Durable multi-phase project state |
| `ProjectService` and `PhaseService` | Lifecycle management, stable-state gate |
| Player type extension to `Participant` | Role-aware assignment and matching |
| `Handoff` entity and service | Context transfer between phases; stable-state enforcement |
| Phase-scoped challenge reuse | Build phases delegate to existing sprint model |
| Coordination Dashboard UI | Host/PM view across all active projects and handoffs |

### Theme — Bounty and opportunity marketplace

Monetary incentives and open opportunity discovery ([[lat.md/coordination-network#Coordination network#Bounty system]]).

| Work item | Enables |
|-----------|---------|
| `BountyAllocation` schema and service | Funds held and released against phase delivery |
| Opportunity discovery surface | Open phases surfaced as browsable + matchable opportunities |
| AI match scoring | Participant × opportunity fit using Showcase signals |
| Bounty release on handoff acceptance | Pay-on-delivery proof |
| Earnings history on participant profile | Credential and income record for skilled individuals |

### Theme — Headless channel

Text and webhook-based participation without a UI ([[lat.md/coordination-network#Coordination network#Headless channel]]).

| Work item | Enables |
|-----------|---------|
| `Channel` entity (SMS / webhook / API) | Multi-surface notification and interaction |
| Twilio SMS integration | Inbound + outbound text-based participation |
| Stateless command parser | ACCEPT, STATUS, FLAG, PASS, HELP over SMS |
| Webhook push for opportunity matching | Slack, email, or custom endpoint delivery |
| Headless portfolio accrual | Work done via SMS still produces portfolio artifacts |

### Theme — Rollout and announcement

Non-engineering work that intersects with product readiness ([[lat.md/rollout-strategy#Rollout strategy#Announcement timeline]]).

| Work item | Enables |
|-----------|---------|
| Founder hero use case documentation | First-person narrative for Q3/Q4 announcement |
| Artifact and portfolio evidence from founder usage | Proof that the tool works |
| Q3 soft announcement content | Awareness and anticipation |
| Q4 launch content and landing page | Public availability of both modes |
| Early adopter outreach (community anchors) | Seed network density before sponsors |

## Backlog — supply-gated features

Features that are designed, assessed, and ready to build — but intentionally held until the prerequisite platform condition is met. Do not schedule engineering work on these until the gate condition is confirmed.

| Feature | Gate condition | Spec | Notes |
|---------|---------------|------|-------|
| Coordination network (Phase 5) | Credible talent supply established — portfolio-bearing participants visible on the platform with demonstrated skills across player types | [[lat.md/coordination-network#Coordination network]] | Full assessment in [[lat.md/coordination-network-assessment#Coordination network — feasibility, value, and GTM assessment]]. Activate by identifying 3–5 pilot orgs as design partners once supply gate is met; run first projects manually before self-serve. Defer bounty payment rails until volume justifies compliance investment. |

## Known domain gaps (tracked)

Concrete inconsistencies and omissions to close in Phase 1–2 unless noted.

| Severity | Topic | Work |
|----------|-------|------|
| critical | Auth + RLS not wired — services/tests use service-role bypass | Phase 4 — deferred to `csl-auth-rbac` |
| ~~high~~ | ~~`League.challengeIds` not populated from challenges~~ | Done — derived from challenges table in `fetchLeague()`; BDD scenario added |
| ~~high~~ | ~~No `listLeagues()` / `listHosts()`~~ | Done — `listLeagues()`, `listHosts()` shipped |
| ~~high~~ | ~~No `getChallengesForLeague()`~~ | Done — `getChallengesForLeague()` shipped |
| ~~high~~ | ~~Multi-judge scoring overwrites~~ | Done — `Submission.scores[]` + `aggregateScore()` helper; unique constraint removed via migration |
| ~~high~~ | ~~`attachToChallenge()` vs `Challenge.sponsorId` sync~~ | Done — `updateChallengeSponsorId()` called after attachment insert |
| ~~medium~~ | ~~Withdraw participant / submission~~ | Done — `withdrawParticipant()` + `withdrawSubmission()` with state guard |
| ~~medium~~ | ~~No `updateChallenge()`~~ | Done — draft-only guard; BDD scenario added |
| ~~medium~~ | ~~`sponsorId` validation vs sponsor service~~ | Done — sponsor existence check in `insertChallenge()` |
| ~~low~~ | ~~Typed error classes~~ | Done — `src/lib/errors.ts`: `NotFoundError`, `ConflictError`, `InvalidStateError`, `ValidationError` |
| ~~low~~ | ~~Showcase list pagination~~ | Done — cursor-based `getShowcaseFeed(options)` with `nextCursor`; API route updated |

## How to use this graph

Process notes for humans and agents maintaining this vault.

- Link PRs to a **phase** and **theme** when relevant.
- When closing a gap, update or remove its row in [[lat.md/work-graph#Work graph#Known domain gaps (tracked)]].
- Run `npx lat check` after editing markdown under `lat.md/`.
