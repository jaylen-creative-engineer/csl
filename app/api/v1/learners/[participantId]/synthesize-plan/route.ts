import { z } from "zod";
import { getRouteServices } from "@/lib/api/route-services.js";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api/http.js";
import { createAnthropicClient, MODEL_OPUS } from "@/skill-journey/ai-client.js";

type Params = { participantId: string };

const Body = z.object({
  frameworkId: z.string().min(1),
  constraints: z
    .object({
      weeklyHours: z.number().int().nonnegative().optional(),
      deadlines: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

const SYSTEM_PROMPT = `You are the CSL learner planning agent. Given a framework (skill,
steps) and a participant's skill intent, synthesize a structured learning plan honoring
the caller's constraints.

Return a JSON object with the shape:
{
  "plan": {
    "summary": string,
    "milestones": [
      { "description": string, "dueOffsetDays": number }
    ],
    "paths": [
      { "variant": "depth" | "breadth", "steps": [ { "title": string, "description": string } ] }
    ]
  }
}

Reply with JSON only.`;

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { participantId } = await context.params;
  const raw = await readJsonBody(request);
  const result = Body.safeParse(raw);
  if (!result.success) return jsonError(result.error.issues[0].message, 422);
  const body = result.data;

  try {
    const { skillIntentService, learningService, league } = getRouteServices();

    const participant = await league.getParticipant(participantId);
    if (!participant) return jsonError("Participant not found", 404);

    const framework = await learningService.getFramework(body.frameworkId);
    if (!framework) return jsonError("Framework not found", 404);

    const intent = await skillIntentService.getSkillIntent(participantId);

    const planContext = {
      participant: {
        id: participant.id,
        handle: participant.handle,
        discipline: participant.discipline,
      },
      framework: {
        id: framework.id,
        name: framework.name,
        skillLabel: framework.skillLabel,
        description: framework.description,
        steps: framework.steps,
      },
      intent: intent
        ? {
            skillLabel: intent.skillLabel,
            targetDisciplines: intent.targetDisciplines,
          }
        : null,
      constraints: body.constraints ?? {},
    };

    const client = createAnthropicClient();
    const response = await client.messages.create({
      model: MODEL_OPUS,
      max_tokens: 1024,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        {
          type: "text",
          text: JSON.stringify(planContext),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: "Synthesize a structured learning plan for this participant.",
        },
      ],
    });

    const text = extractTextContent(response);
    const parsed = safeJsonParse(text);

    return jsonOk({
      model: MODEL_OPUS,
      planContext,
      raw: text,
      plan: parsed?.plan ?? null,
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

function safeJsonParse(text: string): { plan?: unknown } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
