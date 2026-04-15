import type { ChallengeId } from "../challenge-intelligence/types.js";

export type SponsorId = string;
export type SponsorAttachmentId = string;

export enum SponsorOutcomeStatus {
  Pending = "pending",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export interface Sponsor {
  id: SponsorId;
  name: string;
  organization: string;
  contactEmail: string;
  createdAt: string;
}

export interface ChallengeBrief {
  headline: string;
  description: string;
  deliverables: string[];
  prize?: string;
}

export interface SponsorOutcome {
  status: SponsorOutcomeStatus;
  prizeDeliveredAt?: string;
  opportunityExtendedTo?: string; // participantId
  notes?: string;
}

export interface SponsorAttachment {
  id: SponsorAttachmentId;
  sponsorId: SponsorId;
  challengeId: ChallengeId;
  brief: ChallengeBrief;
  attachedAt: string;
  outcome?: SponsorOutcome;
}

export interface CreateSponsorInput {
  name: string;
  organization: string;
  contactEmail: string;
}

export interface AttachSponsorInput {
  brief: ChallengeBrief;
}
