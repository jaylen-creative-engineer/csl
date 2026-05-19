import { Discipline } from "../src/league-model/types.js";
import { SponsorOutcomeStatus } from "../src/sponsor-intelligence/types.js";
import { createRuntime, fail, j, ok } from "./shared.js";

export function printHelp(): void {
  console.log(`
CSL validation CLI

Usage:
  npm run csl:cli
  npm run csl:cli -- --help
  npm run csl:cli -- --smoke
  npm run csl:cli -- --demo

Modes:
  (none)    Interactive menu mode (requires TTY)
  --smoke   Fast non-interactive wiring check (CI-safe)
  --demo    Non-interactive guided flow with JSON envelopes
  --help    Print this help

Notes:
  - In non-TTY contexts (CI, IDE Run without terminal), use --smoke or --demo.
  - Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
  - Avoid NODE_OPTIONS=--import tsx for this CLI; run via:
      node ./node_modules/tsx/dist/cli.mjs ./cli/entry.ts
    Double tsx registration can trigger loader/load-export errors.
  - .env.local is for local secrets only; never commit it.
`);
}

export async function runSmoke(): Promise<number> {
  const rt = createRuntime();
  try {
    const host = await rt.leagueService.createLeagueHost({
      name: "Smoke Host",
      organization: "CSL Smoke Org",
    });
    const league = await rt.leagueService.createLeague({
      name: "Smoke League",
      hostId: host.id,
    });
    rt.state.hosts.push(host);
    rt.state.leagues.push(league);

    const participant = await rt.leagueService.createParticipant({
      handle: `@smoke-${Date.now()}`,
      discipline: Discipline.Design,
    });
    rt.state.participants.push(participant);
    const enrollment = await rt.leagueService.enrollParticipant(league.id, participant.id);

    console.log(j(ok({ step: "create-host+league", host, league })));
    console.log(j(ok({ step: "create-participant+enroll", participant, enrollment })));
    console.log(
      j(ok({ step: "list-participants", participants: await rt.leagueService.listParticipants(league.id) }))
    );

    const hosts = await rt.leagueService.listHosts();
    console.log(j(ok({ step: "discovery-hosts", count: hosts.length, includes: hosts.some((h) => h.id === host.id) })));

    const leagues = await rt.leagueService.listLeagues();
    console.log(j(ok({ step: "discovery-leagues", count: leagues.length, includes: leagues.some((l) => l.id === league.id) })));

    const challenge = await rt.challengeService.createChallenge({
      leagueId: league.id,
      title: "Smoke Challenge",
      prompt: "Validate wiring",
      deadline: "2026-12-31",
    });
    const challengesForLeague = await rt.challengeService.getChallengesForLeague(league.id);
    console.log(j(ok({ step: "discovery-challenges-for-league", count: challengesForLeague.length, includes: challengesForLeague.some((c) => c.id === challenge.id) })));

    const sponsor = await rt.sponsorService.createSponsor({
      name: "Smoke Sponsor",
      organization: "Smoke Org",
      contactEmail: "smoke@example.com",
    });
    const attachment = await rt.sponsorService.attachToChallenge(sponsor.id, challenge.id, {
      headline: "Smoke Brief",
      description: "Validate sponsor wiring",
      deliverables: ["demo"],
    });
    const summary = await rt.sponsorService.getSponsorSummary(sponsor.id);
    console.log(j(ok({ step: "sponsor-wiring", sponsor: sponsor.id, attachment: attachment.id, challenges: summary.challenges })));

    return 0;
  } catch (error) {
    console.error(j(fail(error)));
    return 1;
  }
}

