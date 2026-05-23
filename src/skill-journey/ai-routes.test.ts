import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the Anthropic SDK before any route imports — they run as part of evaluating
// the route module via the createAnthropicClient factory.
const createMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: createMock };
    },
  };
});

// Mock the route services factory so we don't hit Supabase. Each test customizes the
// per-service mock surface as needed.
const skillIntentMocks = {
  getSkillIntent: vi.fn(),
  getEvidenceTimeline: vi.fn(),
  getMasteryMap: vi.fn(),
};
const learningMocks = {
  getFramework: vi.fn(),
  listPlansForParticipant: vi.fn(),
  checkMilestonesDue: vi.fn(),
};
const leagueMocks = {
  getParticipant: vi.fn(),
};

vi.mock("@/lib/api/route-services.js", () => ({
  getRouteServices: () => ({
    skillIntentService: skillIntentMocks,
    learningService: learningMocks,
    league: leagueMocks,
  }),
}));

// Dynamic imports happen after mocks are registered.
const recommendRoute = await import(
  "../../app/api/v1/learners/[participantId]/recommend-path/route.js"
);
const synthesizeRoute = await import(
  "../../app/api/v1/learners/[participantId]/synthesize-plan/route.js"
);
const nextActionsRoute = await import(
  "../../app/api/v1/learners/[participantId]/next-actions/route.js"
);

function paramsFor(participantId: string) {
  return { params: Promise.resolve({ participantId }) };
}

