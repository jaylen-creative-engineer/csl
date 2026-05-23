import process from "node:process";
import { confirm, input, select, checkbox, Separator } from "@inquirer/prompts";
import { $ } from "zx";
import { Discipline } from "../src/league-model/types.js";
import type { Submission } from "../src/challenge-intelligence/types.js";
import { SponsorOutcomeStatus } from "../src/sponsor-intelligence/types.js";
import {
  createRuntime,
  fail,
  j,
  listDisciplines,
  ok,
} from "./shared.js";

function avgScore(s: Submission): number {
  const scores = s.scores ?? [];
  return scores.length === 0 ? 0 : scores.reduce((sum, x) => sum + x.totalScore, 0) / scores.length;
}

$.verbose = false;

type RoleOption = "member" | "steward";

export async function startInteractive(): Promise<void> {
  const rt = createRuntime();
  let running = true;

  while (running) {
    const action = await select({
      message: "CSL — choose an action",
      choices: [
        { name: "Guided demo (domain happy path)", value: "guided" },
        new Separator("── Learner journey ──"),
        { name: "Set my skill goal", value: "skill-goal" },
        { name: "View my progress", value: "progress" },
        { name: "Recommend a path (AI)", value: "recommend" },
        { name: "Set a milestone", value: "milestone-set" },
        { name: "What's due?", value: "milestone-due" },
        new Separator("── Platform ──"),
        { name: "Discovery: browse hosts, leagues, challenges", value: "discovery" },
        { name: "Listings: create/list", value: "listings" },
        { name: "Matching: run/list/accept/reject", value: "matching" },
        { name: "Agreements: create/list/confirm/complete/dispute", value: "agreements" },
        { name: "Sponsors: create/attach/outcome/summary", value: "sponsors" },
        { name: "Reputation: score + events", value: "reputation" },
        { name: "Session: actor/roles", value: "session" },
        { name: "Reset runtime (new session)", value: "reset" },
        new Separator(),
        { name: "Tools: run typecheck/tests", value: "tools" },
        { name: "Exit", value: "exit" },
      ],
    });

    if (action === "exit") {
      running = false;
      continue;
    }

    if (action === "guided") {
      await guidedFlow(rt);
      continue;
    }

    if (action === "skill-goal") {
      await skillGoalFlow(rt);
      continue;
    }

    if (action === "progress") {
      await progressFlow(rt);
      continue;
    }

    if (action === "recommend") {
      await recommendFlow(rt);
      continue;
    }

    if (action === "milestone-set") {
      await milestoneSetFlow(rt);
      continue;
    }

    if (action === "milestone-due") {
      await milestoneDueFlow(rt);
      continue;
    }

    if (action === "discovery") {
      await discoveryMenu(rt);
      continue;
    }

    if (action === "listings") {
      await listingsMenu(rt);
      continue;
    }

    if (action === "matching") {
      await matchingMenu(rt);
      continue;
    }

    if (action === "agreements") {
      await agreementsMenu(rt);
      continue;
    }

    if (action === "sponsors") {
      await sponsorsMenu(rt);
      continue;
    }

    if (action === "reputation") {
      await reputationMenu(rt);
      continue;
    }

    if (action === "session") {
      await sessionMenu(rt);
      continue;
    }

    if (action === "reset") {
      rt.reset();
      console.log(j(ok({ message: "runtime reset complete" })));
      continue;
    }

    if (action === "tools") {
      await toolsMenu();
    }
  }
}

type RuntimeLike = ReturnType<typeof createRuntime>;