export async function runGuidedDemoBatch(): Promise<number> {
  const rt = createRuntime();

  const emit = (label: string, value: unknown): void => {
    console.log(`\n# ${label}`);
    console.log(j(ok(value)));
  };

  try {
    const host = await rt.leagueService.createLeagueHost({
      name: "Studio Zero",
      organization: "Studio Zero LLC",
    });
    rt.state.hosts.push(host);
    emit("host.created", host);

    const league = await rt.leagueService.createLeague({
      name: "Open Design League",
      hostId: host.id,
    });
    rt.state.leagues.push(league);
    emit("league.created", league);

    const activeLeague = await rt.leagueService.activateLeague(league.id);
    emit("league.activated", activeLeague);

    const participants = [
      await rt.leagueService.createParticipant({
        handle: `@alex_designs-${Date.now()}`,
        discipline: Discipline.Design,
      }),
      await rt.leagueService.createParticipant({
        handle: `@kai_writes-${Date.now()}`,
        discipline: Discipline.Writing,
      }),
    ];
    rt.state.participants.push(...participants);
    emit("participants.created", participants);

    const enrollments = [];
    for (const p of participants) {
      enrollments.push(await rt.leagueService.enrollParticipant(league.id, p.id));
    }
    emit("participants.enrolled", enrollments);

    const challenge = await rt.challengeService.createChallenge({
      leagueId: league.id,
      title: "Rebrand the Commute",
      prompt: "Design a bold identity for urban transit",
      deadline: "2026-05-30",
      scoringCriteria: [
        { name: "Originality", weight: 0.5 },
        { name: "Execution", weight: 0.5 },
      ],
    });
    rt.state.challenges.push(challenge);
    emit("challenge.created", challenge);

    emit("challenge.opened", await rt.challengeService.openChallenge(challenge.id));

    const submissions = [];
    for (let idx = 0; idx < participants.length; idx++) {
      const p = participants[idx]!;
      submissions.push(
        await rt.challengeService.submitEntry(challenge.id, p.id, {
          artifact: {
            url: `https://example.com/${p.handle.replace("@", "")}-${idx + 1}`,
            description: `${p.handle} entry`,
          },
          isPublic: true,
        })
      );
    }
    rt.state.submissions.push(...submissions);
    emit("submissions.created", submissions);

    emit("challenge.judging", await rt.challengeService.closeForJudging(challenge.id));

    const scored = [];
    for (let idx = 0; idx < submissions.length; idx++) {
      const s = submissions[idx]!;
      scored.push(
        await rt.challengeService.scoreSubmission(s.id, {
          judgeId: "judge:demo",
          rationale: "Demo score",
          criteriaScores: [
            { criteriaName: "Originality", score: idx === 0 ? 92 : 84 },
            { criteriaName: "Execution", score: idx === 0 ? 88 : 86 },
          ],
        })
      );
    }
    emit("submissions.scored", scored);

    emit("challenge.completed", await rt.challengeService.completeChallenge(challenge.id));
    emit("leaderboard.list", await rt.challengeService.getLeaderboard(challenge.id));
    emit("showcase.feed", await rt.showcaseService.getShowcaseFeed(league.id));

    // --- Discovery APIs ---
    const allHosts = await rt.leagueService.listHosts();
    emit("discovery.hosts", { count: allHosts.length, latest: allHosts.find((h) => h.id === host.id)?.name });

    const allLeagues = await rt.leagueService.listLeagues();
    emit("discovery.leagues", { count: allLeagues.length, latest: allLeagues.find((l) => l.id === league.id)?.name });

    const leagueChallenges = await rt.challengeService.getChallengesForLeague(league.id);
    emit("discovery.challengesForLeague", { leagueId: league.id, count: leagueChallenges.length, titles: leagueChallenges.map((c) => c.title) });

    // --- Sponsor Intelligence ---
    const sponsor = await rt.sponsorService.createSponsor({
      name: "Neon Studios",
      organization: "Neon Studios Inc",
      contactEmail: "sponsors@neonstudios.example.com",
    });
    rt.state.sponsors.push(sponsor);
    emit("sponsor.created", sponsor);

    const attachment = await rt.sponsorService.attachToChallenge(sponsor.id, challenge.id, {
      headline: "Transit Identity Challenge",
      description: "Design a bold identity system for urban transit riders",
      deliverables: ["brand book", "signage concepts", "digital assets"],
      prize: "$2,500 design grant",
    });
    rt.state.attachments.push(attachment);
    emit("sponsor.attached", attachment);

    const outcomeAttachment = await rt.sponsorService.recordOutcome(attachment.id, {
      status: SponsorOutcomeStatus.Delivered,
      notes: "Prize delivered to top performer",
      opportunityExtendedTo: participants[0]!.id,
    });
    emit("sponsor.outcome", outcomeAttachment);

    const sponsorSummary = await rt.sponsorService.getSponsorSummary(sponsor.id);
    emit("sponsor.summary", sponsorSummary);

    // --- Showcase: Portfolio + Skill Signals ---
    const portfolio = await rt.showcaseService.buildPortfolio(participants[0]!.id);
    emit("showcase.portfolio", {
      handle: portfolio.handle,
      entries: portfolio.entries.length,
      aggregateScore: portfolio.aggregateScore,
      skillSignals: portfolio.skillSignals,
    });

    const topPerformers = await rt.showcaseService.getTopPerformers(league.id, 5);
    emit("showcase.topPerformers", topPerformers);

    return 0;
  } catch (error) {
    console.error(j(fail(error)));
    return 1;
  }
}
