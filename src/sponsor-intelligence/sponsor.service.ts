import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types.js";
import type { ChallengeId, Submission } from "../challenge-intelligence/types.js";
import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import {
  insertSponsor,
  fetchSponsor,
  insertSponsorAttachment,
  fetchSponsorAttachment,
  updateAttachmentOutcome,
  listAttachmentsForSponsor,
} from "../lib/supabase/repositories/sponsor.repository.js";
import { newSponsorAttachmentId, newSponsorId } from "../lib/supabase/ids.js";
import {
  type ChallengeBrief,
  type CreateSponsorInput,
  type Sponsor,
  type SponsorAttachment,
  type SponsorAttachmentId,
  type SponsorId,
  type SponsorOutcome,
} from "./types.js";

// @lat: [[lat.md/domain-model#Domain model#Domain services (implementation)#SponsorService]]
export class SponsorService {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly challengeService: ChallengeService
  ) {}

  async createSponsor(input: CreateSponsorInput): Promise<Sponsor> {
    const id = newSponsorId();
    return insertSponsor(this.client, id, input);
  }

  async getSponsor(id: SponsorId): Promise<Sponsor | undefined> {
    try {
      return await fetchSponsor(this.client, id);
    } catch {
      return undefined;
    }
  }

  async attachToChallenge(
    sponsorId: SponsorId,
    challengeId: ChallengeId,
    brief: ChallengeBrief
  ): Promise<SponsorAttachment> {
    await fetchSponsor(this.client, sponsorId);

    const challenge = await this.challengeService.getChallenge(challengeId);
    if (!challenge) throw new Error(`Challenge not found: ${challengeId}`);

    const id = newSponsorAttachmentId();
    return insertSponsorAttachment(this.client, id, sponsorId, challengeId, brief);
  }

  async getAttachment(id: SponsorAttachmentId): Promise<SponsorAttachment | undefined> {
    try {
      return await fetchSponsorAttachment(this.client, id);
    } catch {
      return undefined;
    }
  }

  async recordOutcome(attachmentId: SponsorAttachmentId, outcome: SponsorOutcome): Promise<SponsorAttachment> {
    await updateAttachmentOutcome(this.client, attachmentId, outcome);
    return fetchSponsorAttachment(this.client, attachmentId);
  }

  async getSponsorSummary(
    sponsorId: SponsorId
  ): Promise<{ challenges: number; topSubmissions: Submission[] }> {
    await fetchSponsor(this.client, sponsorId);

    const sponsorAttachments = await listAttachmentsForSponsor(this.client, sponsorId);

    const topSubmissions: Submission[] = [];
    for (const attachment of sponsorAttachments) {
      const leaderboard = await this.challengeService.getLeaderboard(attachment.challengeId);
      if (leaderboard.length > 0 && leaderboard[0]) {
        topSubmissions.push(leaderboard[0]);
      }
    }

    return {
      challenges: sponsorAttachments.length,
      topSubmissions,
    };
  }
}
