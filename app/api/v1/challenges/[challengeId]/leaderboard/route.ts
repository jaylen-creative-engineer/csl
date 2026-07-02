import { NextResponse } from "next/server.js";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError } from "@/lib/api/http.js";
import { aggregateScore } from "@/challenge-intelligence/challenge.service.js";
import type { Submission } from "@/challenge-intelligence/types.js";

type Params = { challengeId: string };

type LeaderboardEntry = {
  rank: number;
  participantId: string;
  score: number;
  submissionId: string;
};

function toLeaderboardEntry(submission: Submission, index: number): LeaderboardEntry {
  return {
    rank: index + 1,
    participantId: submission.participantId,
    score: aggregateScore(submission.scores ?? []),
    submissionId: submission.id,
  };
}

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { challengeId } = await context.params;
  const url = new URL(request.url);
  const pageRaw = Number(url.searchParams.get("page") ?? 1);
  const limitRaw = Number(url.searchParams.get("limit") ?? 20);
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
  try {
    const { challenge } = getRouteServices();
    const rows = await challenge.getLeaderboard(challengeId);
    const total = rows.length;
    const start = (page - 1) * limit;
    const data = rows.map(toLeaderboardEntry).slice(start, start + limit);
    return NextResponse.json({ ok: true as const, data, meta: { total, page, limit } });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
