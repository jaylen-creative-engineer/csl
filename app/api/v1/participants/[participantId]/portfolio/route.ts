import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";

type Params = { participantId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { participantId } = await context.params;
  try {
    const { showcase } = getRouteServices();
    const portfolio = await showcase.buildPortfolio(participantId);
    return jsonOk(portfolio);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Participant not found")) return jsonError(msg, 404);
    return jsonError(msg, 500);
  }
}
