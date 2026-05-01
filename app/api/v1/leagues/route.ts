import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";

type Body = { name: string; hostId: string; seasonId?: string | null };

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.name?.trim() || !body.hostId?.trim()) {
    return jsonError("name and hostId are required");
  }
  try {
    const { league } = getRouteServices();
    const row = await league.createLeague({
      name: body.name.trim(),
      hostId: body.hostId.trim(),
      seasonId: body.seasonId ?? undefined,
    });
    return jsonCreated(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
