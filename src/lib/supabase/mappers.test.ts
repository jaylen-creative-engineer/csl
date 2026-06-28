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

describe("discipline mappers", () => {
  it("round-trips known discipline ids", () => {
    expect(disciplineFromId(disciplineToId(Discipline.Design))).toBe(Discipline.Design);
    expect(disciplineFromId(disciplineToId(Discipline.Code))).toBe(Discipline.Code);
  });

  it("rejects unknown discipline ids", () => {
    expect(() => disciplineFromId("dance")).toThrow("Unknown discipline_id: dance");
  });
});

describe("artifact mappers", () => {
  it("round-trips optional metadata without inventing missing fields", () => {
    const json = artifactToJson({
      url: "https://example.com/submission.png",
      mimeType: "image/png",
      description: "Final poster",
    });

    expect(json).toEqual({
      url: "https://example.com/submission.png",
      mimeType: "image/png",
      description: "Final poster",
    });
    expect(artifactFromJson(json)).toEqual({
      url: "https://example.com/submission.png",
      mimeType: "image/png",
      description: "Final poster",
    });
  });

  it("requires artifact JSON to include a string url", () => {
    expect(() => artifactFromJson({})).toThrow("Invalid artifact JSON");
    expect(() => artifactFromJson({ url: 123 })).toThrow("Artifact url must be a string");
  });
});

describe("scoring criteria mappers", () => {
  it("round-trips scoring criteria and criteria score arrays", () => {
    expect(
      scoringCriteriaFromJson(
        scoringCriteriaToJson([
          { name: "Creativity", weight: 0.6, description: "Originality and concept" },
          { name: "Execution", weight: 0.4 },
        ])
      )
    ).toEqual([
      { name: "Creativity", weight: 0.6, description: "Originality and concept" },
      { name: "Execution", weight: 0.4 },
    ]);

    expect(
      criteriaScoresFromJson(
        criteriaScoresToJson([
          { criteriaName: "Creativity", score: 88 },
          { criteriaName: "Execution", score: 91 },
        ])
      )
    ).toEqual([
      { criteriaName: "Creativity", score: 88 },
      { criteriaName: "Execution", score: 91 },
    ]);
  });

  it("rejects non-object entries inside score JSON arrays", () => {
    expect(() => scoringCriteriaFromJson(["Creativity"])).toThrow("Invalid scoring criteria entry");
    expect(() => criteriaScoresFromJson(["Creativity"])).toThrow("Invalid criteria_scores entry");
  });
});

describe("brief mappers", () => {
  it("round-trips briefs with required deliverables and optional prize", () => {
    const json = briefToJson({
      headline: "Launch brief",
      description: "Create a social launch kit",
      deliverables: ["Poster", "Caption"],
      prize: "$500",
    });

    expect(briefFromJson(json)).toEqual({
      headline: "Launch brief",
      description: "Create a social launch kit",
      deliverables: ["Poster", "Caption"],
      prize: "$500",
    });
  });

  it("rejects briefs with missing or non-string deliverables", () => {
    expect(() => briefFromJson({ headline: "Brief", description: "Missing deliverables" })).toThrow(
      "Invalid brief deliverables"
    );
    expect(() =>
      briefFromJson({ headline: "Brief", description: "Bad deliverables", deliverables: ["Poster", 1] })
    ).toThrow("Invalid brief deliverables");
  });
});

describe("outcome mappers", () => {
  it("round-trips sponsor outcome fields", () => {
    const json = outcomeToJson({
      status: SponsorOutcomeStatus.Delivered,
      prizeDeliveredAt: "2026-06-28T10:00:00.000Z",
      opportunityExtendedTo: "participant:1",
      notes: "Prize sent",
    });

    expect(outcomeFromJson(json)).toEqual({
      status: SponsorOutcomeStatus.Delivered,
      prizeDeliveredAt: "2026-06-28T10:00:00.000Z",
      opportunityExtendedTo: "participant:1",
      notes: "Prize sent",
    });
  });

  it("rejects unknown sponsor outcome statuses", () => {
    expect(() => outcomeFromJson({ status: "shipped" })).toThrow("Invalid sponsor outcome status");
  });
});

describe("deadline mappers", () => {
  it("normalizes Postgres date values to midnight UTC ISO strings", () => {
    expect(deadlineFromDb("2026-06-28")).toBe("2026-06-28T00:00:00.000Z");
  });

  it("passes through timestamp strings from the database", () => {
    expect(deadlineFromDb("2026-06-28T15:30:00.000Z")).toBe("2026-06-28T15:30:00.000Z");
  });

  it("stores valid ISO deadlines as UTC date-only values", () => {
    expect(deadlineToDb("2026-06-28T23:59:59.000Z")).toBe("2026-06-28");
  });

  it("falls back to the leading date segment for invalid date strings", () => {
    expect(deadlineToDb("2026-06-28-not-a-date")).toBe("2026-06-28");
  });
});
