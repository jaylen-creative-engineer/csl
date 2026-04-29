import { LeagueModelService } from "../src/league-model/league-model.service.js";
import { ChallengeService } from "../src/challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "../src/showcase-intelligence/showcase.service.js";
import { SponsorService } from "../src/sponsor-intelligence/sponsor.service.js";
import { ReviewService } from "../src/review-intelligence/review.service.js";
import { LearningContextService } from "../src/learning-context/learning-context.service.js";
import { Discipline } from "../src/league-model/types.js";
import type { LeagueHost, League, Participant } from "../src/league-model/types.js";
import type { Challenge, Submission } from "../src/challenge-intelligence/types.js";
import type { Sponsor, SponsorAttachment } from "../src/sponsor-intelligence/types.js";

export type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };

export const j = (value: unknown): string => JSON.stringify(value, null, 2);

export type CliSession = {
  actorMemberId: string;
  roles: ("member" | "steward")[];
};

export type RuntimeState = {
  hosts: LeagueHost[];
  leagues: League[];
  participants: Participant[];
  challenges: Challenge[];
  submissions: Submission[];
  sponsors: Sponsor[];
  attachments: SponsorAttachment[];
};

export type Runtime = {
  leagueService: LeagueModelService;
  challengeService: ChallengeService;
  showcaseService: ShowcaseService;
  sponsorService: SponsorService;
  reviewService: ReviewService;
  learningContextService: LearningContextService;
  state: RuntimeState;
  session: CliSession;
  reset: () => void;
};

const defaultState = (): RuntimeState => ({
  hosts: [],
  leagues: [],
  participants: [],
  challenges: [],
  submissions: [],
  sponsors: [],
  attachments: [],
});

function seedLearningResources(service: LearningContextService): void {
  service.ingestResource({
    type: "exercise",
    title: "Originality Constraint Sprint",
    url: "https://example.com/resources/originality-constraint-sprint",
    domains: ["Originality"],
    level: "intermediate",
    estimatedEffortMinutes: 25,
  });
  service.ingestResource({
    type: "article",
    title: "Execution Polish Checklist",
    url: "https://example.com/resources/execution-polish-checklist",
    domains: ["Execution"],
    level: "beginner",
    estimatedEffortMinutes: 15,
  });
  service.ingestResource({
    type: "reference",
    title: "Clarity in Visual Communication",
    url: "https://example.com/resources/clarity-visual-communication",
    domains: ["Clarity"],
    level: "beginner",
    estimatedEffortMinutes: 20,
  });
  service.ingestResource({
    type: "course",
    title: "Creative Feedback to Revision Workflow",
    url: "https://example.com/resources/feedback-revision-workflow",
    domains: ["Originality", "Execution", "Clarity"],
    level: "intermediate",
    estimatedEffortMinutes: 90,
  });
}

export function createRuntime(): Runtime {
  let leagueService = new LeagueModelService();
  let challengeService = new ChallengeService();
  let showcaseService = new ShowcaseService(leagueService, challengeService);
  let sponsorService = new SponsorService(challengeService);
  let reviewService = new ReviewService(challengeService);
  let learningContextService = new LearningContextService();
  seedLearningResources(learningContextService);
  let state = defaultState();

  const session: CliSession = {
    actorMemberId: "member:cli-default",
    roles: ["member"],
  };

  const reset = () => {
    leagueService = new LeagueModelService();
    challengeService = new ChallengeService();
    showcaseService = new ShowcaseService(leagueService, challengeService);
    sponsorService = new SponsorService(challengeService);
    reviewService = new ReviewService(challengeService);
    learningContextService = new LearningContextService();
    seedLearningResources(learningContextService);
    state = defaultState();
  };

  return {
    get leagueService() {
      return leagueService;
    },
    get challengeService() {
      return challengeService;
    },
    get showcaseService() {
      return showcaseService;
    },
    get sponsorService() {
      return sponsorService;
    },
    get reviewService() {
      return reviewService;
    },
    get learningContextService() {
      return learningContextService;
    },
    get state() {
      return state;
    },
    session,
    reset,
  };
}

export function ok<T>(data: T): Envelope<T> {
  return { ok: true, data };
}

export function fail(error: unknown): Envelope<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

export function listDisciplines(): string[] {
  return Object.values(Discipline);
}
