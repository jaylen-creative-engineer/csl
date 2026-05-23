import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk } from "@/lib/api/http.js";
import { createAnthropicClient, MODEL_HAIKU } from "@/skill-journey/ai-client.js";

type Params = { participantId: string };

const SYSTEM_PROMPT = `You are the CSL learner nudge coach. You receive recent scored
submissions plus the participant's current plan milestones. Return short, concrete next
actions the participant can take in the next 48 hours.

Return a JSON object with the shape:
{
  "actions": [
    { "title": string, "why": string, "estMinutes": number }
  ]
}

Keep the list to at most 3 entries, ordered by impact. Reply with JSON only.`;

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { participantId } = await context.params;
  try {
    const { skillIntentService, learningService, league } = getRouteServices();

    const participant = await league.getParticipant(participantId);
    if (!participant) return jsonError("Participant not found", 404);

    const evidence = await skillIntentService.getEvidenceTimeline(participantId);
    const recentScores = evidence.slice(0, 5);

    const plans = await learningService.listPlansForParticipant(participantId);
    const planMilestones = plans.flatMap((p) =>
      p.milestones.map((m) => ({ planId: p.id, ...m }))
    );
    const dueBuckets = await learningService.checkMilestonesDue(participantId);

    const context = {
      participant: {
        id: participant.id,
        handle: participant.handle,
        discipline: participant.discipline,
      },
      recentScores,
      planMilestones,
      overdueMilestones: dueBuckets.overdue,
      upcomingMilestones: dueBuckets.upcoming,
    };

    const client = createAnthropicClient();
    const response = await client.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 512,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        {
          type: "text",
          text: JSON.stringify(context),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: "What are the next actions this participant should take in the next 48 hours?",
        },
      ],
    });

    const text = extractTextContent(response);
    const parsed = safeJsonParse(text);

    return jsonOk({
      model: MODEL_HAIKU,
      context,
      raw: text,
      actions: parsed?.actions ?? null,
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

function safeJsonParse(text: string): { actions?: unknown } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
