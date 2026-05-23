import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";
import { requireAuth } from "@/lib/api/require-auth.js";

const Body = z.object({
  challengeId: z.string().min(1),
  brief: z.object({
    headline: z.string().min(1),
    description: z.string().min(1),
    deliverables: z.array(z.string()),
    prize: z.string().optional(),
  }),
});

type Params = { sponsorId: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { sponsorId } = await context.params;
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { sponsor } = getRouteServices();
    const attachment = await sponsor.attachToChallenge(
      sponsorId,
      body.challengeId.trim(),
      body.brief
    );
    return jsonCreated(attachment);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
