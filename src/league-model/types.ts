export enum Discipline {
  Design = "design",
  Writing = "writing",
  Code = "code",
  Video = "video",
  Strategy = "strategy",
  Photography = "photography",
  Illustration = "illustration",
  Other = "other",
}

export enum LeagueStatus {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

export enum EnrollmentStatus {
  Enrolled = "enrolled",
  Withdrawn = "withdrawn",
}

export type LeagueId = string;
export type SeasonId = string;
export type ParticipantId = string;
export type LeagueHostId = string;

export interface Season {
  id: SeasonId;
  name: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  createdAt: string;
}

export interface LeagueHost {
  id: LeagueHostId;
  name: string;
  organization: string;
  leagueIds: LeagueId[];
  createdAt: string;
}

export interface League {
  id: LeagueId;
  name: string;
  hostId: LeagueHostId;
  seasonId: SeasonId | null;
  status: LeagueStatus;
  challengeIds: string[];
  createdAt: string;
}

export interface Participant {
  id: ParticipantId;
  /** Set when the row is linked to Supabase Auth (`auth.users.id`). */
  userId: string | null;
  handle: string;
  discipline: Discipline;
  leagueMemberships: LeagueMembership[];
  createdAt: string;
}

export interface LeagueMembership {
  leagueId: LeagueId;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface EnrollmentResult {
  success: boolean;
  participantId: ParticipantId;
  leagueId: LeagueId;
  status: EnrollmentStatus;
  reason?: string;
}

export interface CreateLeagueInput {
  name: string;
  hostId: LeagueHostId;
  seasonId?: SeasonId;
}

export interface CreateSeasonInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateLeagueHostInput {
  name: string;
  organization: string;
}

export interface CreateParticipantInput {
  handle: string;
  discipline: Discipline;
  /** Optional link to `auth.users.id` once auth is wired. */
  userId?: string | null;
}
