export type LearningResourceType = "course" | "article" | "video" | "exercise" | "reference";

export type LearningResourceLevel = "beginner" | "intermediate" | "advanced";

export interface LearningResource {
  id: string;
  type: LearningResourceType;
  title: string;
  url: string;
  domains: string[];
  level: LearningResourceLevel;
  estimatedEffortMinutes: number;
}

export interface RecommendedResource extends LearningResource {
  matchedDomain: string;
  rationale: string;
}
