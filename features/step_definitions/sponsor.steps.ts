import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { SponsorOutcomeStatus } from "../../src/sponsor-intelligence/types.js";
import type { CslWorld } from "../support/world.js";

// ---- Given ----

Given(
  "a sponsor {string} with contact {string}",
  async function (this: CslWorld, name: string, contactEmail: string) {
    const sponsor = await this.sponsorService.createSponsor({
      name,
      organization: name,
      contactEmail,
    });
    this.currentSponsorId = sponsor.id;
  }
);

Given("the sponsor attaches a brief to the challenge", async function (this: CslWorld) {
  const attachment = await this.sponsorService.attachToChallenge(
    this.currentSponsorId,
    this.currentChallengeId,
    {
      headline: "Sponsor Brief",
      description: "Deliver a bold creative direction",
      deliverables: ["concept deck", "final assets"],
    }
  );
  this.lastAttachment = attachment;
  this.currentAttachmentId = attachment.id;
});

Given("the challenge is completed with scored submissions", async function (this: CslWorld) {
  await this.challengeService.openChallenge(this.currentChallengeId);

  const submission = await this.challengeService.submitEntry(
    this.currentChallengeId,
    this.currentParticipantId,
    {
      artifact: { url: "https://example.com/entry", description: "submission" },
      isPublic: true,
    }
  );

  await this.challengeService.closeForJudging(this.currentChallengeId);

  await this.challengeService.scoreSubmission(submission.id, {
    judgeId: "judge:bdd",
    criteriaScores: [{ criteriaName: "Overall", score: 85 }],
    rationale: "BDD test score",
  });

  await this.challengeService.completeChallenge(this.currentChallengeId);
});

// ---- When ----

When("the sponsor attaches a brief to the challenge", async function (this: CslWorld) {
  const attachment = await this.sponsorService.attachToChallenge(
    this.currentSponsorId,
    this.currentChallengeId,
    {
      headline: "Sponsor Brief",
      description: "Deliver a bold creative direction",
      deliverables: ["concept deck", "final assets"],
    }
  );
  this.lastAttachment = attachment;
  this.currentAttachmentId = attachment.id;
});

When(
  "the sponsor records an outcome of {string}",
  async function (this: CslWorld, status: string) {
    const outcomeStatus =
      status === "delivered"
        ? SponsorOutcomeStatus.Delivered
        : status === "cancelled"
          ? SponsorOutcomeStatus.Cancelled
          : SponsorOutcomeStatus.Pending;

    this.lastAttachment = await this.sponsorService.recordOutcome(this.currentAttachmentId, {
      status: outcomeStatus,
      notes: `Outcome: ${status}`,
    });
  }
);

When("the sponsor summary is requested", async function (this: CslWorld) {
  // stored on world for Then assertions
  (this as any).lastSponsorSummary = await this.sponsorService.getSponsorSummary(
    this.currentSponsorId
  );
});

// ---- Then ----

Then("the sponsor attachment is recorded with the brief", function (this: CslWorld) {
  assert.ok(this.lastAttachment, "Expected attachment to exist");
  assert.equal(this.lastAttachment.sponsorId, this.currentSponsorId);
  assert.equal(this.lastAttachment.challengeId, this.currentChallengeId);
  assert.ok(this.lastAttachment.brief.headline, "Expected brief headline");
});

Then("the sponsor summary shows {int} challenge(s)", async function (this: CslWorld, count: number) {
  const summary = await this.sponsorService.getSponsorSummary(this.currentSponsorId);
  assert.equal(summary.challenges, count);
});

Then(
  "the attachment outcome status is {string}",
  function (this: CslWorld, expectedStatus: string) {
    assert.ok(this.lastAttachment, "Expected attachment to exist");
    assert.ok(this.lastAttachment.outcome, "Expected outcome to exist");
    assert.equal(this.lastAttachment.outcome.status, expectedStatus);
  }
);

Then("the summary includes top submissions from the challenge", function (this: CslWorld) {
  const summary = (this as any).lastSponsorSummary;
  assert.ok(summary, "Expected sponsor summary");
  assert.ok(summary.topSubmissions.length > 0, "Expected at least one top submission");
  assert.ok(
    summary.topSubmissions[0].challengeId === this.currentChallengeId,
    "Expected top submission from the sponsored challenge"
  );
});

// ---- Gap 3: Challenge.sponsorId sync ----

Then("the challenge sponsorId matches the sponsor", async function (this: CslWorld) {
  const challenge = await this.challengeService.getChallenge(this.currentChallengeId);
  assert.ok(challenge, "Expected challenge to exist");
  assert.equal(challenge.sponsorId, this.currentSponsorId, "Expected challenge.sponsorId to match sponsor");
});

// ---- Gap 8: Showcase feed pagination ----

When(
  "the showcase feed is requested with limit {int}",
  async function (this: CslWorld, limit: number) {
    (this as any).lastShowcaseFeed = await this.showcaseService.getShowcaseFeed(
      this.currentLeagueId,
      { limit }
    );
  }
);

Then(
  "the feed returns {int} entry and a nextCursor is null",
  function (this: CslWorld, expectedCount: number) {
    const result = (this as any).lastShowcaseFeed;
    assert.ok(result, "Expected a feed result");
    assert.equal(result.entries.length, expectedCount);
    assert.equal(result.nextCursor, null);
  }
);
