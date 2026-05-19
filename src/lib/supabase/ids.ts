let hostCounter = 0;
let seasonCounter = 0;
let leagueCounter = 0;
let participantCounter = 0;
let challengeCounter = 0;
let submissionCounter = 0;
let scoreCounter = 0;
let sponsorCounter = 0;
let attachmentCounter = 0;

export function resetIdCounters(): void {
  hostCounter = 0;
  seasonCounter = 0;
  leagueCounter = 0;
  participantCounter = 0;
  challengeCounter = 0;
  submissionCounter = 0;
  scoreCounter = 0;
  sponsorCounter = 0;
  attachmentCounter = 0;
}

export function newHostId(): string {
  return `host:${++hostCounter}`;
}

export function newSeasonId(): string {
  return `season:${++seasonCounter}`;
}

export function newLeagueId(): string {
  return `league:${++leagueCounter}`;
}

export function newParticipantId(): string {
  return `participant:${++participantCounter}`;
}

export function newChallengeId(): string {
  return `challenge:${++challengeCounter}`;
}

export function newSubmissionId(): string {
  return `submission:${++submissionCounter}`;
}

export function newScoreId(): string {
  return `score:${++scoreCounter}`;
}

export function newSponsorId(): string {
  return `sponsor:${++sponsorCounter}`;
}

export function newSponsorAttachmentId(): string {
  return `attachment:${++attachmentCounter}`;
}
