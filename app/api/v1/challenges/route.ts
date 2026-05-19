import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import type { ScoringCriteria } from "@/challenge-intelligence/types.js";

type Body = {
  leagueId: string;
  title: string;
  prompt: string;
  deadline: string;
  scoringCriteria?: ScoringCriteria[];
  sponsorId?: string;
};

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.leagueId?.trim() || !body.title?.trim() || !body.prompt?.trim() || !body.deadline) {
    return jsonError("leagueId, title, prompt, and deadline are required");
  }
  try {
    const { challenge } = getRouteServices();
    const row = await challenge.createChallenge({
      leagueId: body.leagueId.trim(),
      title: body.title.trim(),
      prompt: body.prompt.trim(),
      deadline: body.deadline,
      scoringCriteria: body.scoringCriteria,
      sponsorId: body.sponsorId,
    });
    return jsonCreated(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
