import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { Discipline } from "../../src/league-model/types.js";
import type { Portfolio, PublicProfile } from "../../src/showcase-intelligence/types.js";
import type { CslWorld } from "../support/world.js";

let lastPortfolio: Portfolio | undefined;
let lastTopPerformers: PublicProfile[] | undefined;

function deadlineHours(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

// ---- Given ----

Given(
  "{string} has {int} scored public submissions across {int} challenges",
  async function (
    this: CslWorld,
    handle: string,
    submissionCount: number,
    challengeCount: number
  ) {
    const host = await this.leagueModel.createLeagueHost({
      name: "Jordan",
      organization: "Design Chicago",
    });
    const league = await this.leagueModel.createLeague({ name: "Pixel League", hostId: host.id });
    this.currentLeagueId = league.id;

    const participant = await this.leagueModel.createParticipant({
      handle,
      discipline: Discipline.Design,
    });
    this.currentParticipantId = participant.id;
    await this.leagueModel.enrollParticipant(league.id, participant.id);

    let submissionsRemaining = submissionCount;

    for (let ci = 0; ci < challengeCount && submissionsRemaining > 0; ci++) {
      const challenge = await this.challengeService.createChallenge({
        leagueId: league.id,
        title: `Challenge ${ci + 1}`,
        prompt: `Prompt for challenge ${ci + 1}`,
        deadline: deadlineHours(48),
        scoringCriteria: [
          { name: "Creativity", weight: 0.5 },
          { name: "Execution", weight: 0.5 },
        ],
      });

      await this.challengeService.openChallenge(challenge.id);

      const submissionsThisChallenge =
        ci === challengeCount - 1
          ? submissionsRemaining
          : Math.ceil(submissionsRemaining / (challengeCount - ci));

      const batchSubmissions = [];
      for (let si = 0; si < submissionsThisChallenge && submissionsRemaining > 0; si++) {
        const submission = await this.challengeService.submitEntry(challenge.id, participant.id, {
          artifact: { url: `https://${handle}.design/entry-${ci}-${si}` },
          isPublic: true,
        });
        batchSubmissions.push(submission);
        submissionsRemaining--;
      }

      await this.challengeService.closeForJudging(challenge.id);

      for (const submission of batchSubmissions) {
        await this.challengeService.scoreSubmission(submission.id, {
          judgeId: "judge:1",
          criteriaScores: [
            { criteriaName: "Creativity", score: 80 },
            { criteriaName: "Execution", score: 75 },
          ],
          rationale: "Strong work",
        });
      }
    }
  }
);

Given(
  "{string} with {int} participants and scored submissions",
  async function (this: CslWorld, leagueName: string, participantCount: number) {
    const host = await this.leagueModel.createLeagueHost({
      name: "Jordan",
      organization: "Design Chicago",
    });
    const league = await this.leagueModel.createLeague({ name: leagueName, hostId: host.id });
    this.currentLeagueId = league.id;

    const challenge = await this.challengeService.createChallenge({
      leagueId: league.id,
      title: "Open Sprint",
      prompt: "Prompt",
      deadline: deadlineHours(48),
    });

    await this.challengeService.openChallenge(challenge.id);

    const enrolledParticipants: Array<{ id: string }> = [];
    for (let i = 0; i < participantCount; i++) {
      const participant = await this.leagueModel.createParticipant({
        handle: `creative-${i}`,
        discipline: Discipline.Design,
      });
      await this.leagueModel.enrollParticipant(league.id, participant.id);
      enrolledParticipants.push(participant);
    }

    const submissionsToScore = [];
    for (let i = 0; i < enrolledParticipants.length; i++) {
      const participant = enrolledParticipants[i]!;
      submissionsToScore.push(
        await this.challengeService.submitEntry(challenge.id, participant.id, {
          artifact: { url: `https://creative${i}.design/entry` },
          isPublic: true,
        })
      );
    }

    await this.challengeService.closeForJudging(challenge.id);

    for (let i = 0; i < submissionsToScore.length; i++) {
      const submission = submissionsToScore[i]!;
      await this.challengeService.scoreSubmission(submission.id, {
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Overall", score: 50 + i * 10 }],
        rationale: "Scored",
      });
    }
  }
);

// ---- When ----

When("the showcase builds alex's portfolio", async function (this: CslWorld) {
  lastPortfolio = await this.showcaseService.buildPortfolio(this.currentParticipantId);
});

When("top performers are requested with limit {int}", async function (this: CslWorld, limit: number) {
  lastTopPerformers = await this.showcaseService.getTopPerformers(this.currentLeagueId, limit);
});

// ---- Then ----

Then("the portfolio contains {int} entries", function (this: CslWorld, expectedCount: number) {
  assert.ok(lastPortfolio, "Expected a portfolio to have been built");
  assert.equal(
    lastPortfolio.entries.length,
    expectedCount,
    `Expected ${expectedCount} entries, got ${lastPortfolio.entries.length}`
  );
});

Then("skill signals reflect the scoring criteria domains", function () {
  assert.ok(lastPortfolio, "Expected a portfolio to have been built");
  assert.ok(lastPortfolio.skillSignals.length > 0, "Expected at least one skill signal");

  const validDomains = new Set(["Creativity", "Execution", "Overall"]);
  for (const signal of lastPortfolio.skillSignals) {
    assert.ok(
      validDomains.has(signal.domain),
      `Unexpected domain "${signal.domain}" — should match scoring criteria names`
    );
  }
});

Then(
  "exactly {int} profiles are returned ranked by aggregate score",
  function (this: CslWorld, expectedCount: number) {
    assert.ok(lastTopPerformers, "Expected top performers to have been fetched");
    assert.equal(
      lastTopPerformers.length,
      expectedCount,
      `Expected ${expectedCount} profiles, got ${lastTopPerformers.length}`
    );

    for (let i = 1; i < lastTopPerformers.length; i++) {
      const prev = lastTopPerformers[i - 1]?.aggregateScore ?? 0;
      const curr = lastTopPerformers[i]?.aggregateScore ?? 0;
      assert.ok(prev >= curr, `Expected profiles sorted descending at index ${i}`);
    }
  }
);
