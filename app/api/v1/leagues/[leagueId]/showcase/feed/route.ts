import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { leagueId: string };

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { leagueId } = await context.params;
  try {
    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") ?? 20);
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
    const cursor = url.searchParams.get("after") ?? url.searchParams.get("cursor") ?? undefined;
    const { showcase } = getRouteServices();
    const result = await showcase.getShowcaseFeed(leagueId, { limit, cursor });
    return jsonOk(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
