import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { LeagueStatus } from "../../src/league-model/types.js";
import type { CslWorld } from "../support/world.js";

// ---- Given ----

Given(
  "a league host {string} with organization {string}",
  async function (this: CslWorld, name: string, organization: string) {
    const host = await this.leagueModel.createLeagueHost({ name, organization });
    this.currentHostId = host.id;
  }
);

Given("a league {string} in draft state", async function (this: CslWorld, leagueName: string) {
  const host = await this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
  this.currentHostId = host.id;
  const league = await this.leagueModel.createLeague({ name: leagueName, hostId: host.id });
  this.currentLeagueId = league.id;
});

Given(
  "{string} is already enrolled in {string}",
  async function (this: CslWorld, handle: string, leagueName: string) {
    const host = await this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
    this.currentHostId = host.id;
    const league = await this.leagueModel.createLeague({ name: leagueName, hostId: host.id });
    this.currentLeagueId = league.id;

    const participant = await this.leagueModel.createParticipant({ handle, discipline: "design" as any });
    this.currentParticipantId = participant.id;
    await this.leagueModel.enrollParticipant(league.id, participant.id);
  }
);

// ---- When ----

When("the host activates the league", async function (this: CslWorld) {
  await this.leagueModel.activateLeague(this.currentLeagueId);
});

When("the host closes the league", async function (this: CslWorld) {
  await this.leagueModel.closeLeague(this.currentLeagueId);
});

When("Jordan creates league {string}", async function (this: CslWorld, leagueName: string) {
  const league = await this.leagueModel.createLeague({ name: leagueName, hostId: this.currentHostId });
  this.currentLeagueId = league.id;
});

When("{string} enrolls in the league", async function (this: CslWorld, _handle: string) {
  this.lastEnrollmentResult = await this.leagueModel.enrollParticipant(this.currentLeagueId, this.currentParticipantId);
});

When("{string} attempts to enroll again", async function (this: CslWorld, _handle: string) {
  this.lastEnrollmentResult = await this.leagueModel.enrollParticipant(this.currentLeagueId, this.currentParticipantId);
});

// ---- Then ----

Then("the league exists with status {string}", async function (this: CslWorld, expectedStatus: string) {
  const league = await this.leagueModel.getLeague(this.currentLeagueId);
  assert.ok(league, "Expected league to exist");
  assert.equal(league.status, expectedStatus as LeagueStatus);
});

Then("Jordan is the host", async function (this: CslWorld) {
  const league = await this.leagueModel.getLeague(this.currentLeagueId);
  assert.ok(league, "Expected league to exist");
  assert.equal(league.hostId, this.currentHostId);
});

Then("{string} appears in the participant list", async function (this: CslWorld, handle: string) {
  assert.ok(this.lastEnrollmentResult?.success, "Expected enrollment to succeed");

  const participants = await this.leagueModel.listParticipants(this.currentLeagueId);
  const found = participants.find((p) => p.handle === handle);
  assert.ok(found, `Expected "${handle}" to be in the participant list`);
});

Then("enrollment fails with reason {string}", function (this: CslWorld, reason: string) {
  assert.ok(this.lastEnrollmentResult, "Expected an enrollment result");
  assert.equal(this.lastEnrollmentResult.success, false);
  assert.equal(this.lastEnrollmentResult.reason, reason);
});
