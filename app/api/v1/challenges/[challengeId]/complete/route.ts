import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { challengeId: string };

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { challengeId } = await context.params;
  try {
    const { challenge } = getRouteServices();
    const row = await challenge.completeChallenge(challengeId);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
