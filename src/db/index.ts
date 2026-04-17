export { db } from "./client.js";
export type { Db } from "./client.js";

export {
  DrizzleLeagueHostRepository,
  DrizzleSeasonRepository,
  DrizzleLeagueRepository,
  DrizzleParticipantRepository,
} from "./repositories/league-model.repositories.js";

export {
  DrizzleChallengeRepository,
  DrizzleSubmissionRepository,
} from "./repositories/challenge.repositories.js";

export {
  DrizzleSponsorRepository,
  DrizzleSponsorAttachmentRepository,
} from "./repositories/sponsor.repositories.js";

import type { Db } from "./client.js";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "../showcase-intelligence/showcase.service.js";
import { SponsorService } from "../sponsor-intelligence/sponsor.service.js";
import {
  DrizzleLeagueHostRepository,
  DrizzleSeasonRepository,
  DrizzleLeagueRepository,
  DrizzleParticipantRepository,
} from "./repositories/league-model.repositories.js";
import {
  DrizzleChallengeRepository,
  DrizzleSubmissionRepository,
} from "./repositories/challenge.repositories.js";
import {
  DrizzleSponsorRepository,
  DrizzleSponsorAttachmentRepository,
} from "./repositories/sponsor.repositories.js";

export function createDbServices(dbClient: Db) {
  const leagueModel = new LeagueModelService(
    new DrizzleLeagueHostRepository(dbClient),
    new DrizzleSeasonRepository(dbClient),
    new DrizzleLeagueRepository(dbClient),
    new DrizzleParticipantRepository(dbClient)
  );

  const challengeService = new ChallengeService(
    new DrizzleChallengeRepository(dbClient),
    new DrizzleSubmissionRepository(dbClient)
  );

  const showcaseService = new ShowcaseService(leagueModel, challengeService);

  const sponsorService = new SponsorService(
    challengeService,
    new DrizzleSponsorRepository(dbClient),
    new DrizzleSponsorAttachmentRepository(dbClient)
  );

  return { leagueModel, challengeService, showcaseService, sponsorService };
}
