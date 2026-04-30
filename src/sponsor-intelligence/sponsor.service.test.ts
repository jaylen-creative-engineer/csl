import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { SponsorService } from "./sponsor.service.js";
import { SponsorOutcomeStatus } from "./types.js";
import { createTestSupabaseClient } from "../test/supabase-test.js";
import { hasSupabaseTestEnv } from "../test/supabase-env.js";

function deadline(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

describe.skipIf(!hasSupabaseTestEnv())("SponsorService", () => {
  let challengeService: ChallengeService;
  let sponsorService: SponsorService;
  let leagueModel: LeagueModelService;
  let leagueId: string;
  let suffix: string;

  beforeEach(async () => {
    suffix = randomUUID().slice(0, 8);
    const client = createTestSupabaseClient();
    leagueModel = new LeagueModelService(client);
    challengeService = new ChallengeService(client);
    sponsorService = new SponsorService(client, challengeService);
    const host = await leagueModel.createLeagueHost({
      name: "Jordan",
      organization: "Design Chicago",
    });
    const league = await leagueModel.createLeague({
      name: `League-${suffix}`,
      hostId: host.id,
    });
    leagueId = league.id;
  });

  describe("createSponsor", () => {
    it("creates and retrieves a sponsor", async () => {
      const sponsor = await sponsorService.createSponsor({
        name: `Figma-${suffix}`,
        organization: "Figma Inc.",
        contactEmail: "sponsors@figma.com",
      });

      expect(sponsor.name).toBe(`Figma-${suffix}`);
      expect(sponsor.organization).toBe("Figma Inc.");

      const found = await sponsorService.getSponsor(sponsor.id);
      expect(found?.id).toBe(sponsor.id);
    });
  });

  describe("attachToChallenge", () => {
    it("attaches a sponsor to a challenge with a brief", async () => {
      const sponsor = await sponsorService.createSponsor({
        name: `Figma-${suffix}`,
        organization: "Figma Inc.",
        contactEmail: "sponsors@figma.com",
      });

      const challenge = await challengeService.createChallenge({
        leagueId,
        title: "Brand Refresh in 48h",
        prompt: "Rebrand a local coffee shop",
        deadline: deadline(48),
      });

      const attachment = await sponsorService.attachToChallenge(sponsor.id, challenge.id, {
        headline: "Redesign with Figma",
        description: "Use Figma to create a brand identity for a local coffee shop.",
        deliverables: ["Brand guidelines PDF", "Figma file"],
        prize: "$500 Figma credits",
      });

      expect(attachment.sponsorId).toBe(sponsor.id);
      expect(attachment.challengeId).toBe(challenge.id);
      expect(attachment.brief.headline).toBe("Redesign with Figma");
      expect(attachment.outcome).toBeUndefined();
    });

    it("throws when sponsor does not exist", async () => {
      const challenge = await challengeService.createChallenge({
        leagueId,
        title: "Test",
        prompt: "Prompt",
        deadline: deadline(24),
      });

      await expect(
        sponsorService.attachToChallenge("sponsor:nonexistent", challenge.id, {
          headline: "Test",
          description: "Test",
          deliverables: [],
        })
      ).rejects.toThrow("Sponsor not found");
    });

    it("throws when challenge does not exist", async () => {
      const sponsor = await sponsorService.createSponsor({
        name: `Figma-${suffix}`,
        organization: "Figma Inc.",
        contactEmail: "sponsors@figma.com",
      });

      await expect(
        sponsorService.attachToChallenge(sponsor.id, "challenge:nonexistent", {
          headline: "Test",
          description: "Test",
          deliverables: [],
        })
      ).rejects.toThrow("Challenge not found");
    });
  });

  describe("recordOutcome", () => {
    it("records an outcome on a sponsor attachment", async () => {
      const sponsor = await sponsorService.createSponsor({
        name: `Figma-${suffix}`,
        organization: "Figma Inc.",
        contactEmail: "sponsors@figma.com",
      });
      const challenge = await challengeService.createChallenge({
        leagueId,
        title: "Brand Refresh",
        prompt: "Prompt",
        deadline: deadline(48),
      });

      const attachment = await sponsorService.attachToChallenge(sponsor.id, challenge.id, {
        headline: "Redesign with Figma",
        description: "Use Figma to create a brand identity.",
        deliverables: ["Figma file"],
        prize: "$500 Figma credits",
      });

      const updated = await sponsorService.recordOutcome(attachment.id, {
        status: SponsorOutcomeStatus.Delivered,
        prizeDeliveredAt: new Date().toISOString(),
        opportunityExtendedTo: "participant:1",
        notes: "Winner notified by email",
      });

      expect(updated.outcome?.status).toBe(SponsorOutcomeStatus.Delivered);
      expect(updated.outcome?.opportunityExtendedTo).toBe("participant:1");
    });

    it("throws when attachment does not exist", async () => {
      await expect(
        sponsorService.recordOutcome("attachment:nonexistent", {
          status: SponsorOutcomeStatus.Delivered,
        })
      ).rejects.toThrow("SponsorAttachment not found");
    });
  });

  describe("getSponsorSummary", () => {
    it("returns challenge count and top submissions for a sponsor", async () => {
      const sponsor = await sponsorService.createSponsor({
        name: `Figma-${suffix}`,
        organization: "Figma Inc.",
        contactEmail: "sponsors@figma.com",
      });

      for (let i = 0; i < 2; i++) {
        const challenge = await challengeService.createChallenge({
          leagueId,
          title: `Challenge ${i + 1}-${suffix}`,
          prompt: "Prompt",
          deadline: deadline(48),
        });

        await sponsorService.attachToChallenge(sponsor.id, challenge.id, {
          headline: `Brief ${i + 1}`,
          description: "Design challenge",
          deliverables: ["Figma file"],
        });

        await challengeService.openChallenge(challenge.id);
        const participant = await leagueModel.createParticipant({
          handle: `part-${i}-${suffix}`,
          discipline: "design" as any,
        });
        const submission = await challengeService.submitEntry(challenge.id, participant.id, {
          artifact: { url: `https://p${i}.design/entry` },
        });
        await challengeService.closeForJudging(challenge.id);
        await challengeService.scoreSubmission(submission.id, {
          judgeId: "judge:1",
          criteriaScores: [{ criteriaName: "Overall", score: 80 + i * 5 }],
          rationale: "Good work",
        });
      }

      const summary = await sponsorService.getSponsorSummary(sponsor.id);

      expect(summary.challenges).toBe(2);
      expect(summary.topSubmissions).toHaveLength(2);
    });

    it("returns zero challenges for a sponsor with no attachments", async () => {
      const sponsor = await sponsorService.createSponsor({
        name: `Figma-${suffix}`,
        organization: "Figma Inc.",
        contactEmail: "sponsors@figma.com",
      });

      const summary = await sponsorService.getSponsorSummary(sponsor.id);
      expect(summary.challenges).toBe(0);
      expect(summary.topSubmissions).toHaveLength(0);
    });

    it("throws when sponsor does not exist", async () => {
      await expect(sponsorService.getSponsorSummary("sponsor:nonexistent")).rejects.toThrow(
        "Sponsor not found"
      );
    });
  });
});
