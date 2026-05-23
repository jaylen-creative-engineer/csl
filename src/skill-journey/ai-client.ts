import Anthropic from "@anthropic-ai/sdk";

/**
 * Factory for the shared Anthropic client used by learner journey AI routes.
 * Extracted so tests can `vi.mock('@anthropic-ai/sdk')` and so all routes pick up
 * the same `ANTHROPIC_API_KEY` env wiring.
 */
export function createAnthropicClient(): Anthropic {
  return new Anthropic();
}

export const MODEL_OPUS = "claude-opus-4-7";
export const MODEL_HAIKU = "claude-haiku-4-5-20251001";
