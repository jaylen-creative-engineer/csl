import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import { requireAuth } from "@/lib/api/require-auth.js";

const ScoringCriteriaSchema = z.object({
  name: z.string().min(1),
  weight: z.number(),
  description: z.string().optional(),
});

const Body = z.object({
  leagueId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  deadline: z.string().min(1),
  scoringCriteria: z.array(ScoringCriteriaSchema).optional(),
  sponsorId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
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
