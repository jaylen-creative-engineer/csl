import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import type { Challenge, Submission } from "../challenge-intelligence/types.js";
import type { CriterionReview, SkillBand, SubmissionAIReview } from "./types.js";

let reviewCounter = 0;

function newReviewId(): string {
  reviewCounter += 1;
  return `review:${reviewCounter}`;
}

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

function classifyScoreBand(score: number): SkillBand {
  if (score >= 85) return "strong";
  if (score >= 65) return "developing";
  return "needs-work";
}

function getCriterionDescription(challenge: Challenge, criteriaName: string): string {
  const criterion = challenge.scoringCriteria.find((c) => c.name === criteriaName);
  return criterion?.description ?? criteriaName;
}

function buildStrength(criteriaName: string, scoreBand: SkillBand): string {
  if (scoreBand === "strong") {
    return `Strong ${criteriaName.toLowerCase()} decisions are visible across the submission.`;
  }
  if (scoreBand === "developing") {
    return `${criteriaName} shows a workable foundation that can be sharpened with a focused revision pass.`;
  }
  return `There is an early signal for ${criteriaName.toLowerCase()}, but it needs a clearer execution strategy.`;
}

function buildWeakness(criteriaName: string, scoreBand: SkillBand): string {
  if (scoreBand === "strong") {
    return `${criteriaName} could still improve through tighter consistency and polish choices.`;
  }
  if (scoreBand === "developing") {
    return `${criteriaName} lacks enough precision to consistently land the intended effect.`;
  }
  return `${criteriaName} is currently underdeveloped and does not yet support the project goal.`;
}

function buildActions(criteriaName: string, scoreBand: SkillBand): string[] {
  const lower = criteriaName.toLowerCase();

  if (scoreBand === "strong") {
    return [
      `Run one refinement pass to remove any distracting elements in ${lower}.`,
      `Create a side-by-side before/after snapshot explaining your strongest ${lower} decisions.`,
    ];
  }

  if (scoreBand === "developing") {
    return [
      `Ship a constrained revision focused only on ${lower} improvements.`,
      `Produce 2 alternatives for ${lower} and pick one with a short rationale.`,
    ];
  }

  return [
    `Rework the concept with ${lower} as the primary constraint before polishing.`,
    `Create a quick study of 3 references and extract one concrete ${lower} principle to apply.`,
  ];
}

export class ReviewService {
  constructor(private readonly challengeService: ChallengeService) {}

  reviewSubmission(submissionId: string): SubmissionAIReview {
    const submission = this.requireSubmission(submissionId);
    const challenge = this.requireChallenge(submission.challengeId);
    if (!submission.score) {
      throw new Error("Cannot generate AI review for unscored submission");
    }

    const criterionReviews: CriterionReview[] = submission.score.criteriaScores.map((criteriaScore) => {
      const normalized = clampScore(criteriaScore.score);
      const scoreBand = classifyScoreBand(normalized);
      const description = getCriterionDescription(challenge, criteriaScore.criteriaName);

      return {
        criteriaName: criteriaScore.criteriaName,
        score: normalized,
        scoreBand,
        summary: `${description} is currently ${scoreBand.replace("-", " ")} at ${normalized}/100.`,
        strengths: [buildStrength(criteriaScore.criteriaName, scoreBand)],
        weaknesses: [buildWeakness(criteriaScore.criteriaName, scoreBand)],
        recommendedActions: buildActions(criteriaScore.criteriaName, scoreBand),
      };
    });

    const weakest = criterionReviews.reduce<CriterionReview | undefined>((acc, next) => {
      if (!acc) return next;
      return next.score < acc.score ? next : acc;
    }, undefined);

    const overallSummary = weakest
      ? `Focus next revision on ${weakest.criteriaName.toLowerCase()} to increase total score impact.`
      : "No criteria found for review.";

    return {
      id: newReviewId(),
      submissionId: submission.id,
      participantId: submission.participantId,
      overallSummary,
      criterionReviews,
      generatedAt: new Date().toISOString(),
    };
  }

  generateRevisionActions(submissionId: string): Array<{ criteriaName: string; action: string }> {
    const review = this.reviewSubmission(submissionId);
    const prioritized = [...review.criterionReviews].sort((a, b) => a.score - b.score);
    const actions = prioritized.flatMap((criterion) =>
      criterion.recommendedActions.map((action) => ({
        criteriaName: criterion.criteriaName,
        action,
      }))
    );

    const deduped = new Map<string, { criteriaName: string; action: string }>();
    for (const item of actions) {
      const key = `${item.criteriaName}::${item.action}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }
    return Array.from(deduped.values()).slice(0, 6);
  }

  private requireSubmission(submissionId: string): Submission {
    const submission = this.challengeService.getSubmission(submissionId);
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }
    return submission;
  }

  private requireChallenge(challengeId: string): Challenge {
    const challenge = this.challengeService.getChallenge(challengeId);
    if (!challenge) {
      throw new Error(`Challenge not found: ${challengeId}`);
    }
    return challenge;
  }
}
