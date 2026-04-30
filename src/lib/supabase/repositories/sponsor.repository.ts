import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types.js";
import { briefFromJson, briefToJson, outcomeFromJson, outcomeToJson } from "../mappers.js";
import type {
  ChallengeBrief,
  CreateSponsorInput,
  Sponsor,
  SponsorAttachment,
  SponsorOutcome,
} from "../../../sponsor-intelligence/types.js";

export async function insertSponsor(
  client: SupabaseClient<Database>,
  id: string,
  input: CreateSponsorInput
): Promise<Sponsor> {
  const { error } = await client.from("sponsors").insert({
    id,
    name: input.name,
    organization: input.organization,
    contact_email: input.contactEmail,
  });
  if (error) throw new Error(error.message);
  return fetchSponsor(client, id);
}

export async function fetchSponsor(client: SupabaseClient<Database>, id: string): Promise<Sponsor> {
  const { data: row, error } = await client
    .from("sponsors")
    .select("id, name, organization, contact_email, created_at")
    .eq("id", id)
    .single();
  if (error || !row) throw new Error(error?.message ?? `Sponsor not found: ${id}`);
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    contactEmail: row.contact_email,
    createdAt: row.created_at,
  };
}

export async function insertSponsorAttachment(
  client: SupabaseClient<Database>,
  id: string,
  sponsorId: string,
  challengeId: string,
  brief: ChallengeBrief
): Promise<SponsorAttachment> {
  const { error } = await client.from("sponsor_attachments").insert({
    id,
    sponsor_id: sponsorId,
    challenge_id: challengeId,
    brief: briefToJson(brief),
  });
  if (error) throw new Error(error.message);
  return fetchSponsorAttachment(client, id);
}

export async function fetchSponsorAttachment(
  client: SupabaseClient<Database>,
  id: string
): Promise<SponsorAttachment> {
  const { data: row, error } = await client
    .from("sponsor_attachments")
    .select("id, sponsor_id, challenge_id, brief, outcome, attached_at")
    .eq("id", id)
    .single();
  if (error || !row) throw new Error(error?.message ?? `SponsorAttachment not found: ${id}`);

  let outcome: SponsorOutcome | undefined;
  if (row.outcome !== null && row.outcome !== undefined) {
    outcome = outcomeFromJson(row.outcome);
  }

  return {
    id: row.id,
    sponsorId: row.sponsor_id,
    challengeId: row.challenge_id,
    brief: briefFromJson(row.brief),
    attachedAt: row.attached_at,
    outcome,
  };
}

export async function updateAttachmentOutcome(
  client: SupabaseClient<Database>,
  id: string,
  outcome: SponsorOutcome
): Promise<void> {
  const { error } = await client
    .from("sponsor_attachments")
    .update({ outcome: outcomeToJson(outcome) })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listAttachmentsForSponsor(
  client: SupabaseClient<Database>,
  sponsorId: string
): Promise<SponsorAttachment[]> {
  const { data: rows, error } = await client
    .from("sponsor_attachments")
    .select("id")
    .eq("sponsor_id", sponsorId);
  if (error) throw new Error(error.message);

  const out: SponsorAttachment[] = [];
  for (const r of rows ?? []) {
    out.push(await fetchSponsorAttachment(client, r.id));
  }
  return out;
}
