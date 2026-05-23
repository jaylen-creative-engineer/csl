import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types.js";
import type { ParticipantId } from "../league-model/types.js";
import type { ChallengeService } from "../challenge-intelligence/challenge.service.js";
import {
  fetchLatestSkillIntent,
  insertSkillIntent,
} from "../lib/supabase/repositories/skill-journey.repository.js";
import type {
  EvidenceEntry,
  MasteryEntry,
  SkillIntent,
} from "./types.js";

/**
 * Captures declared skill intent and derives mastery / evidence views from scored submissions.
 * Mastery is the per-criterion average across a participant's scored work; evidence is the
 * ordered sprint timeline used by AI coordination and showcase surfaces.
 */
// @lat: [[lat.md/individual-learner-journey#Individual learner journey#Skill intent & mastery framing]]
export class SkillIntentService {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly challengeService: ChallengeService
  ) {}

  async createSkillIntent(
    participantId: ParticipantId,
    skillLabel: string,
    targetDisciplines: string[]
  ): Promise<SkillIntent> {
    return insertSkillIntent(this.client, participantId, skillLabel, targetDisciplines);
  }

  async getSkillIntent(participantId: ParticipantId): Promise<SkillIntent | undefined> {
    const row = await fetchLatestSkillIntent(this.client, participantId);
    return row ?? undefined;
  }

  /**
   * Build a per-criterion mastery map by averaging every criterion score across a
   * participant's submissions and all judges who scored them.
   */
  async getMasteryMap(participantId: ParticipantId): Promise<MasteryEntry[]> {
    const submissions = await this.challengeService.getSubmissionsForParticipant(participantId);
    const buckets = new Map<string, { sum: number; count: number }>();

    for (const submission of submissions) {
      for (const score of submission.scores ?? []) {
        for (const cs of score.criteriaScores) {
          const existing = buckets.get(cs.criteriaName);
          if (existing) {
            existing.sum += cs.score;
            existing.count += 1;
          } else {
            buckets.set(cs.criteriaName, { sum: cs.score, count: 1 });
          }
        }
      }
    }

    return Array.from(buckets.entries())
      .map(([criterion, { sum, count }]) => ({
        criterion,
        avgScore: count > 0 ? sum / count : 0,
        count,
      }))
      .sort((a, b) => a.criterion.localeCompare(b.criterion));
  }

  /**
   * Ordered timeline of scored evidence — newest first. Each entry collapses multi-judge
   * scores into a per-criterion average plus an overall mean of the judges' totalScores.
   */
  async getEvidenceTimeline(participantId: ParticipantId): Promise<EvidenceEntry[]> {
    const submissions = await this.challengeService.getSubmissionsForParticipant(participantId);

    const entries: EvidenceEntry[] = [];
    for (const submission of submissions) {
      const scores = submission.scores ?? [];
      if (scores.length === 0) continue;

      const criterionBuckets = new Map<string, { sum: number; count: number }>();
      for (const score of scores) {
        for (const cs of score.criteriaScores) {
          const existing = criterionBuckets.get(cs.criteriaName);
          if (existing) {
            existing.sum += cs.score;
            existing.count += 1;
          } else {
            criterionBuckets.set(cs.criteriaName, { sum: cs.score, count: 1 });
          }
        }
      }

      const criterionBreakdown = Array.from(criterionBuckets.entries())
        .map(([criterion, { sum, count }]) => ({
          criterion,
          score: count > 0 ? sum / count : 0,
        }))
        .sort((a, b) => a.criterion.localeCompare(b.criterion));

      const overall = scores.reduce((acc, s) => acc + s.totalScore, 0) / scores.length;

      entries.push({
        submissionId: submission.id,
        score: overall,
        criterionBreakdown,
        sprintDate: submission.submittedAt,
      });
    }

    return entries.sort(
      (a, b) => new Date(b.sprintDate).getTime() - new Date(a.sprintDate).getTime()
    );
  }
}
