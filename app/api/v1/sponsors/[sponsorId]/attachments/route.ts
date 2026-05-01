import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import type { ChallengeBrief } from "@/sponsor-intelligence/types.js";

type Params = { sponsorId: string };
type Body = { challengeId: string; brief: ChallengeBrief };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { sponsorId } = await context.params;
  const body = await readJsonBody<Body>(request);
  if (!body?.challengeId?.trim() || !body.brief?.headline || !body.brief?.description) {
    return jsonError("challengeId and brief (headline, description, deliverables) are required");
  }
  if (!Array.isArray(body.brief.deliverables)) {
    return jsonError("brief.deliverables must be an array");
  }
  try {
    const { sponsor } = getRouteServices();
    const attachment = await sponsor.attachToChallenge(
      sponsorId,
      body.challengeId.trim(),
      body.brief
    );
    return jsonCreated(attachment);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
