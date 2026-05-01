import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { challengeId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { challengeId } = await context.params;
  try {
    const { challenge } = getRouteServices();
    const row = await challenge.getChallenge(challengeId);
    if (!row) return jsonError("Challenge not found", 404);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
