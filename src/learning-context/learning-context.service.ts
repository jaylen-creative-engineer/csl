import type { SubmissionAIReview } from "../review-intelligence/types.js";
import type {
  LearningResource,
  LearningResourceType,
  RecommendedResource,
} from "./types.js";

let resourceCounter = 0;

function newResourceId(): string {
  resourceCounter += 1;
  return `resource:${resourceCounter}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export class LearningContextService {
  private readonly resources = new Map<string, LearningResource>();

  constructor(seedResources: LearningResource[] = []) {
    for (const resource of seedResources) {
      this.resources.set(resource.id, {
        ...resource,
        domains: resource.domains.map(normalize),
      });
    }
  }

  ingestResource(input: Omit<LearningResource, "id">): LearningResource {
    const resource: LearningResource = {
      ...input,
      id: newResourceId(),
      domains: input.domains.map(normalize),
    };
    this.resources.set(resource.id, resource);
    return resource;
  }

  listResources(): LearningResource[] {
    return Array.from(this.resources.values());
  }

  recommendResourcesForDomains(
    domains: string[],
    options?: {
      preferredTypes?: LearningResourceType[];
      limit?: number;
      maxEffortMinutes?: number;
    }
  ): RecommendedResource[] {
    const requested = [...new Set(domains.map(normalize))];
    const preferredTypes = options?.preferredTypes;
    const limit = options?.limit ?? 5;
    const maxEffortMinutes = options?.maxEffortMinutes;
    const preferredSet = preferredTypes ? new Set(preferredTypes) : undefined;

    const scored = this.listResources()
      .map((resource) => {
        const matchedDomains = resource.domains.filter((domain) => requested.includes(domain));
        if (matchedDomains.length === 0) {
          return null;
        }
        if (preferredSet && !preferredSet.has(resource.type)) {
          return null;
        }
        if (maxEffortMinutes !== undefined && resource.estimatedEffortMinutes > maxEffortMinutes) {
          return null;
        }

        return {
          resource,
          matchedDomains,
          matchedCount: matchedDomains.length,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null)
      .sort((a, b) => {
        if (b.matchedCount !== a.matchedCount) {
          return b.matchedCount - a.matchedCount;
        }
        if (a.resource.estimatedEffortMinutes !== b.resource.estimatedEffortMinutes) {
          return a.resource.estimatedEffortMinutes - b.resource.estimatedEffortMinutes;
        }
        return a.resource.title.localeCompare(b.resource.title);
      })
      .slice(0, limit);

    return scored.map(({ resource, matchedDomains }) => ({
      ...resource,
      matchedDomain: matchedDomains[0] ?? "general",
      rationale: `Targets ${matchedDomains.join(", ")} via a ${resource.type} resource.`,
    }));
  }

  recommendResourcesForReview(
    review: SubmissionAIReview,
    options?: {
      preferredTypes?: LearningResourceType[];
      limit?: number;
      maxEffortMinutes?: number;
    }
  ): RecommendedResource[] {
    const weakDomains = review.criterionReviews
      .filter((criterion) => criterion.weaknesses.length > 0)
      .map((criterion) => criterion.criteriaName);

    return this.recommendResourcesForDomains(weakDomains, options);
  }
}
