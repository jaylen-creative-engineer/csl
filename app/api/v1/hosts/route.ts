import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";

type Body = { name: string; organization: string };

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.name?.trim() || !body.organization?.trim()) {
    return jsonError("name and organization are required");
  }
  try {
    const { league } = getRouteServices();
    const host = await league.createLeagueHost({
      name: body.name.trim(),
      organization: body.organization.trim(),
    });
    return jsonCreated(host);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
