import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import { SponsorOutcomeStatus } from "@/sponsor-intelligence/types.js";

const Body = z.object({
  status: z.nativeEnum(SponsorOutcomeStatus),
  prizeDeliveredAt: z.string().optional(),
  opportunityExtendedTo: z.string().optional(),
  notes: z.string().optional(),
});

type Params = { attachmentId: string };

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const { attachmentId } = await context.params;
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
  try {
    const { sponsor } = getRouteServices();
    const updated = await sponsor.recordOutcome(attachmentId, body);
    return jsonOk(updated);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
