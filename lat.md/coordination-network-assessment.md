# Coordination network — feasibility, value, and GTM assessment

Strategic evaluation of the coordination network enhancement across three dimensions: technical feasibility, product value, and go-to-market implications. References [[lat.md/coordination-network#Coordination network]] for the full spec.

---

## Feasibility

**Verdict: Technically feasible. Two components carry meaningful risk.**

The coordination network is not a moonshot — it extends a working domain model with well-understood patterns. The state machine (draft → stable → handed-off), headless command parsing, and AI matching all have clear engineering paths. Two components are harder than they look.

### Straightforward components

| Component | Complexity | Notes |
|-----------|-----------|-------|
| Project + Phase schema | Low–Medium | Extends existing Postgres schema; Phase lifecycle mirrors Challenge sprint model |
| Player type extension | Low | Enum addition + role assignment on Participant |
| Handoff record + stable-state gate | Medium | State machine enforcement; requires human reviewer in the loop |
| Headless channel (SMS) | Medium | Twilio inbound/outbound is well-documented; stateless command parsing is solved |
| Opportunity discovery surface | Medium | Query over open phases + bounty data; AI match score is additive |
| Coordination Dashboard UI | Medium | Extends existing host views; new data, not new architecture |

### Hard components

**Bounty / payment processing — this is the real engineering and compliance lift.**

Bounties sound like a feature. They are actually a financial product. Releasing money from an org to an individual on platform triggers:

- Payment processor integration (Stripe Connect or equivalent)
- Escrow-like hold logic (funds committed but not transferred until handoff acceptance)
- KYC/AML requirements for payees over IRS thresholds ($600+ USD triggers 1099-NEC)
- International transfer rules if participants are outside the US
- Dispute resolution when a handoff is rejected or a bounty is contested
- Tax reporting infrastructure

The safest early path is to treat bounties as **tracked commitments** rather than actual money movement — display the amount, enforce the contract socially, and let payment happen off-platform. This removes the compliance surface entirely while proving demand. Real payment rails come later when volume justifies the legal and engineering investment.

**Two-sided marketplace liquidity — this is the product and GTM risk.**

The coordination network requires both sides simultaneously: organizations posting projects with phases and budgets, and skilled individuals available to claim those phases. Both sides need to believe the other exists before they participate. This is the cold-start problem that kills most marketplaces. It is not an engineering problem — it is a sequencing and go-to-market problem (addressed below).

### Sequencing dependency

Phase 5 (coordination network) is gated on Phase 4 (auth + RBAC). Auth is currently the `critical` gap in [[lat.md/work-graph#Work graph#Known domain gaps (tracked)]]. The coordination network cannot ship meaningfully without participant identity — you cannot release a bounty to an anonymous submission.

**Realistic timeline to a working prototype:** auth shipped (Phase 4) + 3–4 months of focused Phase 5 engineering for the core loop (Project → Phase → Handoff → Opportunity discovery), excluding payment rails.

---

## Value

**Verdict: Genuinely differentiated. The value is real, but sequencing-dependent.**

Three specific value claims deserve honest scrutiny.

### High-value: the stable-state handoff protocol

This is the most original idea in the spec and the one most underserved by existing tools. The insight is that most cross-functional coordination fails not because people lack skill, but because work is passed between phases without a defined stable-state gate. Engineers hand off to marketing before the product is actually ready. Marketing hands off to delivery before the pipeline exists.

A hard, documented stable-state gate — where the outgoing team explicitly defines what "done" means and the incoming team accepts it before taking ownership — is something Jira, Asana, and Linear do not enforce. They track tasks; they do not enforce handoff quality. CSL's model makes the handoff a first-class record with deliverables attached, and that record becomes part of the portfolio of everyone involved.

This is strongest in the creative-to-commercial handoff (builder → amplifier) and the commercial-to-delivery handoff (amplifier → delivery). These are exactly the phases where context gets lost in most organizations.

### High-value: work finds the worker (headless + AI match)

The headless channel inverts the job board model. Instead of a skilled individual checking a platform for opportunities, the platform pushes a text message: "There is a phase you're a fit for. It pays $X. Here's the brief." The individual responds with a keyword and is in.

This is valuable for two reasons:

1. It lowers the friction barrier for participation to near-zero. A great engineer who would never sign up for another platform will respond to a text.
2. It creates a pull mechanic that no existing coordination tool has. The combination of AI match scoring from Showcase signals and SMS delivery is genuinely novel.

The risk: SMS-based participation is only as good as the match quality. A poorly matched opportunity delivered headlessly is spam. The AI match layer needs to be accurate before this becomes a growth asset rather than a churn driver.

### Medium-value: bounty as signal vs. actual income

Bounties matter most as **signal**, not necessarily as primary income. The number attached to a phase communicates how much the organization values the work. A $500 phase and a $5,000 phase communicate very different things about organizational commitment. Even if payment happens off-platform initially, the published bounty amount changes how skilled individuals evaluate whether to invest their time.

Over time, if platform volume justifies it, on-platform payment closes the loop and makes CSL a genuine income source for skilled individuals — not just a portfolio builder. That is a much stronger retention and acquisition story.

### Where value is weakest: early-stage two-sided dynamics

The coordination network's value to an organization is zero if there are no skilled individuals available to claim phases, and the value to a skilled individual is zero if no organizations are posting work. Both sides experience the platform as empty at launch. This is not a product flaw — it is a go-to-market execution challenge. The value is real once there is density; the question is how to get there.

---

## Go-to-market adjustments

**Verdict: The coordination network requires a new demand-side motion that the current GTM does not address. It should be treated as a product expansion with its own GTM track, not a feature addition to the existing roadmap.**

### Current GTM (from [[lat.md/rollout-strategy#Rollout strategy]])

The current model is supply-first and founder-led:

1. Founder as hero user (proof case)
2. Single-player early adopters (open source)
3. Community anchors (seed talent supply)
4. Challenge sponsors (add stakes and real briefs)
5. Distribution and hiring partners (demand at scale)

This is the right approach for the existing platform. It builds credibility before asking organizations to commit money.

### What the coordination network adds

The coordination network introduces a **demand-side ICP** that does not exist in the current model: organizations with real projects, real budgets, and a genuine coordination problem across functional phases. Serving this ICP requires a different sales motion, different onboarding, and different trust infrastructure than the current community-anchor model.

### Adjusted GTM sequence

The coordination network should be sequenced as a **second arc** that runs after the first arc (single-player, community anchors) establishes talent supply.

**Arc 1 (current plan — unchanged):** Establish talent supply.

- Founder hero use case → single-player early adopters → community anchors → initial sponsors
- Output: a pool of vetted, portfolio-bearing participants with demonstrated skills, visible on the platform

**Arc 2 (coordination network):** Introduce demand-side and activate the marketplace.

| Step | Action | Why this order |
|------|--------|---------------|
| 1 | Identify 3–5 pilot organizations | Not customers yet — design partners who stress-test the Phase/Handoff model |
| 2 | Run coordination pilots manually | Use the platform for the state machine, but a human (you or a CSM) facilitates the handoffs. Learn what breaks. |
| 3 | Publish the first coordinated project as a case study | Proof that the model works end-to-end; essential before asking orgs to pay |
| 4 | Open bounty posting to vetted orgs (commitment model) | Bounties as tracked commitments first; no payment rails yet |
| 5 | Launch headless channel to existing participant base | Existing participants are the supply; push matched opportunities via SMS |
| 6 | Add payment rails when volume justifies compliance investment | At this point, bounties are flowing and orgs are proving willingness to pay |

### New messaging needed

The current positioning ("hero tool for creatives and technologists") speaks to individuals. The coordination network requires messaging that speaks to the organizations who post work. Two distinct value propositions need to coexist:

**For individuals (current):** "Demonstrate your capability, build a portfolio of real work, get found without warm introductions."

**For organizations (new):** "Post a project, define the phases, fund the bounties, and let the platform match skilled individuals to each phase — with documented handoffs and proof of delivery."

These are not in conflict, but they require separate landing surfaces, separate onboarding flows, and potentially separate pricing tiers.

### Pricing model implications

The current platform has no explicit revenue model documented. The coordination network creates two monetization levers:

| Lever | Model | When |
|-------|-------|------|
| Organization subscription | Flat monthly fee to post projects and access the talent pool | Arc 2 launch |
| Platform take rate on bounties | 5–15% of bounty value when payment flows through the platform | When payment rails ship |
| Premium match / priority placement | Orgs pay for higher-quality AI matching or priority visibility | Later |

The subscription model is simpler and avoids payment compliance in the early stages. The take rate becomes the larger revenue line at scale.

### Competitive positioning

The coordination network puts CSL in conversation with tools it was not competing with before:

| Tool | What they do | CSL's angle |
|------|-------------|-------------|
| Upwork / Fiverr | Freelance marketplace | CSL adds portfolio proof, stable-state gates, and multi-phase project structure — not task-by-task gig work |
| Jira / Asana / Linear | Project tracking | CSL adds talent acquisition and portfolio accrual — not just task tracking for existing teams |
| Contra / Toptal | Curated freelance networks | CSL is open and meritocratic, not invite-only or agency-model |
| Notion / Confluence | Documentation | CSL makes the handoff a live protocol with money attached, not a passive doc |

The cleanest differentiation statement: **CSL is the only platform where demonstrating capability, coordinating work across phases, and earning money for delivery are the same action.** Portfolio, coordination, and compensation are unified. No other tool does all three.

---

## Summary judgment

| Dimension | Assessment |
|-----------|-----------|
| Technical feasibility | Yes — core loop is 3–4 months post-auth. Bounty payment rails are a separate workstream with compliance overhead; defer until volume justifies it. |
| Product value | Real and differentiated — stable-state handoff and headless opportunity matching are genuinely novel. Value depends on marketplace density, which is a GTM execution problem. |
| GTM adjustment required | Significant but sequenceable — add a demand-side motion (org partnerships, pilot coordination) as Arc 2 after talent supply is established. Do not launch the marketplace before supply is credible. |
| Biggest risk | Cold-start on both sides of the marketplace. Mitigated by running the first cohort of coordinated projects manually, treating early orgs as design partners, and using the existing participant base as supply. |
| Recommendation | Proceed with spec and design. Defer bounty payment rails. Identify 3–5 pilot org partners now so that when auth and Phase 5 core loop ship, there is a real demand side ready to activate. |
