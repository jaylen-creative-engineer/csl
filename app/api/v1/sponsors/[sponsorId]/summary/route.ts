import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { sponsorId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { sponsorId } = await context.params;
  try {
    const { sponsor } = getRouteServices();
    const summary = await sponsor.getSponsorSummary(sponsorId);
    return jsonOk(summary);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
