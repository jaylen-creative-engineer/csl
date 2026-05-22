import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";

const Body = z.object({
  challengeAId: z.string().min(1),
  challengeBId: z.string().min(1),
});

export async function POST(request: Request) {
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { challenge } = getRouteServices();
    const diff = await challenge.diffChallenges(body.challengeAId.trim(), body.challengeBId.trim());
    return jsonOk(diff);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
