import { z } from "zod";
import { NextResponse } from "next/server.js";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import { checkIdempotency, storeIdempotency } from "@/lib/api/idempotency.js";

const Body = z.object({
  participantId: z.string().min(1),
  artifact: z.object({
    url: z.string().min(1),
    mimeType: z.string().optional(),
    description: z.string().optional(),
  }),
  isPublic: z.boolean().optional(),
});

type Params = { challengeId: string };

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { challengeId } = await context.params;
  const url = new URL(request.url);
  const pageRaw = Number(url.searchParams.get("page") ?? 1);
  const limitRaw = Number(url.searchParams.get("limit") ?? 20);
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
  try {
    const { challenge } = getRouteServices();
    const rows = await challenge.getSubmissionsForChallenge(challengeId);
    const total = rows.length;
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit);
    return NextResponse.json({ ok: true as const, data, meta: { total, page, limit } });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const idempKey = request.headers.get("Idempotency-Key");
  const cached = checkIdempotency(idempKey);
  if (cached) return NextResponse.json(cached.body, { status: cached.status });

  const { challengeId } = await context.params;
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { challenge } = getRouteServices();
    const submission = await challenge.submitEntry(challengeId, body.participantId.trim(), {
      artifact: body.artifact,
      isPublic: body.isPublic,
    });
    const responseBody = { ok: true as const, data: submission };
    if (idempKey) storeIdempotency(idempKey, responseBody, 201);
    return jsonCreated(submission);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
