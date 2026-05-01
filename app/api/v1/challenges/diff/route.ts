import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";

type Body = { challengeAId: string; challengeBId: string };

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.challengeAId?.trim() || !body?.challengeBId?.trim()) {
    return jsonError("challengeAId and challengeBId are required");
  }
  try {
    const { challenge } = getRouteServices();
    const diff = await challenge.diffChallenges(body.challengeAId.trim(), body.challengeBId.trim());
    return jsonOk(diff);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