async function discoveryMenu(rt: RuntimeLike): Promise<void> {
  const action = await select({
    message: "Discovery",
    choices: [
      { name: "List all hosts", value: "hosts" },
      { name: "List all leagues", value: "leagues" },
      { name: "List challenges for a league", value: "challenges" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  try {
    if (action === "hosts") {
      const hosts = await rt.leagueService.listHosts();
      console.log(j(ok({ action, count: hosts.length, hosts })));
      return;
    }

    if (action === "leagues") {
      const leagues = await rt.leagueService.listLeagues();
      console.log(j(ok({ action, count: leagues.length, leagues })));
      return;
    }

    if (action === "challenges") {
      const league = rt.state.leagues[0];
      if (!league) {
        console.log(j(fail("No league in session — create one first via Listings or Guided demo")));
        return;
      }
      const leagueId = await input({ message: "League ID", default: league.id });
      const challenges = await rt.challengeService.getChallengesForLeague(leagueId);
      console.log(j(ok({ action, leagueId, count: challenges.length, challenges })));
    }
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function sponsorsMenu(rt: RuntimeLike): Promise<void> {
  const action = await select({
    message: "Sponsors",
    choices: [
      { name: "Create sponsor", value: "create" },
      { name: "Attach to challenge", value: "attach" },
      { name: "Record outcome", value: "outcome" },
      { name: "View sponsor summary", value: "summary" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  try {
    if (action === "create") {
      const name = await input({ message: "Sponsor name", default: "Demo Sponsor" });
      const organization = await input({ message: "Organization", default: name });
      const contactEmail = await input({ message: "Contact email", default: "sponsor@example.com" });
      const sponsor = await rt.sponsorService.createSponsor({ name, organization, contactEmail });
      rt.state.sponsors.push(sponsor);
      console.log(j(ok({ action, sponsor })));
      return;
    }

    if (action === "attach") {
      const sponsor = rt.state.sponsors[0];
      if (!sponsor) {
        console.log(j(fail("Create a sponsor first")));
        return;
      }
      const challenge = rt.state.challenges[0];
      if (!challenge) {
        console.log(j(fail("Create a challenge first")));
        return;
      }
      const headline = await input({ message: "Brief headline", default: "Sponsor Brief" });
      const description = await input({ message: "Brief description", default: "Creative direction" });
      const attachment = await rt.sponsorService.attachToChallenge(sponsor.id, challenge.id, {
        headline,
        description,
        deliverables: ["deliverable"],
      });
      rt.state.attachments.push(attachment);
      console.log(j(ok({ action, attachment })));
      return;
    }

    if (action === "outcome") {
      const latest = rt.state.attachments[rt.state.attachments.length - 1];
      if (!latest) {
        console.log(j(fail("Attach a sponsor to a challenge first")));
        return;
      }
      const status = await select({
        message: "Outcome status",
        choices: [
          { name: "Delivered", value: SponsorOutcomeStatus.Delivered },
          { name: "Pending", value: SponsorOutcomeStatus.Pending },
          { name: "Cancelled", value: SponsorOutcomeStatus.Cancelled },
        ],
      });
      const notes = await input({ message: "Notes", default: "" });
      const updated = await rt.sponsorService.recordOutcome(latest.id, { status, notes });
      console.log(j(ok({ action, updated })));
      return;
    }

    if (action === "summary") {
      const sponsor = rt.state.sponsors[0];
      if (!sponsor) {
        console.log(j(fail("Create a sponsor first")));
        return;
      }
      const summary = await rt.sponsorService.getSponsorSummary(sponsor.id);
      console.log(j(ok({ action, sponsorId: sponsor.id, summary })));
    }
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function listingsMenu(rt: RuntimeLike): Promise<void> {
  const action = await select({
    message: "Listings",
    choices: [
      { name: "Create listing (challenge)", value: "create-listing" },
      { name: "List listings by league/community", value: "list-listings" },
      { name: "Create participant", value: "create-participant" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  try {
    if (action === "create-participant") {
      const handle = await input({ message: "Participant handle", default: "@member" });
      const discipline = await select({
        message: "Discipline",
        choices: listDisciplines().map((d) => ({ name: d, value: d })),
      });
      const participant = await rt.leagueService.createParticipant({
        handle,
        discipline: discipline as Discipline,
      });
      rt.state.participants.push(participant);
      console.log(j(ok({ action, participant })));
      return;
    }

    const host = rt.state.hosts[0] ??
      (await rt.leagueService.createLeagueHost({
        name: "CLI Host",
        organization: "CLI Org",
      }));
    if (!rt.state.hosts.find((h) => h.id === host.id)) rt.state.hosts.push(host);

    const league = rt.state.leagues[0] ??
      (await rt.leagueService.createLeague({
        name: "CLI League",
        hostId: host.id,
      }));
    if (!rt.state.leagues.find((l) => l.id === league.id)) {
      rt.state.leagues.push(league);
      await rt.leagueService.activateLeague(league.id);
    }

    if (action === "create-listing") {
      const title = await input({ message: "Challenge title", default: "CLI Listing" });
      const prompt = await input({ message: "Challenge prompt", default: "Validate behavior flow" });
      const deadline = await input({ message: "Deadline YYYY-MM-DD", default: "2026-12-31" });

      const listing = await rt.challengeService.createChallenge({
        leagueId: league.id,
        title,
        prompt,
        deadline,
      });
      rt.state.challenges.push(listing);
      console.log(j(ok({ action, leagueId: league.id, listing })));
      return;
    }

    if (action === "list-listings") {
      const listings = rt.state.challenges.filter((c) => c.leagueId === league.id);
      console.log(j(ok({ action, leagueId: league.id, listings })));
    }
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function matchingMenu(rt: RuntimeLike): Promise<void> {
  const action = await select({
    message: "Matching",
    choices: [
      { name: "Run matching engine (rank current submissions)", value: "run-engine" },
      { name: "List candidates", value: "list" },
      { name: "Accept top candidate (demo)", value: "accept" },
      { name: "Reject top candidate (demo)", value: "reject" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  const candidates = rt.state.submissions
    .filter((s) => (s.scores?.length ?? 0) > 0)
    .sort((a, b) => avgScore(b) - avgScore(a))
    .map((s) => ({
      submissionId: s.id,
      participantId: s.participantId,
      score: avgScore(s),
      status: "pending",
    }));

  if (action === "run-engine" || action === "list") {
    console.log(j(ok({ action, candidates })));
    return;
  }

  if (action === "accept") {
    const accepted = candidates[0] ? { ...candidates[0], status: "accepted" } : null;
    console.log(j(ok({ action, accepted })));
    return;
  }

  if (action === "reject") {
    const rejected = candidates[0] ? { ...candidates[0], status: "rejected" } : null;
    console.log(j(ok({ action, rejected })));
  }
}

async function agreementsMenu(rt: RuntimeLike): Promise<void> {
  const action = await select({
    message: "Agreements",
    choices: [
      { name: "List agreements", value: "list" },
      { name: "Create agreement from top candidate", value: "create" },
      { name: "Confirm agreement", value: "confirm" },
      { name: "Complete agreement", value: "complete" },
      { name: "Dispute agreement", value: "dispute" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  const agreements = rt.state.attachments.map((a) => ({
    id: `agreement:${a.id}`,
    sponsorId: a.sponsorId,
    challengeId: a.challengeId,
    status: a.outcome?.status ?? "pending",
  }));

  if (action === "list") {
    console.log(j(ok({ action, agreements })));
    return;
  }

  if (action === "create") {
    const sponsor = rt.state.sponsors[0] ??
      (await rt.sponsorService.createSponsor({
        name: "CLI Sponsor",
        organization: "CLI Org",
        contactEmail: "cli@example.com",
      }));
    if (!rt.state.sponsors.find((s) => s.id === sponsor.id)) rt.state.sponsors.push(sponsor);

    const challenge = rt.state.challenges[0];
    if (!challenge) {
      console.log(j(fail("Create a listing/challenge first")));
      return;
    }

    const attachment = await rt.sponsorService.attachToChallenge(sponsor.id, challenge.id, {
      headline: "CLI Agreement",
      description: "Auto-generated agreement",
      deliverables: ["demo deliverable"],
    });
    rt.state.attachments.push(attachment);
    console.log(j(ok({ action, agreement: attachment })));
    return;
  }

  const latest = rt.state.attachments[rt.state.attachments.length - 1];
  if (!latest) {
    console.log(j(fail("No agreement exists yet")));
    return;
  }

  const status =
    action === "confirm"
      ? SponsorOutcomeStatus.Pending
      : action === "complete"
        ? SponsorOutcomeStatus.Delivered
        : SponsorOutcomeStatus.Cancelled;
  const updated = await rt.sponsorService.recordOutcome(latest.id, { status, notes: `set via ${action}` });
  console.log(j(ok({ action, updated })));
}

async function reputationMenu(rt: RuntimeLike): Promise<void> {
  const participant = rt.state.participants[0];
  if (!participant) {
    console.log(j(fail("Create participant first")));
    return;
  }

  const portfolio = await rt.showcaseService.buildPortfolio(participant.id);
  const score = portfolio.aggregateScore;
  const subs = await rt.challengeService.getSubmissionsForParticipant(participant.id);
  const events = subs.map((s) => ({ submissionId: s.id, scored: (s.scores?.length ?? 0) > 0 ? avgScore(s) : null }));

  console.log(j(ok({ participantId: participant.id, score, events })));
}

async function sessionMenu(rt: RuntimeLike): Promise<void> {
  const actorMemberId = await input({
    message: "Actor member id",
    default: rt.session.actorMemberId,
  });
  const isSteward = await confirm({
    message: "Include steward role?",
    default: rt.session.roles.includes("steward"),
  });

  const roles: RoleOption[] = ["member"];
  if (isSteward) roles.push("steward");

  rt.session.actorMemberId = actorMemberId;
  rt.session.roles = roles;

  console.log(j(ok({ session: rt.session })));
}

async function guidedFlow(rt: RuntimeLike): Promise<void> {
  try {
    const shouldRun = await confirm({
      message: "Run guided end-to-end demo path now?",
      default: true,
    });
    if (!shouldRun) return;

    const host = await rt.leagueService.createLeagueHost({
      name: "Guided Host",
      organization: "Guided Org",
    });
    const league = await rt.leagueService.createLeague({
      name: "Guided League",
      hostId: host.id,
    });
    await rt.leagueService.activateLeague(league.id);
    rt.state.hosts.push(host);
    rt.state.leagues.push(league);
    console.log(j(ok({ step: "league", host, league })));

    const participant = await rt.leagueService.createParticipant({
      handle: `@guided-${Date.now()}`,
      discipline: Discipline.Design,
    });
    rt.state.participants.push(participant);
    const enrollment = await rt.leagueService.enrollParticipant(league.id, participant.id);
    console.log(j(ok({ step: "member", participant, enrollment })));

    const challenge = await rt.challengeService.createChallenge({
      leagueId: league.id,
      title: "Guided Challenge",
      prompt: "Walk through app flow",
      deadline: "2026-12-31",
      scoringCriteria: [{ name: "Quality", weight: 1 }],
    });
    rt.state.challenges.push(challenge);
    await rt.challengeService.openChallenge(challenge.id);
    const submission = await rt.challengeService.submitEntry(challenge.id, participant.id, {
      artifact: { url: "https://example.com/guided", description: "guided artifact" },
      isPublic: true,
    });
    rt.state.submissions.push(submission);
    await rt.challengeService.closeForJudging(challenge.id);
    const scored = await rt.challengeService.scoreSubmission(submission.id, {
      judgeId: "judge:guided",
      rationale: "guided",
      criteriaScores: [{ criteriaName: "Quality", score: 91 }],
    });
    await rt.challengeService.completeChallenge(challenge.id);
    console.log(j(ok({ step: "challenge", challenge, scored })));

    console.log(j(ok({ step: "leaderboard", leaderboard: await rt.challengeService.getLeaderboard(challenge.id) })));
    console.log(j(ok({ step: "showcase", feed: await rt.showcaseService.getShowcaseFeed(league.id) })));
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function toolsMenu(): Promise<void> {
  const action = await select({
    message: "Tools",
    choices: [
      { name: "Run typecheck", value: "typecheck" },
      { name: "Run tests", value: "tests" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  const proceed = await confirm({
    message: "This can take a while. Continue?",
    default: false,
  });
  if (!proceed) return;

  try {
    if (action === "typecheck") {
      await $`npm run typecheck`;
      console.log(j(ok({ action, status: "completed" })));
      return;
    }

    if (action === "tests") {
      await $`npm test`;
      console.log(j(ok({ action, status: "completed" })));
    }
  } catch (error) {
    console.error(j(fail(error)));
  }
}

// ── Learner journey flows ────────────────────────────────────

function requireParticipant(rt: RuntimeLike): { id: string; handle: string } | null {
  const participant = rt.state.participants[0];
  if (!participant) {
    console.log(j(fail("Create a participant first via Listings or Guided demo")));
    return null;
  }
  return participant;
}

async function skillGoalFlow(rt: RuntimeLike): Promise<void> {
  try {
    const participant = requireParticipant(rt);
    if (!participant) return;

    const label = await input({ message: "Skill goal label", default: "Visual storytelling" });
    const disciplines = await checkbox({
      message: "Disciplines (space to select, enter to confirm)",
      choices: listDisciplines().map((d) => ({ name: d, value: d })),
    });

    const intent = await rt.skillIntentService.createSkillIntent(participant.id, label, disciplines);
    console.log(j(ok({ action: "skill-goal", intent })));
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function progressFlow(rt: RuntimeLike): Promise<void> {
  try {
    const participant = rt.state.participants[0];
    if (!participant) {
      console.log(
        j(ok({
          action: "progress",
          message: "No participant in session.",
          hint: "Create a participant via Listings, or set a skill goal first.",
        }))
      );
      return;
    }

    const result: Record<string, unknown> = { action: "progress" };

    const intent = await rt.skillIntentService.getSkillIntent(participant.id);
    if (intent) {
      result.skillIntent = intent;
    }

    const mastery = await rt.skillIntentService.getMasteryMap(participant.id);
    if (mastery.length > 0) {
      result.mastery = mastery;
    }

    const subs = await rt.challengeService.getSubmissionsForParticipant(participant.id);
    const scored = subs.filter((s: Submission) => (s.scores?.length ?? 0) > 0);
    result.participant = { id: participant.id, handle: participant.handle };
    result.submissions = subs.length;
    result.scoredSubmissions = scored.length;
    if (scored.length > 0) {
      const avg = scored.reduce((sum: number, s: Submission) => sum + avgScore(s), 0) / scored.length;
      result.averageScore = Math.round(avg * 10) / 10;
    } else {
      result.averageScore = null;
      result.hint = "Complete a scored challenge to see your score here.";
    }

    console.log(j(ok(result)));
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function recommendFlow(rt: RuntimeLike): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      j(ok({
        action: "recommend",
        message: "ANTHROPIC_API_KEY is not set — AI recommendations are unavailable.",
        hint: "Add ANTHROPIC_API_KEY to .env.local and restart the CLI.",
        fallback: [
          "1. Set a concrete skill goal with a deadline.",
          "2. Find an open challenge that exercises that skill.",
          "3. Submit an entry and request scored feedback.",
          "4. Repeat: each sprint adds a public artifact to your portfolio.",
        ],
      }))
    );
    return;
  }

  const participant = rt.state.participants[0];
  let goalSummary = "no specific goals set yet";
  if (participant) {
    const intent = await rt.skillIntentService.getSkillIntent(participant.id);
    if (intent) {
      goalSummary = `${intent.skillLabel} (${intent.targetDisciplines.join(", ")})`;
    }
  }

  console.log("[CSL] Calling AI for a personalized recommendation...");

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a creative-skills coach. The user's current skill goals: ${goalSummary}. Give a concrete 3-step learning path in under 150 words — actionable, specific, no fluff.`,
        },
      ],
    });
    const textBlock = msg.content.find((c) => c.type === "text" && "text" in c) as
      | { type: "text"; text: string }
      | undefined;
    const text = textBlock?.text ?? "(no response)";
    console.log(j(ok({ action: "recommend", recommendation: text })));
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function milestoneSetFlow(rt: RuntimeLike): Promise<void> {
  try {
    const participant = requireParticipant(rt);
    if (!participant) return;

    const plans = await rt.learningService.listPlansForParticipant(participant.id);
    let planId: string;

    if (plans.length === 0) {
      const plan = await rt.learningService.createPlan(participant.id, undefined, undefined, undefined);
      planId = plan.id;
      console.log(j(ok({ action: "plan-created", plan })));
    } else {
      planId = plans[0]!.id;
    }

    const description = await input({ message: "Milestone description", default: "Finish challenge draft" });
    const dueDate = await input({
      message: "Due date (YYYY-MM-DD)",
      default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    const milestone = await rt.learningService.addMilestone(planId, description, dueDate);
    console.log(j(ok({ action: "milestone-set", milestone })));
  } catch (error) {
    console.error(j(fail(error)));
  }
}

async function milestoneDueFlow(rt: RuntimeLike): Promise<void> {
  try {
    const participant = requireParticipant(rt);
    if (!participant) return;

    const { overdue, upcoming } = await rt.learningService.checkMilestonesDue(participant.id);

    console.log(
      j(ok({
        action: "milestone-due",
        overdue: overdue.map((m) => ({ id: m.id, description: m.description, dueDate: m.dueDate })),
        upcomingNext7Days: upcoming.map((m) => ({ id: m.id, description: m.description, dueDate: m.dueDate })),
      }))
    );
  } catch (error) {
    console.error(j(fail(error)));
  }
}

process.on("SIGINT", () => {
  process.exit(0);
});
