import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { sponsorId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { sponsorId } = await context.params;
  try {
    const { sponsor } = getRouteServices();
    const row = await sponsor.getSponsor(sponsorId);
    if (!row) return jsonError("Sponsor not found", 404);
    return jsonOk(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}
