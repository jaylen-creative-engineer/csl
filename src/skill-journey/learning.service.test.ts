import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { LearningService } from "./learning.service.js";
import { Discipline } from "../league-model/types.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { createTestSupabaseClient } from "../test/supabase-test.js";
import { hasSupabaseTestEnv } from "../test/supabase-env.js";

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isoHoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

describe.skipIf(!hasSupabaseTestEnv())("LearningService", () => {
  let leagueModel: LeagueModelService;
  let challengeService: ChallengeService;
  let learningService: LearningService;
  let suffix: string;

  beforeEach(() => {
    suffix = randomUUID().slice(0, 8);
    const client = createTestSupabaseClient();
    leagueModel = new LeagueModelService(client);
    challengeService = new ChallengeService(client);
    learningService = new LearningService(client);
  });

  describe("frameworks", () => {
    it("creates, retrieves, and lists frameworks", async () => {
      const framework = await learningService.createFramework(
        `Brand fundamentals-${suffix}`,
        `brand-${suffix}`,
        "Foundational brand identity skills",
        [
          { id: "step-1", title: "Audit references" },
          { id: "step-2", title: "Draft a moodboard" },
        ]
      );
      expect(framework.name).toBe(`Brand fundamentals-${suffix}`);
      expect(framework.steps).toHaveLength(2);

      const found = await learningService.getFramework(framework.id);
      expect(found?.id).toBe(framework.id);

      const all = await learningService.listFrameworks(`brand-${suffix}`);
      expect(all.length).toBeGreaterThanOrEqual(1);
      expect(all.find((f) => f.id === framework.id)).toBeDefined();
    });

    it("returns undefined for missing framework", async () => {
      const found = await learningService.getFramework(`framework:missing-${suffix}`);
      expect(found).toBeUndefined();
    });
  });

  describe("learning plans", () => {
    it("creates a plan and retrieves it for the participant", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `learner-${suffix}`,
        discipline: Discipline.Design,
      });
      const framework = await learningService.createFramework(
        `F-${suffix}`,
        `s-${suffix}`,
        undefined,
        []
      );
      const plan = await learningService.createPlan(
        participant.id,
        framework.id,
        isoDaysFromNow(0),
        isoDaysFromNow(30),
        [{ description: "Ship first sprint", dueDate: isoDaysFromNow(7) }]
      );
      expect(plan.participantId).toBe(participant.id);
      expect(plan.frameworkId).toBe(framework.id);
      expect(plan.milestones).toHaveLength(1);

      const list = await learningService.listPlansForParticipant(participant.id);
      expect(list.find((p) => p.id === plan.id)).toBeDefined();
    });

    it("throws when framework does not exist", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `learner-${suffix}`,
        discipline: Discipline.Design,
      });
      await expect(
        learningService.createPlan(
          participant.id,
          `framework:missing-${suffix}`,
          undefined,
          undefined
        )
      ).rejects.toThrow("Framework not found");
    });
  });

  describe("paths", () => {
    it("creates a depth path and returns it under the plan", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `learner-${suffix}`,
        discipline: Discipline.Design,
      });
      const plan = await learningService.createPlan(
        participant.id,
        undefined,
        undefined,
        undefined
      );
      const path = await learningService.createPath(plan.id, "depth", [
        { id: "p1", title: "Deep dive on typography" },
        { id: "p2", title: "Critique session" },
      ]);
      expect(path.variant).toBe("depth");

      const paths = await learningService.getPathsForPlan(plan.id);
      expect(paths.find((p) => p.id === path.id)).toBeDefined();
    });

    it("throws when plan does not exist", async () => {
      await expect(
        learningService.createPath(`plan:missing-${suffix}`, "breadth", [])
      ).rejects.toThrow("LearningPlan not found");
    });
  });

  describe("resources", () => {
    it("links a reading resource to a step", async () => {
      const stepId = `step-${suffix}`;
      const resource = await learningService.addResource(
        "Pentagram brand essays",
        "https://example.com/pentagram",
        "reading",
        stepId
      );
      expect(resource.stepId).toBe(stepId);

      const resources = await learningService.getResourcesForStep(stepId);
      expect(resources.find((r) => r.id === resource.id)).toBeDefined();
    });

    it("links a brief resource to a challenge", async () => {
      const host = await leagueModel.createLeagueHost({
        name: `H-${suffix}`,
        organization: "Org",
      });
      const league = await leagueModel.createLeague({
        name: `L-${suffix}`,
        hostId: host.id,
      });
      const challenge = await challengeService.createChallenge({
        leagueId: league.id,
        title: `Brief Sprint-${suffix}`,
        prompt: "Prompt",
        deadline: isoHoursFromNow(48),
      });
      const resource = await learningService.addResource(
        "Sponsor brief",
        "https://example.com/brief",
        "brief",
        undefined,
        challenge.id
      );
      expect(resource.challengeId).toBe(challenge.id);

      const resources = await learningService.getResourcesForChallenge(challenge.id);
      expect(resources.find((r) => r.id === resource.id)).toBeDefined();
    });
  });

  describe("accountability", () => {
    it("adds milestones, completes them, and accepts commitments", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `learner-${suffix}`,
        discipline: Discipline.Design,
      });
      const plan = await learningService.createPlan(
        participant.id,
        undefined,
        undefined,
        undefined
      );
      const milestone = await learningService.addMilestone(
        plan.id,
        "Ship the first portfolio piece",
        isoDaysFromNow(3)
      );
      expect(milestone.completedAt).toBeNull();

      const commitment = await learningService.addCommitment(participant.id, milestone.id);
      expect(commitment.milestoneId).toBe(milestone.id);

      const completed = await learningService.completeMilestone(milestone.id);
      expect(completed.completedAt).not.toBeNull();
    });

    it("checkMilestonesDue buckets overdue vs upcoming and ignores completed", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `learner-${suffix}`,
        discipline: Discipline.Design,
      });
      const plan = await learningService.createPlan(
        participant.id,
        undefined,
        undefined,
        undefined
      );

      const overdue = await learningService.addMilestone(
        plan.id,
        "Late item",
        isoDaysFromNow(-2)
      );
      const upcoming = await learningService.addMilestone(
        plan.id,
        "Soon",
        isoDaysFromNow(3)
      );
      // Far in the future — outside 7-day window
      await learningService.addMilestone(plan.id, "Way later", isoDaysFromNow(30));
      // Completed — should not appear in either bucket
      const done = await learningService.addMilestone(
        plan.id,
        "Already done",
        isoDaysFromNow(-1)
      );
      await learningService.completeMilestone(done.id);

      const { overdue: o, upcoming: u } = await learningService.checkMilestonesDue(
        participant.id
      );
      expect(o.map((m) => m.id)).toContain(overdue.id);
      expect(o.map((m) => m.id)).not.toContain(done.id);
      expect(u.map((m) => m.id)).toContain(upcoming.id);
      expect(u.map((m) => m.id)).not.toContain(done.id);
    });

    it("throws when completing or committing to a missing milestone", async () => {
      const participant = await leagueModel.createParticipant({
        handle: `learner-${suffix}`,
        discipline: Discipline.Design,
      });
      await expect(
        learningService.completeMilestone(`milestone:missing-${suffix}`)
      ).rejects.toThrow("Milestone not found");
      await expect(
        learningService.addCommitment(participant.id, `milestone:missing-${suffix}`)
      ).rejects.toThrow("Milestone not found");
    });
  });
});
