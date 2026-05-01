import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import { Discipline } from "@/league-model/types.js";

type Body = { handle: string; discipline: string; userId?: string | null };

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.handle?.trim() || !body.discipline) {
    return jsonError("handle and discipline are required");
  }
  const allowed = new Set<string>(Object.values(Discipline));
  if (!allowed.has(body.discipline)) {
    return jsonError(`discipline must be one of: ${[...allowed].join(", ")}`);
  }
  try {
    const { league } = getRouteServices();
    const participant = await league.createParticipant({
      handle: body.handle.trim(),
      discipline: body.discipline as Discipline,
      userId: body.userId,
    });
    return jsonCreated(participant);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
