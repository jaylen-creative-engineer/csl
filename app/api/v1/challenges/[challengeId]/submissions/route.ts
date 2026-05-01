import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import type { SubmitEntryInput } from "@/challenge-intelligence/types.js";

type Params = { challengeId: string };
type Body = { participantId: string } & SubmitEntryInput;

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { challengeId } = await context.params;
  try {
    const { challenge } = getRouteServices();
    const rows = await challenge.getSubmissionsForChallenge(challengeId);
    return jsonOk(rows);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { challengeId } = await context.params;
  const body = await readJsonBody<Body>(request);
  if (!body?.participantId?.trim() || !body.artifact?.url) {
    return jsonError("participantId and artifact.url are required");
  }
  try {
    const { challenge } = getRouteServices();
    const submission = await challenge.submitEntry(challengeId, body.participantId.trim(), {
      artifact: body.artifact,
      isPublic: body.isPublic,
    });
    return jsonCreated(submission);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
