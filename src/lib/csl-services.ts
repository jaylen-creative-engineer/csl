import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types.js";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "../showcase-intelligence/showcase.service.js";
import { SponsorService } from "../sponsor-intelligence/sponsor.service.js";

/**
 * Wires domain services to a single Supabase client (admin in trusted server code,
 * or user-scoped server client once RLS + auth are enforced).
 */
export function createCslServices(client: SupabaseClient<Database>) {
  const league = new LeagueModelService(client);
  const challenge = new ChallengeService(client);
  const showcase = new ShowcaseService(league, challenge);
  const sponsor = new SponsorService(client, challenge);
  return { league, challenge, showcase, sponsor };
}

export type CslServices = ReturnType<typeof createCslServices>;
