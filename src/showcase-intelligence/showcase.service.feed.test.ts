import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import type { Challenge, Submission } from "../challenge-intelligence/types.js";
import type { LeagueModelService } from "../league-model/league-model.service.js";
import { Discipline, EnrollmentStatus, type Participant } from "../league-model/types.js";
import { ShowcaseService } from "./showcase.service.js";

const leagueModel = {
  listParticipants: vi.fn(),
};

const challengeService = {
  getSubmissionsForParticipant: vi.fn(),
  getChallenge: vi.fn(),
};

function participant(id: string, handle: string): Participant {
  return {
    id,
    userId: null,
    handle,
    discipline: Discipline.Design,
    leagueMemberships: [
      {
        leagueId: "league:1",
        status: EnrollmentStatus.Enrolled,
        enrolledAt: "2026-05-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-05-01T00:00:00.000Z",
  };
}

function submission(overrides: Partial<Submission>): Submission {
  return {
    id: "submission:fixture",
    challengeId: "challenge:1",
    participantId: "participant:1",
    artifact: { url: "https://example.com/work" },
    isPublic: true,
    withdrawn: false,
    submittedAt: "2026-06-01T00:00:00.000Z",
    scores: [
      {
        id: "score:1",
        submissionId: "submission:fixture",
        judgeId: "judge:1",
        criteriaScores: [{ criteriaName: "Creativity", score: 90 }],
        totalScore: 90,
        rationale: "Strong work",
        scoredAt: "2026-06-02T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function challenge(id: string, title: string): Challenge {
  return {
    id,
    leagueId: "league:1",
    title,
    prompt: "Prompt",
    deadline: "2026-07-01T00:00:00.000Z",
    status: "complete" as Challenge["status"],
    scoringCriteria: [],
    createdAt: "2026-05-01T00:00:00.000Z",
  };
}

function createService() {
  return new ShowcaseService(
    leagueModel as unknown as LeagueModelService,
    challengeService as unknown as ChallengeService,
  );
}

describe("ShowcaseService.getShowcaseFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paginates public entries newest-first without duplicating the cursor boundary", async () => {
    const alex = participant("participant:alex", "alex");
    const sam = participant("participant:sam", "sam");
    const submissionsByParticipant = new Map<string, Submission[]>([
      [
        alex.id,
        [
          submission({
            id: "submission:private-newest",
            participantId: alex.id,
            submittedAt: "2026-06-04T00:00:00.000Z",
            isPublic: false,
          }),
          submission({
            id: "submission:new",
            participantId: alex.id,
            challengeId: "challenge:known",
            submittedAt: "2026-06-03T00:00:00.000Z",
          }),
          submission({
            id: "submission:no-score",
            participantId: alex.id,
            challengeId: "challenge:missing",
            submittedAt: "2026-06-02T00:00:00.000Z",
            scores: [],
          }),
        ],
      ],
      [
        sam.id,
        [
          submission({
            id: "submission:old",
            participantId: sam.id,
            challengeId: "challenge:known",
            submittedAt: "2026-06-01T00:00:00.000Z",
          }),
        ],
      ],
    ]);
    const challenges = new Map<string, Challenge | undefined>([
      ["challenge:known", challenge("challenge:known", "Known Challenge")],
      ["challenge:missing", undefined],
    ]);

    leagueModel.listParticipants.mockResolvedValue([alex, sam]);
    challengeService.getSubmissionsForParticipant.mockImplementation(async (participantId: string) => {
      return submissionsByParticipant.get(participantId) ?? [];
    });
    challengeService.getChallenge.mockImplementation(async (challengeId: string) => {
      return challenges.get(challengeId);
    });

    const service = createService();
    const fullFeed = await service.getShowcaseFeed("league:1", { limit: 10 });
    const firstPage = await service.getShowcaseFeed("league:1", { limit: 2 });
    const secondPage = await service.getShowcaseFeed("league:1", {
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });

    expect(fullFeed.entries.map((entry) => entry.submission.id)).toEqual([
      "submission:new",
      "submission:no-score",
      "submission:old",
    ]);
    expect(fullFeed.nextCursor).toBeNull();
    expect(fullFeed.entries[1]).toMatchObject({
      challengeTitle: "Unknown Challenge",
      score: undefined,
    });
    expect(firstPage.entries.map((entry) => entry.submission.id)).toEqual([
      "submission:new",
      "submission:no-score",
    ]);
    expect(firstPage.nextCursor).toBe("2026-06-02T00:00:00.000Z");
    expect(secondPage.entries.map((entry) => entry.submission.id)).toEqual(["submission:old"]);
    expect(secondPage.nextCursor).toBeNull();
    expect([...firstPage.entries, ...secondPage.entries].map((entry) => entry.submission.id)).toEqual(
      fullFeed.entries.map((entry) => entry.submission.id),
    );
  });

  it("uses a default page size of twenty entries", async () => {
    const alex = participant("participant:alex", "alex");
    const submissions = Array.from({ length: 21 }, (_, index) =>
      submission({
        id: `submission:${index.toString().padStart(2, "0")}`,
        participantId: alex.id,
        submittedAt: new Date(Date.UTC(2026, 5, 30 - index)).toISOString(),
      }),
    );

    leagueModel.listParticipants.mockResolvedValue([alex]);
    challengeService.getSubmissionsForParticipant.mockResolvedValue(submissions);
    challengeService.getChallenge.mockResolvedValue(challenge("challenge:1", "Default Limit"));

    const result = await createService().getShowcaseFeed("league:1");

    expect(result.entries).toHaveLength(20);
    expect(result.entries[0]?.submission.id).toBe("submission:00");
    expect(result.nextCursor).toBe(result.entries[19]?.submission.submittedAt);
  });
});