function aiTextResponse(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

beforeEach(() => {
  createMock.mockReset();
  for (const fn of Object.values(skillIntentMocks)) fn.mockReset();
  for (const fn of Object.values(learningMocks)) fn.mockReset();
  for (const fn of Object.values(leagueMocks)) fn.mockReset();
});

describe("POST /api/v1/learners/[participantId]/recommend-path", () => {
  it("returns 404 when participant does not exist", async () => {
    leagueMocks.getParticipant.mockResolvedValue(undefined);

    const res = await recommendRoute.POST(
      new Request("http://test/recommend-path", { method: "POST" }),
      paramsFor("participant:missing")
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Participant not found");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("invokes claude-opus-4-7 with cached system + skill profile and returns ranked suggestions", async () => {
    leagueMocks.getParticipant.mockResolvedValue({
      id: "participant:1",
      handle: "alex",
      discipline: "design",
    });
    skillIntentMocks.getSkillIntent.mockResolvedValue({
      id: "intent:1",
      skillLabel: "Brand identity",
      targetDisciplines: ["design"],
    });
    skillIntentMocks.getEvidenceTimeline.mockResolvedValue([
      {
        submissionId: "submission:1",
        score: 82,
        criterionBreakdown: [{ criterion: "Creativity", score: 85 }],
        sprintDate: "2026-05-01T00:00:00.000Z",
      },
    ]);
    skillIntentMocks.getMasteryMap.mockResolvedValue([
      { criterion: "Creativity", avgScore: 85, count: 1 },
    ]);

    createMock.mockResolvedValue(
      aiTextResponse({
        suggestions: [
          {
            title: "Deep dive on typography",
            rationale: "Creativity is strong; lift Execution next.",
            focusCriteria: ["Execution"],
            variant: "depth",
          },
        ],
      })
    );

    const res = await recommendRoute.POST(
      new Request("http://test/recommend-path", { method: "POST" }),
      paramsFor("participant:1")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.model).toBe("claude-opus-4-7");
    expect(body.data.suggestions).toHaveLength(1);
    expect(body.data.suggestions[0].title).toBe("Deep dive on typography");

    expect(createMock).toHaveBeenCalledTimes(1);
    const args = createMock.mock.calls[0]?.[0];
    expect(args.model).toBe("claude-opus-4-7");
    expect(Array.isArray(args.system)).toBe(true);
    expect(args.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(args.system[1].cache_control).toEqual({ type: "ephemeral" });
  });

  it("returns suggestions=null when the model reply is not valid JSON", async () => {
    leagueMocks.getParticipant.mockResolvedValue({
      id: "participant:1",
      handle: "alex",
      discipline: "design",
    });
    skillIntentMocks.getSkillIntent.mockResolvedValue(undefined);
    skillIntentMocks.getEvidenceTimeline.mockResolvedValue([]);
    skillIntentMocks.getMasteryMap.mockResolvedValue([]);
    createMock.mockResolvedValue({ content: [{ type: "text", text: "not json" }] });

    const res = await recommendRoute.POST(
      new Request("http://test/recommend-path", { method: "POST" }),
      paramsFor("participant:1")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.suggestions).toBeNull();
    expect(body.data.raw).toBe("not json");
  });
});

describe("POST /api/v1/learners/[participantId]/synthesize-plan", () => {
  it("returns 422 when body is missing frameworkId", async () => {
    const res = await synthesizeRoute.POST(
      new Request("http://test/synthesize-plan", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
      paramsFor("participant:1")
    );
    expect(res.status).toBe(422);
  });

  it("returns 404 when framework does not exist", async () => {
    leagueMocks.getParticipant.mockResolvedValue({
      id: "participant:1",
      handle: "alex",
      discipline: "design",
    });
    learningMocks.getFramework.mockResolvedValue(undefined);

    const res = await synthesizeRoute.POST(
      new Request("http://test/synthesize-plan", {
        method: "POST",
        body: JSON.stringify({ frameworkId: "framework:missing" }),
        headers: { "content-type": "application/json" },
      }),
      paramsFor("participant:1")
    );

    expect(res.status).toBe(404);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("invokes claude-opus-4-7 with framework + intent context and returns a structured plan", async () => {
    leagueMocks.getParticipant.mockResolvedValue({
      id: "participant:1",
      handle: "alex",
      discipline: "design",
    });
    learningMocks.getFramework.mockResolvedValue({
      id: "framework:1",
      name: "Brand fundamentals",
      skillLabel: "brand",
      description: "Brand basics",
      steps: [{ id: "s1", title: "Audit references" }],
    });
    skillIntentMocks.getSkillIntent.mockResolvedValue({
      skillLabel: "Brand identity",
      targetDisciplines: ["design"],
    });

    createMock.mockResolvedValue(
      aiTextResponse({
        plan: {
          summary: "8-week brand identity track",
          milestones: [{ description: "Pick a brand", dueOffsetDays: 3 }],
          paths: [
            {
              variant: "depth",
              steps: [{ title: "Audit references", description: "Build moodboard" }],
            },
          ],
        },
      })
    );

    const res = await synthesizeRoute.POST(
      new Request("http://test/synthesize-plan", {
        method: "POST",
        body: JSON.stringify({
          frameworkId: "framework:1",
          constraints: { weeklyHours: 4 },
        }),
        headers: { "content-type": "application/json" },
      }),
      paramsFor("participant:1")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.model).toBe("claude-opus-4-7");
    expect(body.data.plan.summary).toContain("brand identity");

    const args = createMock.mock.calls[0]?.[0];
    expect(args.model).toBe("claude-opus-4-7");
    expect(args.system[1].cache_control).toEqual({ type: "ephemeral" });
  });
});

describe("POST /api/v1/learners/[participantId]/next-actions", () => {
  it("returns 404 when participant does not exist", async () => {
    leagueMocks.getParticipant.mockResolvedValue(undefined);

    const res = await nextActionsRoute.POST(
      new Request("http://test/next-actions", { method: "POST" }),
      paramsFor("participant:missing")
    );

    expect(res.status).toBe(404);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("invokes claude-haiku-4-5-20251001 with milestone buckets and returns next actions", async () => {
    leagueMocks.getParticipant.mockResolvedValue({
      id: "participant:1",
      handle: "alex",
      discipline: "design",
    });
    skillIntentMocks.getEvidenceTimeline.mockResolvedValue([
      {
        submissionId: "submission:1",
        score: 75,
        criterionBreakdown: [{ criterion: "Creativity", score: 75 }],
        sprintDate: "2026-05-15T00:00:00.000Z",
      },
    ]);
    learningMocks.listPlansForParticipant.mockResolvedValue([
      {
        id: "plan:1",
        milestones: [{ description: "Submit second piece", dueDate: "2026-05-30" }],
      },
    ]);
    learningMocks.checkMilestonesDue.mockResolvedValue({
      overdue: [],
      upcoming: [{ id: "milestone:1", description: "Submit second piece" }],
    });

    createMock.mockResolvedValue(
      aiTextResponse({
        actions: [
          { title: "Outline next sprint entry", why: "Build on Creativity strength", estMinutes: 30 },
        ],
      })
    );

    const res = await nextActionsRoute.POST(
      new Request("http://test/next-actions", { method: "POST" }),
      paramsFor("participant:1")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.model).toBe("claude-haiku-4-5-20251001");
    expect(body.data.actions).toHaveLength(1);

    const args = createMock.mock.calls[0]?.[0];
    expect(args.model).toBe("claude-haiku-4-5-20251001");
    expect(args.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(args.system[1].cache_control).toEqual({ type: "ephemeral" });
  });
});
