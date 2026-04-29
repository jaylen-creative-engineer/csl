import { Discipline } from "../src/league-model/types.js";
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
  - Avoid NODE_OPTIONS=--import tsx for this CLI; run via:
      node ./node_modules/tsx/dist/cli.mjs ./cli/entry.ts
    Double tsx registration can trigger loader/load-export errors.
  - .env.local is for local secrets only; never commit it.
`);
}

export async function runSmoke(): Promise<number> {
  const rt = createRuntime();
  try {
    const host = rt.leagueService.createLeagueHost({
      name: "Smoke Host",
      organization: "CSL Smoke Org",
    });
    const league = rt.leagueService.createLeague({
      name: "Smoke League",
      hostId: host.id,
    });
    rt.state.hosts.push(host);
    rt.state.leagues.push(league);

    const participant = rt.leagueService.createParticipant({
      handle: "@smoke",
      discipline: Discipline.Design,
    });
    rt.state.participants.push(participant);
    const enrollment = rt.leagueService.enrollParticipant(league.id, participant.id);

    console.log(j(ok({ step: "create-host+league", host, league })));
    console.log(j(ok({ step: "create-participant+enroll", participant, enrollment })));
    console.log(j(ok({ step: "list-participants", participants: rt.leagueService.listParticipants(league.id) })));
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
    const host = rt.leagueService.createLeagueHost({
      name: "Studio Zero",
      organization: "Studio Zero LLC",
    });
    rt.state.hosts.push(host);
    emit("host.created", host);

    const league = rt.leagueService.createLeague({
      name: "Open Design League",
      hostId: host.id,
    });
    rt.state.leagues.push(league);
    emit("league.created", league);

    const activeLeague = rt.leagueService.activateLeague(league.id);
    emit("league.activated", activeLeague);

    const participants = [
      rt.leagueService.createParticipant({ handle: "@alex_designs", discipline: Discipline.Design }),
      rt.leagueService.createParticipant({ handle: "@kai_writes", discipline: Discipline.Writing }),
    ];
    rt.state.participants.push(...participants);
    emit("participants.created", participants);

    const enrollments = participants.map((p) => rt.leagueService.enrollParticipant(league.id, p.id));
    emit("participants.enrolled", enrollments);

    const challenge = rt.challengeService.createChallenge({
      leagueId: league.id,
      title: "Rebrand the Commute",
      prompt: "Design a bold identity for urban transit",
      deadline: "2026-05-30",
      scoringCriteria: [
        { name: "Originality", weight: 0.4 },
        { name: "Execution", weight: 0.4 },
        { name: "Clarity", weight: 0.2 },
      ],
    });
    rt.state.challenges.push(challenge);
    emit("challenge.created", challenge);

    emit("challenge.opened", rt.challengeService.openChallenge(challenge.id));

    const submissions = participants.map((p, idx) =>
      rt.challengeService.submitEntry(challenge.id, p.id, {
        artifact: {
          url: `https://example.com/${p.handle.replace("@", "")}-${idx + 1}`,
          description: `${p.handle} entry`,
        },
        isPublic: true,
      }),
    );
    rt.state.submissions.push(...submissions);
    emit("submissions.created", submissions);

    const revision = rt.challengeService.submitRevision(submissions[0]!.id, {
      artifact: {
        url: `https://example.com/${participants[0]!.handle.replace("@", "")}-revision-2`,
        description: `${participants[0]!.handle} revised entry`,
      },
      isPublic: true,
    });
    rt.state.submissions.push(revision);
    emit("submission.revision.created", revision);

    emit("challenge.judging", rt.challengeService.closeForJudging(challenge.id));

    const judgingSet = [...submissions, revision];
    const scored = judgingSet.map((s, idx) =>
      rt.challengeService.scoreSubmission(s.id, {
        judgeId: "judge:demo",
        rationale: "Demo score",
        criteriaScores: [
          {
            criteriaName: "Originality",
            score: idx === 0 ? 84 : idx === 1 ? 86 : 91,
          },
          {
            criteriaName: "Execution",
            score: idx === 0 ? 82 : idx === 1 ? 85 : 89,
          },
          {
            criteriaName: "Clarity",
            score: idx === 0 ? 80 : idx === 1 ? 84 : 90,
          },
        ],
      }),
    );
    emit("submissions.scored", scored);

    const review = rt.reviewService.reviewSubmission(revision.id);
    emit("ai.review.generated", review);

    const weakestDomains = review.criterionReviews
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((r) => r.criteriaName);
    const resourceRecommendations = rt.learningContextService.recommendResourcesForDomains(
      weakestDomains
    );
    emit("learning.resources.recommended", {
      weakestDomains,
      recommendations: resourceRecommendations,
    });

    emit("challenge.completed", rt.challengeService.completeChallenge(challenge.id));
    emit("leaderboard.list", rt.challengeService.getLeaderboard(challenge.id));
    emit("showcase.feed", rt.showcaseService.getShowcaseFeed(league.id));

    return 0;
  } catch (error) {
    console.error(j(fail(error)));
    return 1;
  }
}
