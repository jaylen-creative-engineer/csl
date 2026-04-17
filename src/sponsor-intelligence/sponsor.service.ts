import type { ChallengeId, Submission } from "../challenge-intelligence/types.js";
import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import {
  type ChallengeBrief,
  type CreateSponsorInput,
  type Sponsor,
  type SponsorAttachment,
  type SponsorAttachmentId,
  type SponsorId,
  type SponsorOutcome,
} from "./types.js";
import {
  InMemorySponsorAttachmentRepository,
  InMemorySponsorRepository,
} from "../persistence/in-memory/sponsor.repositories.js";
import type {
  ISponsorAttachmentRepository,
  ISponsorRepository,
} from "../persistence/repository.types.js";

export class SponsorService {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly sponsors: ISponsorRepository = new InMemorySponsorRepository(),
    private readonly attachments: ISponsorAttachmentRepository = new InMemorySponsorAttachmentRepository(),
  ) {}

  createSponsor(input: CreateSponsorInput): Sponsor {
    const sponsor: Sponsor = {
      id: this.sponsors.nextId(),
      name: input.name,
      organization: input.organization,
      contactEmail: input.contactEmail,
      createdAt: new Date().toISOString(),
    };
    this.sponsors.save(sponsor);
    return sponsor;
  }

  getSponsor(id: SponsorId): Sponsor | undefined {
    return this.sponsors.findById(id);
  }

  attachToChallenge(
    sponsorId: SponsorId,
    challengeId: ChallengeId,
    brief: ChallengeBrief
  ): SponsorAttachment {
    const sponsor = this.sponsors.findById(sponsorId);
    if (!sponsor) throw new Error(`Sponsor not found: ${sponsorId}`);

    const challenge = this.challengeService.getChallenge(challengeId);
    if (!challenge) throw new Error(`Challenge not found: ${challengeId}`);

    const attachment: SponsorAttachment = {
      id: this.attachments.nextId(),
      sponsorId,
      challengeId,
      brief,
      attachedAt: new Date().toISOString(),
    };
    this.attachments.save(attachment);
    return attachment;
  }

  getAttachment(id: SponsorAttachmentId): SponsorAttachment | undefined {
    return this.attachments.findById(id);
  }

  recordOutcome(attachmentId: SponsorAttachmentId, outcome: SponsorOutcome): SponsorAttachment {
    const attachment = this.attachments.findById(attachmentId);
    if (!attachment) throw new Error(`SponsorAttachment not found: ${attachmentId}`);

    attachment.outcome = outcome;
    this.attachments.save(attachment);
    return attachment;
  }

  getSponsorSummary(
    sponsorId: SponsorId
  ): { challenges: number; topSubmissions: Submission[] } {
    const sponsor = this.sponsors.findById(sponsorId);
    if (!sponsor) throw new Error(`Sponsor not found: ${sponsorId}`);

    const sponsorAttachments = this.attachments.findBySponsorId(sponsorId);

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
