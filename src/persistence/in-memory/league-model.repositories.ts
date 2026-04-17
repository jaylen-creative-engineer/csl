import type {
  ILeagueHostRepository,
  ILeagueRepository,
  IParticipantRepository,
  ISeasonRepository,
} from "../repository.types.js";
import type {
  League,
  LeagueHost,
  LeagueHostId,
  LeagueId,
  Participant,
  ParticipantId,
  Season,
  SeasonId,
} from "../../league-model/types.js";
import { InMemoryRepository } from "./base.repository.js";

export class InMemoryLeagueHostRepository
  extends InMemoryRepository<LeagueHost, LeagueHostId>
  implements ILeagueHostRepository
{
  constructor() {
    super("host");
  }
}

export class InMemorySeasonRepository
  extends InMemoryRepository<Season, SeasonId>
  implements ISeasonRepository
{
  constructor() {
    super("season");
  }
}

export class InMemoryLeagueRepository
  extends InMemoryRepository<League, LeagueId>
  implements ILeagueRepository
{
  constructor() {
    super("league");
  }
}

export class InMemoryParticipantRepository
  extends InMemoryRepository<Participant, ParticipantId>
  implements IParticipantRepository
{
  constructor() {
    super("participant");
  }
}
