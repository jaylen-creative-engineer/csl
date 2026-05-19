import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { resetIdCounters } from "../src/lib/supabase/ids.js";
import { createCslServices, type CslServices } from "../src/lib/csl-services.js";
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
  leagueService: CslServices["league"];
  challengeService: CslServices["challenge"];
  showcaseService: CslServices["showcase"];
  sponsorService: CslServices["sponsor"];
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

function createServicesFromEnv(): CslServices {
  return createCslServices(createSupabaseAdminClient());
}

export function createRuntime(): Runtime {
  let services = createServicesFromEnv();
  let state = defaultState();

  const session: CliSession = {
    actorMemberId: "member:cli-default",
    roles: ["member"],
  };

  const reset = () => {
    resetIdCounters();
    services = createServicesFromEnv();
    state = defaultState();
  };

  return {
    get leagueService() {
      return services.league;
    },
    get challengeService() {
      return services.challenge;
    },
    get showcaseService() {
      return services.showcase;
    },
    get sponsorService() {
      return services.sponsor;
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
