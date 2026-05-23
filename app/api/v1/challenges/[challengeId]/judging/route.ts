import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";
import { requireAuth } from "@/lib/api/require-auth.js";

type Params = { challengeId: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { challengeId } = await context.params;
  try {
    const { challenge } = getRouteServices();
    const row = await challenge.closeForJudging(challengeId);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
