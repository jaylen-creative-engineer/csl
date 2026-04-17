import { pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const leagueHosts = pgTable("league_hosts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  createdAt: text("created_at").notNull(),
});

export const seasons = pgTable("seasons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const leagues = pgTable("leagues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  hostId: text("host_id").notNull().references(() => leagueHosts.id),
  seasonId: text("season_id").references(() => seasons.id),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull(),
  discipline: text("discipline").notNull(),
  createdAt: text("created_at").notNull(),
});

export const leagueMemberships = pgTable("league_memberships", {
  leagueId: text("league_id").notNull().references(() => leagues.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  status: text("status").notNull(),
  enrolledAt: text("enrolled_at").notNull(),
});

export const challenges = pgTable("challenges", {
  id: text("id").primaryKey(),
  leagueId: text("league_id").notNull().references(() => leagues.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  deadline: text("deadline").notNull(),
  status: text("status").notNull(),
  scoringCriteria: jsonb("scoring_criteria").notNull().$type<Array<{ name: string; weight: number; description?: string }>>(),
  sponsorId: text("sponsor_id"),
  createdAt: text("created_at").notNull(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  artifact: jsonb("artifact").notNull().$type<{ url: string; mimeType?: string; description?: string }>(),
  isPublic: boolean("is_public").notNull().default(true),
  submittedAt: text("submitted_at").notNull(),
  score: jsonb("score").$type<{
    id: string;
    submissionId: string;
    judgeId: string;
    criteriaScores: Array<{ criteriaName: string; score: number }>;
    totalScore: number;
    rationale: string;
    scoredAt: string;
  }>(),
});

export const sponsors = pgTable("sponsors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  contactEmail: text("contact_email").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sponsorAttachments = pgTable("sponsor_attachments", {
  id: text("id").primaryKey(),
  sponsorId: text("sponsor_id").notNull().references(() => sponsors.id),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  brief: jsonb("brief").notNull().$type<{
    headline: string;
    description: string;
    deliverables: string[];
    prize?: string;
  }>(),
  attachedAt: text("attached_at").notNull(),
  outcome: jsonb("outcome").$type<{
    status: string;
    prizeDeliveredAt?: string;
    opportunityExtendedTo?: string;
    notes?: string;
  }>(),
});
