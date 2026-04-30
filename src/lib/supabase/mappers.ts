import type { Json } from "./database.types.js";
import { Discipline } from "../../league-model/types.js";
import type { ScoringCriteria, SubmissionArtifact, CriteriaScore } from "../../challenge-intelligence/types.js";
import type { ChallengeBrief, SponsorOutcome } from "../../sponsor-intelligence/types.js";
import { SponsorOutcomeStatus } from "../../sponsor-intelligence/types.js";

const DISCIPLINE_BY_ID: Record<string, Discipline> = {
  design: Discipline.Design,
  writing: Discipline.Writing,
  code: Discipline.Code,
  video: Discipline.Video,
  strategy: Discipline.Strategy,
  photography: Discipline.Photography,
  illustration: Discipline.Illustration,
  other: Discipline.Other,
};

export function disciplineToId(d: Discipline): string {
  return d;
}

export function disciplineFromId(id: string): Discipline {
  const d = DISCIPLINE_BY_ID[id];
  if (!d) throw new Error(`Unknown discipline_id: ${id}`);
  return d;
}

export function artifactToJson(artifact: SubmissionArtifact): Json {
  return {
    url: artifact.url,
    ...(artifact.mimeType !== undefined ? { mimeType: artifact.mimeType } : {}),
    ...(artifact.description !== undefined ? { description: artifact.description } : {}),
  };
}

export function artifactFromJson(json: Json): SubmissionArtifact {
  if (typeof json !== "object" || json === null || !("url" in json)) {
    throw new Error("Invalid artifact JSON");
  }
  const o = json as Record<string, Json>;
  const url = o.url;
  if (typeof url !== "string") throw new Error("Artifact url must be a string");
  return {
    url,
    ...(typeof o.mimeType === "string" ? { mimeType: o.mimeType } : {}),
    ...(typeof o.description === "string" ? { description: o.description } : {}),
  };
}

export function scoringCriteriaToJson(criteria: ScoringCriteria[]): Json {
  return criteria.map((c) => ({
    name: c.name,
    weight: c.weight,
    ...(c.description !== undefined ? { description: c.description } : {}),
  }));
}

export function scoringCriteriaFromJson(json: Json): ScoringCriteria[] {
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Invalid scoring criteria entry");
    }
    const o = item as Record<string, Json>;
    return {
      name: String(o.name),
      weight: Number(o.weight),
      ...(typeof o.description === "string" ? { description: o.description } : {}),
    };
  });
}

export function criteriaScoresToJson(scores: CriteriaScore[]): Json {
  return scores.map((s) => ({ criteriaName: s.criteriaName, score: s.score }));
}

export function criteriaScoresFromJson(json: Json): CriteriaScore[] {
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Invalid criteria_scores entry");
    }
    const o = item as Record<string, Json>;
    return {
      criteriaName: String(o.criteriaName),
      score: Number(o.score),
    };
  });
}

export function briefToJson(brief: ChallengeBrief): Json {
  return {
    headline: brief.headline,
    description: brief.description,
    deliverables: brief.deliverables,
    ...(brief.prize !== undefined ? { prize: brief.prize } : {}),
  };
}

export function briefFromJson(json: Json): ChallengeBrief {
  if (typeof json !== "object" || json === null) throw new Error("Invalid brief JSON");
  const o = json as Record<string, Json>;
  const deliverables = o.deliverables;
  if (!Array.isArray(deliverables) || !deliverables.every((x) => typeof x === "string")) {
    throw new Error("Invalid brief deliverables");
  }
  return {
    headline: String(o.headline),
    description: String(o.description),
    deliverables: deliverables as string[],
    ...(typeof o.prize === "string" ? { prize: o.prize } : {}),
  };
}

export function outcomeToJson(outcome: SponsorOutcome): Json {
  return {
    status: outcome.status,
    ...(outcome.prizeDeliveredAt !== undefined ? { prizeDeliveredAt: outcome.prizeDeliveredAt } : {}),
    ...(outcome.opportunityExtendedTo !== undefined
      ? { opportunityExtendedTo: outcome.opportunityExtendedTo }
      : {}),
    ...(outcome.notes !== undefined ? { notes: outcome.notes } : {}),
  };
}

export function outcomeFromJson(json: Json): SponsorOutcome {
  if (typeof json !== "object" || json === null) throw new Error("Invalid outcome JSON");
  const o = json as Record<string, Json>;
  const status = o.status as SponsorOutcomeStatus;
  if (
    status !== SponsorOutcomeStatus.Pending &&
    status !== SponsorOutcomeStatus.Delivered &&
    status !== SponsorOutcomeStatus.Cancelled
  ) {
    throw new Error("Invalid sponsor outcome status");
  }
  return {
    status,
    ...(typeof o.prizeDeliveredAt === "string" ? { prizeDeliveredAt: o.prizeDeliveredAt } : {}),
    ...(typeof o.opportunityExtendedTo === "string"
      ? { opportunityExtendedTo: o.opportunityExtendedTo }
      : {}),
    ...(typeof o.notes === "string" ? { notes: o.notes } : {}),
  };
}

/** Normalize Postgres `date` or timestamptz string for domain `deadline` comparisons. */
export function deadlineFromDb(s: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T00:00:00.000Z`;
  }
  return s;
}

/** Store deadline as YYYY-MM-DD for Postgres `date` columns. */
export function deadlineToDb(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}
