import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { isSupabaseConfigured } from "../src/lib/supabase/env.js";
import { resetIdCounters } from "../src/lib/supabase/ids.js";
import { createCslServices, type CslServices } from "../src/lib/csl-services.js";
import { createLocalServices, type LocalServices } from "../src/lib/local-store/index.js";
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

export type AnyServices = CslServices | LocalServices;

export type Runtime = {
  leagueService: CslServices["league"] | LocalServices["league"];
  challengeService: CslServices["challenge"] | LocalServices["challenge"];
  showcaseService: CslServices["showcase"] | LocalServices["showcase"];
  sponsorService: CslServices["sponsor"] | LocalServices["sponsor"];
  state: RuntimeState;
  session: CliSession;
  mode: "supabase" | "local";
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

function createServicesFromEnv(): { services: AnyServices; mode: "supabase" | "local" } {
  if (isSupabaseConfigured()) {
    return { services: createCslServices(createSupabaseAdminClient()), mode: "supabase" };
  }
  console.log("[CSL] Running in local-store mode (no Supabase configured)");
  return { services: createLocalServices(), mode: "local" };
}

export function createRuntime(): Runtime {
  let { services, mode } = createServicesFromEnv();
  let state = defaultState();

  const session: CliSession = {
    actorMemberId: "member:cli-default",
    roles: ["member"],
  };

  const reset = () => {
    resetIdCounters();
    const next = createServicesFromEnv();
    services = next.services;
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
    mode,
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
