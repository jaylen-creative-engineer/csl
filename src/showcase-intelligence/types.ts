import type { Discipline, LeagueId, ParticipantId } from "../league-model/types.js";
import type { Submission } from "../challenge-intelligence/types.js";

export interface SkillSignal {
  participantId: ParticipantId;
  discipline: Discipline;
  domain: string; // scoring criteria name used as a skill domain
  averageScore: number;
  sampleCount: number;
}

export interface ShowcaseEntry {
  submission: Submission;
  participantHandle: string;
  discipline: Discipline;
  challengeTitle: string;
  score?: number;
}

export interface Portfolio {
  participantId: ParticipantId;
  handle: string;
  discipline: Discipline;
  entries: ShowcaseEntry[];
  skillSignals: SkillSignal[];
  aggregateScore: number;
  generatedAt: string;
}

export interface PublicProfile {
  participantId: ParticipantId;
  handle: string;
  discipline: Discipline;
  aggregateScore: number;
  submissionCount: number;
  leagueIds: LeagueId[];
}
