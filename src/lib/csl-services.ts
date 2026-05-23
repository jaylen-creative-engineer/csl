import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types.js";
import { LeagueModelService } from "../league-model/league-model.service.js";
import { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import { ShowcaseService } from "../showcase-intelligence/showcase.service.js";
import { SponsorService } from "../sponsor-intelligence/sponsor.service.js";
import { SkillIntentService } from "../skill-journey/skill-intent.service.js";
import { LearningService } from "../skill-journey/learning.service.js";

/**
 * Wires domain services to a single Supabase client (admin in trusted server code,
 * or user-scoped server client once RLS + auth are enforced).
 */
export function createCslServices(client: SupabaseClient<Database>) {
  const league = new LeagueModelService(client);
  const challenge = new ChallengeService(client);
  const showcase = new ShowcaseService(league, challenge);
  const sponsor = new SponsorService(client, challenge);
  const skillIntentService = new SkillIntentService(client, challenge);
  const learningService = new LearningService(client);
  return {
    league,
    challenge,
    showcase,
    sponsor,
    skillIntentService,
    learningService,
  };
}

export type CslServices = ReturnType<typeof createCslServices>;
