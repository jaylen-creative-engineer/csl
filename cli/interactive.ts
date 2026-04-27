import process from "node:process";
import { confirm, input, select, Separator } from "@inquirer/prompts";
import { $ } from "zx";
import { Discipline } from "../src/league-model/types.js";
import { createRuntime, fail, j, listDisciplines, ok } from "./shared.js";

$.verbose = false;

type RoleOption = "member" | "steward";

export async function startInteractive(): Promise<void> {
  const rt = createRuntime();
  let running = true;

  while (running) {
    const action = await select({
      message: "CSL validation CLI — choose an action",
      choices: [
        { name: "Guided demo (domain happy path)", value: "guided" },
        new Separator(),
        { name: "Listings: create/list", value: "listings" },
        { name: "Matching: run/list/accept/reject", value: "matching" },
        { name: "Agreements: create/list/confirm/complete/dispute", value: "agreements" },
        { name: "Reputation: score + events", value: "reputation" },
        { name: "Session: actor/roles", value: "session" },
        { name: "Reset in-memory runtime", value: "reset" },
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
      const participant = rt.leagueService.createParticipant({
        handle,
        discipline: discipline as Discipline,
      });
      rt.state.participants.push(participant);
      console.log(j(ok({ action, participant })));
      return;
    }

    const host = rt.state.hosts[0] ??
      rt.leagueService.createLeagueHost({
        name: "CLI Host",
        organization: "CLI Org",
      });
    if (!rt.state.hosts.find((h) => h.id === host.id)) rt.state.hosts.push(host);

    const league = rt.state.leagues[0] ??
      rt.leagueService.createLeague({
        name: "CLI League",
        hostId: host.id,
      });
    if (!rt.state.leagues.find((l) => l.id === league.id)) {
      rt.state.leagues.push(league);
      rt.leagueService.activateLeague(league.id);
    }

    if (action === "create-listing") {
      const title = await input({ message: "Challenge title", default: "CLI Listing" });
      const prompt = await input({ message: "Challenge prompt", default: "Validate behavior flow" });
      const deadline = await input({ message: "Deadline YYYY-MM-DD", default: "2026-12-31" });

      const listing = rt.challengeService.createChallenge({
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
    .filter((s) => s.score)
    .sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0))
    .map((s) => ({
      submissionId: s.id,
      participantId: s.participantId,
      score: s.score?.totalScore ?? 0,
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
      rt.sponsorService.createSponsor({
        name: "CLI Sponsor",
        organization: "CLI Org",
        contactEmail: "cli@example.com",
      });
    if (!rt.state.sponsors.find((s) => s.id === sponsor.id)) rt.state.sponsors.push(sponsor);

    const challenge = rt.state.challenges[0];
    if (!challenge) {
      console.log(j(fail("Create a listing/challenge first")));
      return;
    }

    const attachment = rt.sponsorService.attachToChallenge(sponsor.id, challenge.id, {
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

  const status = action === "confirm" ? "pending" : action === "complete" ? "delivered" : "cancelled";
  const updated = rt.sponsorService.recordOutcome(latest.id, { status, notes: `set via ${action}` });
  console.log(j(ok({ action, updated })));
}

async function reputationMenu(rt: RuntimeLike): Promise<void> {
  const participant = rt.state.participants[0];
  if (!participant) {
    console.log(j(fail("Create participant first")));
    return;
  }

  const score = rt.showcaseService.buildPortfolio(participant.id).aggregateScore;
  const events = rt.challengeService
    .getSubmissionsForParticipant(participant.id)
    .map((s) => ({ submissionId: s.id, scored: s.score?.totalScore ?? null }));

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

    const host = rt.leagueService.createLeagueHost({
      name: "Guided Host",
      organization: "Guided Org",
    });
    const league = rt.leagueService.createLeague({
      name: "Guided League",
      hostId: host.id,
    });
    rt.leagueService.activateLeague(league.id);
    rt.state.hosts.push(host);
    rt.state.leagues.push(league);
    console.log(j(ok({ step: "league", host, league })));

    const participant = rt.leagueService.createParticipant({
      handle: "@guided",
      discipline: Discipline.Design,
    });
    rt.state.participants.push(participant);
    const enrollment = rt.leagueService.enrollParticipant(league.id, participant.id);
    console.log(j(ok({ step: "member", participant, enrollment })));

    const challenge = rt.challengeService.createChallenge({
      leagueId: league.id,
      title: "Guided Challenge",
      prompt: "Walk through app flow",
      deadline: "2026-12-31",
      scoringCriteria: [{ name: "Quality", weight: 1 }],
    });
    rt.state.challenges.push(challenge);
    rt.challengeService.openChallenge(challenge.id);
    const submission = rt.challengeService.submitEntry(challenge.id, participant.id, {
      artifact: { url: "https://example.com/guided", description: "guided artifact" },
      isPublic: true,
    });
    rt.state.submissions.push(submission);
    rt.challengeService.closeForJudging(challenge.id);
    const scored = rt.challengeService.scoreSubmission(submission.id, {
      judgeId: "judge:guided",
      rationale: "guided",
      criteriaScores: [{ criteriaName: "Quality", score: 91 }],
    });
    rt.challengeService.completeChallenge(challenge.id);
    console.log(j(ok({ step: "challenge", challenge, scored })));

    console.log(j(ok({ step: "leaderboard", leaderboard: rt.challengeService.getLeaderboard(challenge.id) })));
    console.log(j(ok({ step: "showcase", feed: rt.showcaseService.getShowcaseFeed(league.id) })));
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

process.on("SIGINT", () => {
  process.exit(0);
});
