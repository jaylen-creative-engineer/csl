import { config } from "dotenv";
import { setWorldConstructor, World } from "@cucumber/cucumber";
import { LeagueModelService } from "../../src/league-model/league-model.service.js";
import { ChallengeService } from "../../src/challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "../../src/showcase-intelligence/showcase.service.js";
import { SponsorService } from "../../src/sponsor-intelligence/sponsor.service.js";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin.js";
import { resetIdCounters } from "../../src/lib/supabase/ids.js";
import type { Submission } from "../../src/challenge-intelligence/types.js";
import type { EnrollmentResult } from "../../src/league-model/types.js";

config({ path: ".env.local" });

export class CslWorld extends World {
  leagueModel!: LeagueModelService;
  challengeService!: ChallengeService;
  showcaseService!: ShowcaseService;
  sponsorService!: SponsorService;

  currentLeagueId!: string;
  currentHostId!: string;
  currentChallengeId!: string;
  currentParticipantId!: string;
  lastSubmission: Submission | undefined;
  lastEnrollmentResult: EnrollmentResult | undefined;
  lastError: Error | undefined;
  submissionsInJudging!: Submission[];

  constructor(options: any) {
    super(options);
    this.reset();
  }

  reset() {
    resetIdCounters();
    const client = createSupabaseAdminClient();
    this.leagueModel = new LeagueModelService(client);
    this.challengeService = new ChallengeService(client);
    this.showcaseService = new ShowcaseService(this.leagueModel, this.challengeService);
    this.sponsorService = new SponsorService(client, this.challengeService);
    this.currentLeagueId = "";
    this.currentHostId = "";
    this.currentChallengeId = "";
    this.currentParticipantId = "";
    this.lastSubmission = undefined;
    this.lastEnrollmentResult = undefined;
    this.lastError = undefined;
    this.submissionsInJudging = [];
  }
}

setWorldConstructor(CslWorld);
