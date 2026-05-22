import { z } from "zod";
import { NextResponse } from "next/server.js";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import { checkIdempotency, storeIdempotency } from "@/lib/api/idempotency.js";

const Body = z.object({
  participantId: z.string().min(1),
});

type Params = { leagueId: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const idempKey = request.headers.get("Idempotency-Key");
  const cached = checkIdempotency(idempKey);
  if (cached) return NextResponse.json(cached.body, { status: cached.status });

  const { leagueId } = await context.params;
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { league } = getRouteServices();
    const enrollment = await league.enrollParticipant(leagueId, body.participantId.trim());
    const responseBody = { ok: true as const, data: enrollment };
    if (idempKey) storeIdempotency(idempKey, responseBody, 200);
    return jsonOk(enrollment);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
