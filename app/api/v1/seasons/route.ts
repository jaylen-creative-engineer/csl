import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";

type Body = { name: string; startDate: string; endDate: string };

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.name?.trim() || !body.startDate || !body.endDate) {
    return jsonError("name, startDate, and endDate are required");
  }
  try {
    const { league } = getRouteServices();
    const season = await league.createSeason({
      name: body.name.trim(),
      startDate: body.startDate,
      endDate: body.endDate,
    });
    return jsonCreated(season);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
