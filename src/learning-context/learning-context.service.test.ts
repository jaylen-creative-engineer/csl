import { describe, it, expect } from "vitest";
import { LearningContextService } from "./learning-context.service.js";

describe("LearningContextService", () => {
  it("returns recommendations ranked by domain matches and effort", () => {
    const service = new LearningContextService();
    service.ingestResource({
      type: "article",
      title: "Execution fundamentals",
      url: "https://example.com/execution",
      domains: ["Execution"],
      level: "intermediate",
      estimatedEffortMinutes: 30,
    });
    service.ingestResource({
      type: "exercise",
      title: "Originality drills",
      url: "https://example.com/originality",
      domains: ["Originality"],
      level: "beginner",
      estimatedEffortMinutes: 20,
    });
    service.ingestResource({
      type: "course",
      title: "Originality and execution sprint",
      url: "https://example.com/sprint",
      domains: ["Originality", "Execution"],
      level: "intermediate",
      estimatedEffortMinutes: 120,
    });

    const recs = service.recommendResourcesForDomains(["Originality", "Execution"], { limit: 3 });
    expect(recs).toHaveLength(3);
    expect(recs[0]?.title).toBe("Originality and execution sprint");
    expect(recs[0]?.matchedDomain).toBe("originality");
  });

  it("returns no recommendations when no resources match", () => {
    const service = new LearningContextService();
    service.ingestResource({
      type: "article",
      title: "Typography basics",
      url: "https://example.com/typography",
      domains: ["Typography"],
      level: "beginner",
      estimatedEffortMinutes: 25,
    });

    const recs = service.recommendResourcesForDomains(["Originality"]);
    expect(recs).toEqual([]);
  });
});
