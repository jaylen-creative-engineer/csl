import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import type { SponsorOutcome } from "@/sponsor-intelligence/types.js";

type Params = { attachmentId: string };

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const { attachmentId } = await context.params;
  const body = await readJsonBody<SponsorOutcome>(request);
  if (!body?.status) {
    return jsonError("status is required");
  }
  try {
    const { sponsor } = getRouteServices();
    const updated = await sponsor.recordOutcome(attachmentId, body);
    return jsonOk(updated);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
