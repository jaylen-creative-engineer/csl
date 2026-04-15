import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { LeagueStatus } from "../../src/league-model/types.js";
import type { CslWorld } from "../support/world.js";

// ---- Given ----

Given(
  "a league host {string} with organization {string}",
  function (this: CslWorld, name: string, organization: string) {
    const host = this.leagueModel.createLeagueHost({ name, organization });
    this.currentHostId = host.id;
  }
);

Given("a league {string} in draft state", function (this: CslWorld, leagueName: string) {
  const host = this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
  this.currentHostId = host.id;
  const league = this.leagueModel.createLeague({ name: leagueName, hostId: host.id });
  this.currentLeagueId = league.id;
});

Given(
  "{string} is already enrolled in {string}",
  function (this: CslWorld, handle: string, leagueName: string) {
    const host = this.leagueModel.createLeagueHost({ name: "Jordan", organization: "Design Chicago" });
    this.currentHostId = host.id;
    const league = this.leagueModel.createLeague({ name: leagueName, hostId: host.id });
    this.currentLeagueId = league.id;

    const participant = this.leagueModel.createParticipant({ handle, discipline: "design" as any });
    this.currentParticipantId = participant.id;
    this.leagueModel.enrollParticipant(league.id, participant.id);
  }
);

// ---- When ----

When("Jordan creates league {string}", function (this: CslWorld, leagueName: string) {
  const league = this.leagueModel.createLeague({ name: leagueName, hostId: this.currentHostId });
  this.currentLeagueId = league.id;
});

When("{string} enrolls in the league", function (this: CslWorld, _handle: string) {
  this.lastEnrollmentResult = this.leagueModel.enrollParticipant(this.currentLeagueId, this.currentParticipantId);
});

When("{string} attempts to enroll again", function (this: CslWorld, _handle: string) {
  this.lastEnrollmentResult = this.leagueModel.enrollParticipant(this.currentLeagueId, this.currentParticipantId);
});

// ---- Then ----

Then("the league exists with status {string}", function (this: CslWorld, expectedStatus: string) {
  const league = this.leagueModel.getLeague(this.currentLeagueId);
  assert.ok(league, "Expected league to exist");
  assert.equal(league.status, expectedStatus as LeagueStatus);
});

Then("Jordan is the host", function (this: CslWorld) {
  const league = this.leagueModel.getLeague(this.currentLeagueId);
  assert.ok(league, "Expected league to exist");
  assert.equal(league.hostId, this.currentHostId);
});

Then("{string} appears in the participant list", function (this: CslWorld, handle: string) {
  assert.ok(this.lastEnrollmentResult?.success, "Expected enrollment to succeed");

  const participants = this.leagueModel.listParticipants(this.currentLeagueId);
  const found = participants.find((p) => p.handle === handle);
  assert.ok(found, `Expected "${handle}" to be in the participant list`);
});

Then("enrollment fails with reason {string}", function (this: CslWorld, reason: string) {
  assert.ok(this.lastEnrollmentResult, "Expected an enrollment result");
  assert.equal(this.lastEnrollmentResult.success, false);
  assert.equal(this.lastEnrollmentResult.reason, reason);
});
