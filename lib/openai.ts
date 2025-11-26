import OpenAI from "openai";
import { ResonanceResearchResult } from "@/types/resonance";

/**
 * Lazy-loaded OpenAI client.
 * Only created when actually needed (at runtime), not during build.
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing from environment variables.");
    }
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

export function getClarifyModel(): string {
  return process.env.RESEARCH_CLARIFY_MODEL || "gpt-4o-mini";
}

export async function callChatModel(options: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  responseFormatType?: "json_object" | "text";
}): Promise<string> {
  const model = options.model || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.7;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: options.messages,
      ...(options.responseFormatType === "json_object" && {
        response_format: { type: "json_object" },
      }),
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI API returned empty response.");
    }

    return content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

export async function callPersonaBuilderModel(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> {
  return callChatModel({
    messages,
    model: process.env.OPENAI_MODEL_PERSONA || "gpt-4o-mini",
    temperature: 0.7,
    responseFormatType: "json_object",
  });
}

const RESONANCE_SYSTEM_PROMPT = `You are a "Resonance Research Analyst" for social media and content strategy.
The user will describe their business, goals, initiatives, industry/niche, and target audience.
Your job is to infer:
- which personas/archetypes work best,
- which platforms and content types are most effective,
- what themes, hooks, and voice patterns resonate,
- what to avoid.

You must output a single JSON object matching the following structure:
{
  "summary": "string",
  "audience_profile": {
    "description": "string",
    "key_segments": ["string"],
    "pains": ["string"],
    "desires": ["string"]
  },
  "winning_persona_archetypes": [
    {
      "name": "string",
      "description": "string",
      "tone": "string",
      "strengths": ["string"],
      "pitfalls": ["string"]
    }
  ],
  "platforms": [
    {
      "name": "string",
      "role": "string",
      "content_formats": ["string"],
      "posting_cadence": "string"
    }
  ],
  "content_themes": [
    {
      "theme": "string",
      "why_it_resonates": "string",
      "example_hooks": ["string"]
    }
  ],
  "style_guide": {
    "voice": "string",
    "do": ["string"],
    "dont": ["string"],
    "taboo_topics": ["string"]
  },
  "persona_blueprint": {
    "working_name": "string",
    "tagline": "string",
    "core_traits": ["string"],
    "default_tone": "string",
    "signature_content_types": ["string"]
  }
}

Fill every field with specific, concise answers.
Use 3–5 items in arrays where it makes sense.
No extra keys.
Respond with JSON ONLY (no markdown or commentary).`;

export async function runResonanceResearch(
  userPrompt: string,
  businessContext?: Record<string, unknown>
): Promise<ResonanceResearchResult> {
  const userMessage = `User description:\n${userPrompt}\n\nStructured context (may be empty):\n${JSON.stringify(
    businessContext ?? {}
  )}`;

  const messages = [
    { role: "system" as const, content: RESONANCE_SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  const response = await callChatModel({
    messages,
    responseFormatType: "json_object",
  });

  try {
    const result = JSON.parse(response) as ResonanceResearchResult;

    // Basic sanity checks
    const requiredKeys: (keyof ResonanceResearchResult)[] = [
      "summary",
      "audience_profile",
      "winning_persona_archetypes",
      "platforms",
      "content_themes",
      "style_guide",
      "persona_blueprint",
    ];

    for (const key of requiredKeys) {
      if (!(key in result)) {
        throw new Error(`Missing required top-level key: ${key}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to parse Resonance Research result:", {
      error,
      responsePreview: response.substring(0, 400),
    });
    throw new Error("Failed to parse Resonance Research result from OpenAI.");
  }
}
