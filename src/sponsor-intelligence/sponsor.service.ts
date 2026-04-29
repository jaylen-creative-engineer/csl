import type { ChallengeId, Submission } from "../challenge-intelligence/types.js";
import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import {
  type AttachSponsorInput,
  type ChallengeBrief,
  type CreateSponsorInput,
  type Sponsor,
  type SponsorAttachment,
  type SponsorAttachmentId,
  type SponsorId,
  type SponsorOutcome,
} from "./types.js";

let sponsorCounter = 0;
let attachmentCounter = 0;

function newId(prefix: string, counter: number): string {
  return `${prefix}:${counter}`;
}

// @lat: [[lat.md/domain-model#Domain model#Domain services (implementation)#SponsorService]]
export class SponsorService {
  private readonly sponsors = new Map<SponsorId, Sponsor>();
  private readonly attachments = new Map<SponsorAttachmentId, SponsorAttachment>();

  constructor(private readonly challengeService: ChallengeService) {}

  createSponsor(input: CreateSponsorInput): Sponsor {
    const id = newId("sponsor", ++sponsorCounter);
    const sponsor: Sponsor = {
      id,
      name: input.name,
      organization: input.organization,
      contactEmail: input.contactEmail,
      createdAt: new Date().toISOString(),
    };
    this.sponsors.set(id, sponsor);
    return sponsor;
  }

  getSponsor(id: SponsorId): Sponsor | undefined {
    return this.sponsors.get(id);
  }

  attachToChallenge(
    sponsorId: SponsorId,
    challengeId: ChallengeId,
    brief: ChallengeBrief
  ): SponsorAttachment {
    const sponsor = this.sponsors.get(sponsorId);
    if (!sponsor) throw new Error(`Sponsor not found: ${sponsorId}`);

    const challenge = this.challengeService.getChallenge(challengeId);
    if (!challenge) throw new Error(`Challenge not found: ${challengeId}`);

    const id = newId("attachment", ++attachmentCounter);
    const attachment: SponsorAttachment = {
      id,
      sponsorId,
      challengeId,
      brief,
      attachedAt: new Date().toISOString(),
    };
    this.attachments.set(id, attachment);
    return attachment;
  }

  getAttachment(id: SponsorAttachmentId): SponsorAttachment | undefined {
    return this.attachments.get(id);
  }

  recordOutcome(attachmentId: SponsorAttachmentId, outcome: SponsorOutcome): SponsorAttachment {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment) throw new Error(`SponsorAttachment not found: ${attachmentId}`);

    attachment.outcome = outcome;
    return attachment;
  }

  getSponsorSummary(
    sponsorId: SponsorId
  ): { challenges: number; topSubmissions: Submission[] } {
    const sponsor = this.sponsors.get(sponsorId);
    if (!sponsor) throw new Error(`Sponsor not found: ${sponsorId}`);

    const sponsorAttachments = Array.from(this.attachments.values()).filter(
      (a) => a.sponsorId === sponsorId
    );

    const topSubmissions: Submission[] = [];
    for (const attachment of sponsorAttachments) {
      const leaderboard = this.challengeService.getLeaderboard(attachment.challengeId);
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
