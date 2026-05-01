import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";

type Params = { leagueId: string };
type Body = { participantId: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { leagueId } = await context.params;
  const body = await readJsonBody<Body>(request);
  if (!body?.participantId?.trim()) {
    return jsonError("participantId is required");
  }
  try {
    const { league } = getRouteServices();
    const result = await league.enrollParticipant(leagueId, body.participantId.trim());
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
