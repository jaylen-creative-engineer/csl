import { randomUUID } from "node:crypto";

export function newHostId(): string {
  return `host:${randomUUID()}`;
}

export function newSeasonId(): string {
  return `season:${randomUUID()}`;
}

export function newLeagueId(): string {
  return `league:${randomUUID()}`;
}

export function newParticipantId(): string {
  return `participant:${randomUUID()}`;
}

export function newChallengeId(): string {
  return `challenge:${randomUUID()}`;
}

export function newSubmissionId(): string {
  return `submission:${randomUUID()}`;
}

export function newScoreId(): string {
  return `score:${randomUUID()}`;
}

export function newSponsorId(): string {
  return `sponsor:${randomUUID()}`;
}

export function newSponsorAttachmentId(): string {
  return `attachment:${randomUUID()}`;
}
