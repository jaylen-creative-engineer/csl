import { z } from "zod";
import { NextResponse } from "next/server.js";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import { checkIdempotency, storeIdempotency } from "@/lib/api/idempotency.js";
import { requireAuth } from "@/lib/api/require-auth.js";

const Body = z.object({
  judgeId: z.string().min(1),
  criteriaScores: z.array(
    z.object({
      criteriaName: z.string().min(1),
      score: z.number().min(0).max(100),
    })
  ),
  rationale: z.string().min(1),
});

type Params = { submissionId: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const idempKey = request.headers.get("Idempotency-Key");
  const cached = checkIdempotency(idempKey);
  if (cached) return NextResponse.json(cached.body, { status: cached.status });

  const { submissionId } = await context.params;
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { challenge } = getRouteServices();
    const submission = await challenge.scoreSubmission(submissionId, {
      judgeId: body.judgeId.trim(),
      criteriaScores: body.criteriaScores,
      rationale: body.rationale.trim(),
    });
    const responseBody = { ok: true as const, data: submission };
    if (idempKey) storeIdempotency(idempKey, responseBody, 200);
    return jsonOk(submission);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
