import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";

type Body = { name: string; organization: string; contactEmail: string };

export async function POST(request: Request) {
  const body = await readJsonBody<Body>(request);
  if (!body?.name?.trim() || !body.organization?.trim() || !body.contactEmail?.trim()) {
    return jsonError("name, organization, and contactEmail are required");
  }
  try {
    const { sponsor } = getRouteServices();
    const row = await sponsor.createSponsor({
      name: body.name.trim(),
      organization: body.organization.trim(),
      contactEmail: body.contactEmail.trim(),
    });
    return jsonCreated(row);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 400);
  }
}
