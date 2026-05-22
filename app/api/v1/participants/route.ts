import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import { Discipline } from "@/league-model/types.js";

const Body = z.object({
  handle: z.string().min(1),
  discipline: z.nativeEnum(Discipline),
  userId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { league } = getRouteServices();
    const participant = await league.createParticipant({
      handle: body.handle.trim(),
      discipline: body.discipline,
      userId: body.userId,
    });
    return jsonCreated(participant);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
