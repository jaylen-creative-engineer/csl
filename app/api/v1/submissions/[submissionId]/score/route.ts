import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import type { ScoreInput } from "@/challenge-intelligence/types.js";

type Params = { submissionId: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { submissionId } = await context.params;
  const body = await readJsonBody<ScoreInput>(request);
  if (!body?.judgeId?.trim() || !Array.isArray(body.criteriaScores) || !body.rationale?.trim()) {
    return jsonError("judgeId, criteriaScores, and rationale are required");
  }
  try {
    const { challenge } = getRouteServices();
    const submission = await challenge.scoreSubmission(submissionId, {
      judgeId: body.judgeId.trim(),
      criteriaScores: body.criteriaScores,
      rationale: body.rationale.trim(),
    });
    return jsonOk(submission);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
