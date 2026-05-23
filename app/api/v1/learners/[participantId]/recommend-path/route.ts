import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";
import { createAnthropicClient, MODEL_OPUS } from "@/skill-journey/ai-client.js";

type Params = { participantId: string };

const SYSTEM_PROMPT = `You are the CSL learner journey coach. You receive a skill profile
describing a participant's declared skill intent and their evidence timeline (scored
submissions, per-criterion breakdown, sprint dates).

Return a JSON object with the shape:
{
  "suggestions": [
    { "title": string, "rationale": string, "focusCriteria": string[], "variant": "depth" | "breadth" }
  ]
}

Order suggestions from highest-priority to lowest. Ground every rationale in the supplied
evidence. Prefer concrete next paths over vague advice. Reply with JSON only.`;

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { participantId } = await context.params;
  try {
    const { skillIntentService, league } = getRouteServices();

    const participant = await league.getParticipant(participantId);
    if (!participant) return jsonError("Participant not found", 404);

    const intent = await skillIntentService.getSkillIntent(participantId);
    const evidence = await skillIntentService.getEvidenceTimeline(participantId);
    const mastery = await skillIntentService.getMasteryMap(participantId);

    const skillProfile = {
      participant: {
        id: participant.id,
        handle: participant.handle,
        discipline: participant.discipline,
      },
      intent: intent
        ? {
            skillLabel: intent.skillLabel,
            targetDisciplines: intent.targetDisciplines,
          }
        : null,
      mastery,
      evidence: evidence.slice(0, 20),
    };

    const client = createAnthropicClient();
    const response = await client.messages.create({
      model: MODEL_OPUS,
      max_tokens: 1024,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        {
          type: "text",
          text: JSON.stringify(skillProfile),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content:
            "Recommend ranked learning paths the participant should pursue next, grounded in the supplied evidence.",
        },
      ],
    });

    const text = extractTextContent(response);
    const parsed = safeJsonParse(text);

    return jsonOk({
      model: MODEL_OPUS,
      skillProfile,
      raw: text,
      suggestions: parsed?.suggestions ?? null,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
}

function extractTextContent(response: { content: Array<{ type: string; text?: string }> }): string {
  return response.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");
}

function safeJsonParse(text: string): { suggestions?: unknown } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
