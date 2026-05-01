import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { leagueId: string };

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { leagueId } = await context.params;
  try {
    const { league } = getRouteServices();
    const row = await league.closeLeague(leagueId);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
