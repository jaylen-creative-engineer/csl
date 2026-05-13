# Rollout strategy

How CSL goes from internal hero tool to public platform: interaction patterns, announcement timeline, and adoption sequence ([[lat.md/product-vision#Product vision#North star]]).

## Positioning

CSL is announced as the **hero tool** a creative technologist has been using for long-range vision and daily execution.

The announcement is first-person: "I built this, I used it, here is what it does, and now it is yours." The target audience spans four archetypes:

| Archetype | What they get from CSL |
|-----------|----------------------|
| **Creative** | A structured path to prove skill publicly and build a portfolio of real work |
| **Technologist** | A framework for long-range technical goals with execution cadence |
| **Analyst** | Signal-rich data from scored work, leaderboards, and sponsor outcomes |
| **Synthesizer** | A system that balances vision, strategy, wellness, relationships, and execution |

## Interaction patterns

Two modes of engagement, each self-sufficient but designed to compound when combined.

### Single-player mode (open source)

The downloadable, self-hosted experience. One person, one API key, one running environment.

| Attribute | Detail |
|-----------|--------|
| **Distribution** | Open-source repository; clone, configure, run |
| **Setup** | Add API key → environment is up and ready |
| **Core loop** | Define long-range creative vision → establish strategy → execute daily → review and rebalance |
| **Value** | Personal goal management, strategic execution tracking, wellness-aware pacing |
| **Dependencies** | None beyond the tool itself and an API key |

Single-player mode is the foundation. It must be compelling alone — no network required. Maps to [[lat.md/individual-learner-journey#Individual learner journey#Behavior vision]].

**Engineering requirements for single-player:**

- Frictionless local setup (documented in README, `.env.local.example`)
- API key configuration as the only external dependency
- Core workflows operational without Supabase cloud (local Supabase or SQLite fallback as stretch)
- CLI and/or web UI for goal setting, strategy definition, and execution tracking

### Network mode (community platform)

The multi-player experience. Communities of people joining, interacting, and building the Creative Sports League network.

| Attribute | Detail |
|-----------|--------|
| **Distribution** | Hosted platform or self-hosted with network features enabled |
| **Core loop** | Demonstrate capability → get feedback → find moments to execute → build reputation |
| **Value** | Meritocratic visibility, community feedback, sponsor and hiring signal, removal of gatekeeping |
| **Dependencies** | Supabase cloud, Auth, league hosts, community anchors |

Network mode is where the anti-gatekeeping thesis comes alive. Talent surfaces through demonstrated work, not warm introductions. Maps to [[lat.md/product-vision#Product vision#Two interaction patterns#Network mode]].

**Engineering requirements for network mode:**

- Auth and identity (Supabase Auth, participant → user linkage)
- Public profiles and portfolios
- League discovery and enrollment
- Showcase feed with network-wide visibility
- Sponsor and hiring organization interfaces

## Announcement timeline

Phased public introduction: optional Q3 soft announcement, then Q4 full launch with both interaction patterns.

### Q3 — Soft announcement (optional)

Introduce that the tool exists and preview its capabilities. Anchor the narrative in first-person use: "I have been using this tool as a creative technologist."

| Element | Content |
|---------|---------|
| **Narrative** | First-person story of using CSL for long-range creative goals |
| **Proof** | Artifacts, portfolio entries, and execution evidence from the founder's use |
| **Scope** | Awareness and anticipation; limited or no public access yet |

### Q4 — Public launch

Wide sharing of CSL with both interaction patterns available.

| Element | Content |
|---------|---------|
| **Single-player** | Open-source repo available; README-driven onboarding; API key setup |
| **Network** | Community sign-up; first hosted leagues; sponsor briefs |
| **Narrative** | "This tool exists with capabilities to enable creatives, technologists, analysts, and synthesizers to define a long-range creative vision, establish strategy, and execute" |
| **Proof** | Founder as hero user case study; early adopter testimonials if available |

## Adoption sequence

Mirrors the strategic sequencing from the product design, now mapped to rollout phases.

1. **Founder as hero user** — first-person proof that the tool works for long-range creative vision and strategic execution
2. **Single-player early adopters** — open-source users who download, configure, and use independently
3. **Community anchors** — meetup groups, design schools, local orgs who seed the network with talent supply
4. **Challenge sponsors** — real stakes and briefs that give output legitimacy
5. **Distribution and hiring partners** — reward for network density, not a way to create it

## Relation to engineering phases

Maps each rollout milestone to the engineering phase it depends on.

| Rollout milestone | Engineering dependency |
|-------------------|----------------------|
| Founder hero use | Current system ([[lat.md/current-system#Current system#Capabilities implemented]]) + CLI |
| Single-player open source | Frictionless setup, documented onboarding, API key config |
| Network soft launch | Auth ([[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 4 — Auth, RBAC, observability]]), public profiles, league discovery |
| Q4 public launch | UX workflows ([[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 3 — UX workflows]]), API hardening ([[lat.md/work-graph#Work graph#Phases (execution spine)#Phase 2 — API routes]]) |

## Anti-gatekeeping design principles

Architectural and product decisions that reinforce the core thesis.

- **Public by default** — showcase feed, portfolios, and leaderboards are visible without login
- **Merit-based signal** — scoring derives from criteria, not self-reported claims or endorsements
- **No warm-intro requirement** — sponsors and hiring orgs discover talent through platform evidence
- **Open source** — the tool itself is accessible to anyone; no permission needed to start
- **Portable reputation** — portfolio and skill signals belong to the participant, not the platform
