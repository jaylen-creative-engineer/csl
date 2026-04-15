import { Given, When, Then, Before } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { Discipline } from "../../src/league-model/types.js";
import { ChallengeStatus } from "../../src/challenge-intelligence/types.js";
import type { CslWorld } from "../support/world.js";

function deadlineHours(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

Before(function (this: CslWorld) {
  this.reset();
});

// ---- Given ----

Given("a league {string} with host {string}", function (this: CslWorld, leagueName: string, hostName: string) {
  const host = this.leagueModel.createLeagueHost({ name: hostName, organization: "Default Org" });
  const league = this.leagueModel.createLeague({ name: leagueName, hostId: host.id });
  this.currentLeagueId = league.id;
  this.currentHostId = host.id;
});

Given("an open challenge {string}", function (this: CslWorld, title: string) {
  const host = this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
  const league = this.leagueModel.createLeague({ name: "Pixel League", hostId: host.id });
  this.currentLeagueId = league.id;
  this.currentHostId = host.id;

  const challenge = this.challengeService.createChallenge({
    leagueId: league.id,
    title,
    prompt: "Rebrand a local coffee shop",
    deadline: deadlineHours(48),
  });
  this.challengeService.openChallenge(challenge.id);
  this.currentChallengeId = challenge.id;
});

Given("a participant {string} with discipline {string}", function (this: CslWorld, handle: string, discipline: string) {
  const participant = this.leagueModel.createParticipant({
    handle,
    discipline: discipline as Discipline,
  });
  this.currentParticipantId = participant.id;
});

Given(
  "a challenge in {string} state with {int} submissions",
  function (this: CslWorld, state: string, count: number) {
    const host = this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
    const league = this.leagueModel.createLeague({ name: "Test League", hostId: host.id });
    this.currentLeagueId = league.id;

    const challenge = this.challengeService.createChallenge({
      leagueId: league.id,
      title: "Test Challenge",
      prompt: "Test prompt",
      deadline: deadlineHours(24),
    });
    this.challengeService.openChallenge(challenge.id);
    this.currentChallengeId = challenge.id;

    this.submissionsInJudging = [];
    for (let i = 0; i < count; i++) {
      const participant = this.leagueModel.createParticipant({
        handle: `participant-${i}`,
        discipline: Discipline.Design,
      });
      const submission = this.challengeService.submitEntry(challenge.id, participant.id, {
        artifact: { url: `https://p${i}.design/entry` },
        isPublic: true,
      });
      this.submissionsInJudging.push(submission);
    }

    if (state === "judging") {
      this.challengeService.closeForJudging(challenge.id);
    }
  }
);

Given("a challenge in {string} state", function (this: CslWorld, state: string) {
  const host = this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
  const league = this.leagueModel.createLeague({ name: "Test League", hostId: host.id });
  this.currentLeagueId = league.id;

  const challenge = this.challengeService.createChallenge({
    leagueId: league.id,
    title: "Draft Challenge",
    prompt: "Prompt",
    deadline: deadlineHours(24),
  });
  this.currentChallengeId = challenge.id;

  if (state === "open") {
    this.challengeService.openChallenge(challenge.id);
  } else if (state === "judging") {
    this.challengeService.openChallenge(challenge.id);
    this.challengeService.closeForJudging(challenge.id);
  } else if (state === "complete") {
    this.challengeService.openChallenge(challenge.id);
    this.challengeService.closeForJudging(challenge.id);
    this.challengeService.completeChallenge(challenge.id);
  }
  // "draft" — no further transitions needed
});

// ---- When ----

When(
  "the host creates a challenge {string} with deadline {int} hours from now",
  function (this: CslWorld, title: string, hours: number) {
    const challenge = this.challengeService.createChallenge({
      leagueId: this.currentLeagueId,
      title,
      prompt: "Redesign the brand identity",
      deadline: deadlineHours(hours),
    });
    this.currentChallengeId = challenge.id;
  }
);

When("the host opens the challenge for submissions", function (this: CslWorld) {
  this.challengeService.openChallenge(this.currentChallengeId);
});

When("{string} submits an artifact URL {string}", function (this: CslWorld, _handle: string, url: string) {
  this.lastError = undefined;
  try {
    this.lastSubmission = this.challengeService.submitEntry(this.currentChallengeId, this.currentParticipantId, {
      artifact: { url },
      isPublic: true,
    });
  } catch (err) {
    this.lastError = err as Error;
  }
});

When("a judge scores all submissions", function (this: CslWorld) {
  let scoreValue = 90;
  for (const submission of this.submissionsInJudging) {
    this.challengeService.scoreSubmission(submission.id, {
      judgeId: "judge:1",
      criteriaScores: [{ criteriaName: "Overall", score: scoreValue }],
      rationale: "Good work",
    });
    scoreValue -= 10;
  }
});

When("a participant attempts to submit", function (this: CslWorld) {
  this.lastError = undefined;
  const participant = this.leagueModel.createParticipant({
    handle: "attempter",
    discipline: Discipline.Design,
  });
  try {
    this.challengeService.submitEntry(this.currentChallengeId, participant.id, {
      artifact: { url: "https://attempter.design/entry" },
    });
  } catch (err) {
    this.lastError = err as Error;
  }
});

// ---- Then ----

Then("the challenge status is {string}", function (this: CslWorld, expectedStatus: string) {
  const challenge = this.challengeService.getChallenge(this.currentChallengeId);
  assert.ok(challenge, "Expected challenge to exist");
  assert.equal(challenge.status, expectedStatus as ChallengeStatus);
});

Then("participants can submit entries", function (this: CslWorld) {
  const challenge = this.challengeService.getChallenge(this.currentChallengeId);
  assert.ok(challenge, "Expected challenge to exist");
  assert.equal(challenge.status, ChallengeStatus.Open);
});

Then("the submission is recorded as public", function (this: CslWorld) {
  assert.ok(this.lastSubmission, "Expected a submission to exist");
  assert.equal(this.lastSubmission.isPublic, true);
});

Then("the leaderboard shows {string}", function (this: CslWorld, handle: string) {
  this.challengeService.closeForJudging(this.currentChallengeId);
  this.challengeService.scoreSubmission(this.lastSubmission!.id, {
    judgeId: "judge:1",
    criteriaScores: [{ criteriaName: "Overall", score: 80 }],
    rationale: "Good entry",
  });

  const leaderboard = this.challengeService.getLeaderboard(this.currentChallengeId);
  assert.ok(leaderboard.length > 0, "Leaderboard should not be empty");

  const participant = this.leagueModel.getParticipant(this.currentParticipantId);
  assert.ok(participant, "Expected participant to exist");
  assert.equal(participant.handle, handle);

  const inLeaderboard = leaderboard.some((s) => s.participantId === this.currentParticipantId);
  assert.equal(inLeaderboard, true, `Expected "${handle}" to appear in leaderboard`);
});

Then("the leaderboard is sorted by score descending", function (this: CslWorld) {
  const leaderboard = this.challengeService.getLeaderboard(this.currentChallengeId);
  assert.ok(leaderboard.length > 0, "Leaderboard should not be empty");

  for (let i = 1; i < leaderboard.length; i++) {
    const prev = leaderboard[i - 1]?.score?.totalScore ?? 0;
    const curr = leaderboard[i]?.score?.totalScore ?? 0;
    assert.ok(prev >= curr, `Expected leaderboard to be sorted descending at index ${i}`);
  }
});

Then("scoring is deterministic for equal inputs", function (this: CslWorld) {
  const leaderboard1 = this.challengeService.getLeaderboard(this.currentChallengeId);
  const leaderboard2 = this.challengeService.getLeaderboard(this.currentChallengeId);

  assert.deepEqual(
    leaderboard1.map((s) => s.id),
    leaderboard2.map((s) => s.id),
    "Leaderboard order should be deterministic"
  );
});

Then("the submission is rejected with reason {string}", function (this: CslWorld, reason: string) {
  assert.ok(this.lastError, "Expected an error to have been thrown");
  assert.equal(this.lastError.message, reason);
});
