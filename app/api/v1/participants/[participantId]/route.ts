import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { participantId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { participantId } = await context.params;
  try {
    const { league } = getRouteServices();
    const row = await league.getParticipant(participantId);
    if (!row) return jsonError("Participant not found", 404);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
