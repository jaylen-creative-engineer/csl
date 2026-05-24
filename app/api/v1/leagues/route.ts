import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import { requireAuth } from "@/lib/api/require-auth.js";

export async function GET() {
  try {
    const { league } = getRouteServices();
    const rows = await league.listLeagues();
    return jsonOk(rows);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}

const Body = z.object({
  name: z.string().min(1),
  hostId: z.string().min(1),
  seasonId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
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
