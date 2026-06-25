# Coordination network

High-level coordination layer enabling multi-phase project execution across specialized player types — with structured handoffs, bounties, and a headless interaction channel ([[lat.md/product-vision#Product vision#North star]], [[lat.md/domain-model#Domain model]]).

## Vision

CSL evolves from a challenge-and-submission engine into a **coordination network** — the operating system for how skilled individuals and organizations move an idea from concept to delivered value.

The core insight: different phases of a project require fundamentally different skills and mindsets. A creative or engineer building something to a stable state is doing different work than a sales or marketing team amplifying it, which is different again from a delivery team executing to completion. Treating these as the same "challenge" misses the handoff protocol that makes large-scale coordination possible.

The network enables:

- **Creatives and engineers** to do their best work and hand off to specialists, instead of being trapped in every downstream phase
- **Sales and marketing teams** to pick up proven, stable work and amplify it — not guess at what the product can do
- **Delivery teams** to execute against a clear brief with documented prior context
- **Analytics functions** to close the loop with evidence, feeding the next cycle
- **Organizations of any scale** — from a solo creative to a Fortune 500 — to coordinate across this stack without email chains and lost context
- **Skilled individuals** to demonstrate value, earn bounties, and build a track record that transcends any single employer or network

## Player types

Extends the existing `Participant` discipline model to a richer role system that maps to project phases.

| PlayerType | Phase ownership | Current mapping |
|------------|----------------|----------------|
| `builder` | Concept → Stable (build phase) | design, code, writing, illustration, video disciplines |
| `product` | Concept → Stable (strategy layer) | strategy discipline |
| `amplifier` | Stable → Amplified (sales + marketing) | new |
| `delivery` | Amplified → Delivered (execution) | new |
| `analyst` | Delivered → Insight (analytics + reporting) | photography, other disciplines + new |
| `synthesizer` | Cross-phase (PM, integrator, coordinator) | new |

A participant may hold multiple player types. The `synthesizer` type is the cross-phase coordinator who manages handoffs and maintains project coherence across phases.

## Project entity

A **Project** is the new top-level container for multi-phase coordination. It is distinct from a League (which is a community container) but can be scoped within one.

```text
Project
  id
  title
  brief                 -- what needs to be accomplished; maps to sponsor brief
  organizationId        -- owner org or individual
  leagueId?             -- optional league scope
  bountyPool            -- total monetary allocation
  phaseIds[]            -- ordered sequence of phases
  status                draft | active | on-hold | delivered | closed
  createdAt
```

A Project decomposes into **Phases** (see below). The Challenge entity is repurposed as the build phase's execution unit — existing challenge sprints map to build-phase work.

## Phase entity

Each Phase is an ordered step in the project with an assigned player type, acceptance criteria (stable-state gate), and optional bounty.

```text
Phase
  id
  projectId
  sequence              -- 1, 2, 3… ordering
  phaseType             build | amplify | deliver | analyze
  title
  brief                 -- phase-specific brief from the inbound handoff
  ownerType             PlayerType responsible for this phase
  assigneeIds[]         -- specific participants assigned, or open (any qualified player)
  status                pending | active | in-review | stable | handed-off | complete
  stableStateCriteria   -- human-readable or structured acceptance criteria
  bounty                -- monetary amount for this phase; drawn from Project.bountyPool
  artifactIds[]         -- outputs produced in this phase
  handoffNotes          -- context passed forward to the next phase
  createdAt
  completedAt?
```

### Phase lifecycle

```text
pending → active (phase owner begins work)
       → in-review (owner marks work complete, triggers stable-state review)
       → stable (acceptance criteria met; handoff unlocked)
       → handed-off (next phase activated, handoff notes delivered)
       → complete
```

The `stable` gate is the key innovation: a phase cannot hand off until criteria are explicitly met. This prevents half-finished work from cascading downstream.

## Handoff protocol

When a phase reaches `stable`, a **Handoff** record is created that transfers context to the next phase owner.

```text
Handoff
  id
  fromPhaseId
  toPhaseId
  deliverables[]        -- artifacts, links, structured outputs
  notes                 -- narrative context from outgoing team
  acceptedAt?           -- when the incoming phase owner acknowledges
  acceptedBy?
```

The receiving player type gets a notification (web or headless — see [[lat.md/coordination-network#Coordination network#Headless channel]]) with the brief, deliverables, and bounty for their phase. They can accept and activate their phase, or flag a gap before accepting.

This protocol maps cleanly to how organizations actually work: sales and marketing should not touch a product until engineering says it is stable. Delivery should not start until the pipeline is ready. Analytics cannot close the loop without delivery evidence.

## Bounty system

Bounties make individual value explicit and enable the skilled labor market that is central to the CSL thesis.

### Project-level bounty pool

An organization or sponsor funds a `bountyPool` on the Project. The pool is split across phases when the project is scoped.

```text
BountyAllocation
  id
  projectId
  phaseId
  amount                -- monetary value in USD (or token unit)
  currency
  status                held | released | paid
  releasedTo?           -- participantId who earned it
  releasedAt?
```

### Bounty release triggers

| Trigger | Action |
|---------|--------|
| Phase reaches `stable` and handoff is accepted | Bounty released to phase assignee(s) |
| Phase is overridden or re-assigned | Bounty held; partial release on review |
| Project closed without delivery | Held bounties returned to pool per terms |

### Discovery surface

Open phases with bounties are surfaced as **opportunities** — visible on the platform and delivered headlessly. This is the "possible amounts of money that can be earned" surface: creatives and skilled workers see what work is available, what it pays, and whether they are a fit.

```text
Opportunity
  id
  phaseId
  projectTitle
  phaseType
  brief                 (truncated for discovery)
  requiredPlayerTypes[]
  bountyAmount
  deadline?
  organizationName
  matchScore?           -- AI-derived fit score for the viewing participant
```

## Headless channel

Many skilled individuals do not want to check a dashboard. They want a text message that says: "There is a project you'd be a good fit for. It pays $X. Here is the brief." This channel enables full participation without a UI.

### Channel model

```text
Channel
  participantId
  type                  web | sms | webhook | api
  address               phone number | URL | API key
  active
  preferences           -- notification types, frequency, min bounty threshold
```

### Headless interaction patterns

| User action | Headless equivalent |
|-------------|-------------------|
| Browse opportunities | Receive SMS/webhook with matched opportunities on cadence or trigger |
| Accept a phase | Reply with keyword (e.g., "ACCEPT [phaseId]") or POST to API |
| Submit deliverable | Reply with link or structured payload |
| Check project status | Reply "STATUS [projectId]" |
| Flag a handoff gap | Reply "FLAG [phaseId] [note]" |

The AI matching layer selects opportunities for each participant based on their player type, past submissions, skill signals, and stated preferences — and pushes them without requiring login.

This creates a **low-friction onramp** for skilled individuals who are not active platform users: they receive a text, respond, do the work, and get paid. Portfolio evidence accrues even if they never log in.

### SMS implementation path

- Twilio (or equivalent) for inbound/outbound SMS
- Webhook-based channel for integrations (Slack, email, custom)
- Stateless command parsing: `ACCEPT`, `STATUS`, `FLAG`, `PASS`, `HELP`
- Rate limits and abuse prevention at the channel layer

## Large-scale org coordination

For organizations running multiple parallel projects, the platform surfaces a **Coordination Dashboard** — a host-level view across all active projects, phases, handoffs in review, and bounty spend.

This is the enterprise use case: a VP of Product or Chief of Staff sees every active workstream, which phases are blocked, which are in stable-state review, and where the next bottleneck will be. Without a dashboard like this, coordination happens in Slack, email, and spreadsheets — with all the attendant loss of context.

The Coordination Dashboard is a natural extension of the existing host-level league and challenge views, elevated to the project level.

## Relationship to existing domain model

How the new entities compose with what already exists.

```text
Organization ──funds──► Project (N:M via BountyAllocation pool)
Project ──contains──► Phase (1:N, ordered)
Phase ──extends──► Challenge (build phases reuse challenge sprint model)
Phase ──produces──► Handoff (1:1 between consecutive phases)
Handoff ──notifies via──► Channel (1:N)
Participant ──claims──► Phase via Opportunity (M:N)
Participant ──receives──► Opportunity via Channel
BountyAllocation ──scopes──► Phase (1:1)
BountyAllocation ──releases to──► Participant
```

Existing League, Participant, Showcase, and Sponsor entities are **unchanged** — they compose with the coordination layer, not replaced by it.

## Differentiators

What this makes possible that no existing tool does well.

| Gap in market | CSL coordination network answer |
|--------------|-------------------------------|
| Work crosses functional silos with no handoff protocol | Stable-state gate + structured Handoff record |
| Skilled individuals are invisible to orgs without warm intros | Opportunity discovery + AI match + headless delivery |
| Freelance/contract work has no proof layer | Phase outputs become portfolio artifacts automatically |
| Enterprise teams lose context at handoffs | Handoff notes + deliverable chain is the canonical record |
| Bounties and pay are informal and ad-hoc | BountyAllocation is first-class, released on delivery proof |
| Platform participation requires constant dashboard attention | Headless channel: work finds the worker |

## Implementation phasing

This is a Phase 5 addition to the existing [[lat.md/work-graph#Work graph#Phases (execution spine)]] — it builds on auth (Phase 4) and hardened APIs (Phase 2).

| Step | Depends on | Unlocks |
|------|-----------|---------|
| Project + Phase schema and services | Phase 2 APIs, Phase 4 auth | Multi-phase project coordination |
| Handoff protocol | Project + Phase | Stable-state gate, context transfer |
| Bounty allocation model | Handoff | Monetary incentives, pay-on-delivery |
| Opportunity discovery surface | Bounty + Player type | Talent finds work without gatekeeping |
| Headless channel (SMS/webhook) | Opportunity | No-UI participation |
| Coordination Dashboard (host) | All above | Enterprise org-level oversight |
| AI match scoring | Opportunity + Showcase signals | Personalized fit ranking |

See [[lat.md/work-graph#Work graph]] for where Phase 5 fits in the sequencing.
