import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonCreated, jsonError, readJsonBody } from "@/lib/api/http.js";

const Body = z.object({
  name: z.string().min(1),
  organization: z.string().min(1),
  contactEmail: z.string().email(),
});

export async function POST(request: Request) {
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;
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
