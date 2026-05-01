import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { leagueId: string };

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { leagueId } = await context.params;
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  try {
    const { showcase } = getRouteServices();
    const rows = await showcase.getTopPerformers(leagueId, limit);
    return jsonOk(rows);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
