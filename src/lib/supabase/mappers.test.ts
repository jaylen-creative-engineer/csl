import { describe, expect, it } from "vitest";
import { Discipline } from "../../league-model/types.js";
import { SponsorOutcomeStatus } from "../../sponsor-intelligence/types.js";
import {
  artifactFromJson,
  artifactToJson,
  briefFromJson,
  briefToJson,
  criteriaScoresFromJson,
  criteriaScoresToJson,
  deadlineFromDb,
  deadlineToDb,
  disciplineFromId,
  disciplineToId,
  outcomeFromJson,
  outcomeToJson,
  scoringCriteriaFromJson,
  scoringCriteriaToJson,
} from "./mappers.js";

describe("Supabase JSON mappers", () => {
  it("round-trips submission artifacts and omits absent optional fields", () => {
    expect(
      artifactFromJson(
        artifactToJson({
          url: "https://example.com/submission.png",
          mimeType: "image/png",
          description: "Final board",
        })
      )
    ).toEqual({
      url: "https://example.com/submission.png",
      mimeType: "image/png",
      description: "Final board",
    });

    expect(artifactToJson({ url: "https://example.com/submission.png" })).toEqual({
      url: "https://example.com/submission.png",
    });
  });

  it("rejects malformed submission artifact JSON", () => {
    expect(() => artifactFromJson(null)).toThrow("Invalid artifact JSON");
    expect(() => artifactFromJson("not-object")).toThrow("Invalid artifact JSON");
    expect(() => artifactFromJson({ mimeType: "image/png" })).toThrow("Invalid artifact JSON");
    expect(() => artifactFromJson({ url: 42 })).toThrow("Artifact url must be a string");
  });

  it("round-trips scoring criteria and defaults non-array criteria JSON to an empty list", () => {
    const criteria = [
      { name: "concept", weight: 0.6, description: "Strength of the idea" },
      { name: "craft", weight: 0.4 },
    ];

    expect(scoringCriteriaFromJson(scoringCriteriaToJson(criteria))).toEqual(criteria);
    expect(scoringCriteriaFromJson(null)).toEqual([]);
    expect(scoringCriteriaFromJson({ name: "concept", weight: 1 })).toEqual([]);
  });

  it("rejects malformed scoring criteria entries", () => {
    expect(() => scoringCriteriaFromJson(["concept"])).toThrow("Invalid scoring criteria entry");
  });

  it("round-trips criteria scores and defaults non-array scores JSON to an empty list", () => {
    const scores = [
      { criteriaName: "concept", score: 95 },
      { criteriaName: "craft", score: 80 },
    ];

    expect(criteriaScoresFromJson(criteriaScoresToJson(scores))).toEqual(scores);
    expect(criteriaScoresFromJson(null)).toEqual([]);
  });

  it("rejects malformed criteria score entries", () => {
    expect(() => criteriaScoresFromJson([42])).toThrow("Invalid criteria_scores entry");
  });

  it("round-trips sponsor briefs and rejects non-string deliverables", () => {
    const brief = {
      headline: "Launch challenge",
      description: "Create the launch campaign",
      deliverables: ["key visual", "short copy"],
      prize: "Mentorship session",
    };

    expect(briefFromJson(briefToJson(brief))).toEqual(brief);
    expect(() =>
      briefFromJson({
        headline: "Launch challenge",
        description: "Create the launch campaign",
        deliverables: ["key visual", 10],
      })
    ).toThrow("Invalid brief deliverables");
  });

  it("round-trips sponsor outcomes and rejects unknown statuses", () => {
    for (const status of [
      SponsorOutcomeStatus.Pending,
      SponsorOutcomeStatus.Delivered,
      SponsorOutcomeStatus.Cancelled,
    ]) {
      expect(outcomeFromJson(outcomeToJson({ status }))).toEqual({ status });
    }

    expect(
      outcomeFromJson(
        outcomeToJson({
          status: SponsorOutcomeStatus.Delivered,
          prizeDeliveredAt: "2026-06-20T00:00:00.000Z",
          opportunityExtendedTo: "participant:1",
          notes: "Prize shipped",
        })
      )
    ).toEqual({
      status: SponsorOutcomeStatus.Delivered,
      prizeDeliveredAt: "2026-06-20T00:00:00.000Z",
      opportunityExtendedTo: "participant:1",
      notes: "Prize shipped",
    });

    expect(() => outcomeFromJson({ status: "unknown" })).toThrow("Invalid sponsor outcome status");
  });
});

describe("Supabase scalar mappers", () => {
  it("round-trips every known discipline id", () => {
    for (const discipline of Object.values(Discipline)) {
      expect(disciplineFromId(disciplineToId(discipline))).toBe(discipline);
    }
  });

  it("rejects unknown discipline ids", () => {
    expect(() => disciplineFromId("dance")).toThrow("Unknown discipline_id: dance");
  });

  it("normalizes Postgres dates into domain ISO deadlines", () => {
    expect(deadlineFromDb("2026-06-15")).toBe("2026-06-15T00:00:00.000Z");
    expect(deadlineFromDb("2026-06-15T12:30:00.000Z")).toBe("2026-06-15T12:30:00.000Z");
  });

  it("stores deadlines as Postgres date strings using the current UTC truncation behavior", () => {
    expect(deadlineToDb("2026-06-15T00:00:00.000Z")).toBe("2026-06-15");
    expect(deadlineToDb("2026-06-15T23:00:00-05:00")).toBe("2026-06-16");
  });

  it("falls back to the leading date-shaped text for invalid deadlines", () => {
    expect(deadlineToDb("not-a-date-value")).toBe("not-a-date");
  });
});
