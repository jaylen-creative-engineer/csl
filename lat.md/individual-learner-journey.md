# Individual learner journey

Solo-first customer behavior: skill mastery, AI-coordinated paths, accountability, and the backbone of single-player mode ([[lat.md/product-vision#Product vision#Two interaction patterns#Single-player mode]]).

Choose a skill, receive mastery-oriented guidance (including AI-coordinated paths), execute with resources and accountability, while optional social layers add collaboration and competition ([[lat.md/product-vision#Product vision#North star]]).

## Behavior vision

The learner acts as an **individual** who wants to **learn skill X**. In single-player mode, this is the entire product: one person, one tool, long-range creative vision and strategic daily execution. The product supports that intent with:

1. **Long-range vision and strategy** — define where you want to be, establish the path to get there, and hold that vision alongside daily execution. Balance future goals with wellness, relationships, and the execution factor.
2. **Mastery-oriented progression** — goals and proficiency are framed around demonstrated competence, not vanity metrics alone (aligned with challenge scoring and portfolio signals).
3. **AI-coordinated selection** — an intelligent layer proposes **frameworks**, **plans**, and **paths** the learner can execute, coordinated with their skill intent and evidence of progress.
4. **Resources** — curated or linked materials tied to plan steps (briefs, exemplars, tooling, sponsor content where relevant).
5. **Accountability** — commitments, milestones, deadlines, and lightweight checks so execution stays on track (compatible with sprint deadlines and submission artifacts).
6. **Social experience** — optional **collaboration** (cohorts, critique, shared briefs) and **competition** (leaderboards, ranked sprints) that **inspire** without replacing the solo learning arc. This is the bridge to network mode ([[lat.md/product-vision#Product vision#Two interaction patterns#Network mode]]).

CSL's existing proof-of-skill loop (challenges → artifacts → scored criteria → portfolio / leaderboard) is the **spine**; the features below extend it into this fuller journey.

## Single-player mode alignment

The individual learner journey is what ships as single-player mode ([[lat.md/rollout-strategy#Rollout strategy#Interaction patterns#Single-player mode (open source)]]). The open-source, downloadable experience must deliver value at this layer alone — no network, no community, no league host required.

| Single-player capability | Learner journey feature |
|--------------------------|------------------------|
| Define long-range creative vision | Skill intent & profile |
| Establish strategy | Learning plans, path variants |
| Execute daily | Commitments & milestones, progress prompts |
| Review and rebalance | AI-coordinated adaptive next actions |
| Track evidence | Portfolio, evidence timeline, completion receipts |

## Skill intent & mastery framing

Express "I want skill X," map to domains/criteria, and show momentum toward mastery.

| Feature idea | Customer behavior supported |
|--------------|----------------------------|
| Skill intent & profile | Declare focus areas; tie to disciplines/criteria ([[lat.md/domain-model#Domain model#Entities#Participant]]) |
| Mastery map / rubric view | See proficiency dimensions derived from scored work, not only badges |
| Evidence timeline | Artifacts and outcomes ordered by sprint and skill dimension |

## AI-coordinated guidance

An AI layer orchestrates what to do next, grounded in platform evidence and resources.

| Feature idea | Customer behavior supported |
|--------------|----------------------------|
| Path recommendation | Rank plans/paths for skill X given history, gaps, and league context |
| Plan synthesis | Turn frameworks + host/sponsor constraints into actionable steps |
| Adaptive next actions | Rebalance path after scores, withdrawals, or new challenges |

## Frameworks, plans, and paths

Structured templates learners execute against; connect hosts and sponsors to reusable patterns.

| Feature idea | Customer behavior supported |
|--------------|----------------------------|
| Framework library | Reusable approaches (e.g. critique grids, production pipelines) attached to skills |
| Learning plans | Time-bounded sequences with milestones linked to challenges |
| Path variants | Branching options (depth vs breadth, solo vs optionally social) |

## Resources

Materials and references tied to skill intent and plan steps.

| Feature idea | Customer behavior supported |
|--------------|----------------------------|
| Step-linked resources | Readings, exemplars, asset packs per plan step |
| Challenge-linked briefs | Sponsor and host briefs as learning substrate ([[lat.md/domain-model#Domain model#Entities#Sponsor]]) |
| Portfolio exemplars | Showcase entries as reference quality for skill X |

## Accountability

Milestones, nudges, and proof of follow-through so solo learners stay on path.

| Feature idea | Customer behavior supported |
|--------------|----------------------------|
| Commitments & milestones | Goals tied to dates or sprint boundaries |
| Progress prompts | Nudges based on plan drift or upcoming deadlines |
| Completion receipts | Submissions and scores as proof of milestone completion |

## Social layer — collaboration & competition

Social features **wrap** the solo journey: inspiration, rivalry, and co-creation without forcing group work. This is the transition point from single-player to network mode ([[lat.md/rollout-strategy#Rollout strategy#Interaction patterns#Network mode (community platform)]]).

| Feature idea | Customer behavior supported |
|--------------|----------------------------|
| Cohort & critique flows | Optional peers, async feedback, team challenges |
| Competitive surfaces | Leaderboards, ranked seasons, sponsor-visible excellence ([[lat.md/product-vision#Product vision#Collective playground]]) |
| Inspiration graph | Follow leagues, hosts, or exemplar learners; remix prompts |

## Relation to current product

Today: leagues, challenge sprints, scoring, portfolio, skill signals, sponsor briefs — see [[lat.md/current-system#Current system#Capabilities implemented]]. The rows above are **target capabilities** to implement incrementally; sequencing stays anchored to [[lat.md/work-graph#Work graph#Phases (execution spine)]].
