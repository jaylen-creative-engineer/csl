import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { leagueId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { leagueId } = await context.params;
  try {
    const { league } = getRouteServices();
    const row = await league.getLeague(leagueId);
    if (!row) return jsonError("League not found", 404);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
