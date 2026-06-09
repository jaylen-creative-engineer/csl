import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { leagueId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { leagueId } = await context.params;

  try {
    const { challenge } = getRouteServices();
    const challenges = await challenge.getChallengesForLeague(leagueId);
    return jsonOk(challenges);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
