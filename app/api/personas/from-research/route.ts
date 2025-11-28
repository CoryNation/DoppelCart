import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { ApiErrors } from "@/lib/utils/api-errors";
import {
  attachPersonaToResearchTask,
  getResearchTaskById,
} from "@/lib/research";
import { callChatModel } from "@/lib/openai";
import type { ResearchPersona } from "@/types/persona";

const PERSONA_SYSTEM_PROMPT = `You are **Persona Architect**, an AI that turns Resonance Research into an actionable audience persona for social and content strategy.

You receive:
- A **clarified research scope** and **parameters** describing the audience and research intent.
- A **Resonance Research final report** that includes:
  - Executive summary
  - Audience snapshot
  - Resonance findings and themes
  - Channel and format insights
  - Messaging recommendations
  - Objections and responses
  - Next steps

Your job:
- Synthesize this into a single, actionable persona that someone can use to brief marketing, copy, and content creation.

### Output

Respond with strict JSON:

{
  "name": "A short, memorable persona name (e.g., 'Gen Z Clinic Creator').",
  "label": "A 2–6 word label summarizing the persona.",
  "summary": "2–4 sentence overview of who this persona is and what they care about.",
  "demographics": {
    "roleOrProfession": "Their typical role or situation.",
    "experienceLevel": "Beginner / intermediate / advanced / etc.",
    "organizationContext": "Solo / small team / enterprise / clinic / etc, as relevant.",
    "geography": "Typical region(s) if implied.",
    "other": "Any other important demographic notes."
  },
  "goals": [
    "Key goal 1",
    "Key goal 2",
    "Key goal 3"
  ],
  "painPoints": [
    "Key frustration or pain point 1",
    "Key pain point 2"
  ],
  "motivators": [
    "What pulls them toward action (e.g., saving time, feeling competent, looking professional)."
  ],
  "objections": [
    "Common objection or hesitation this persona might have."
  ],
  "preferredChannels": [
    "List of platforms or channels where they naturally spend attention (based on the research)."
  ],
  "contentPreferences": {
    "formats": [
      "Short-form video, carousels, memes, testimonials, etc. based on research."
    ],
    "tones": [
      "Trusted expert, casual friend, relatable peer, etc."
    ],
    "anglesThatResonate": [
      "Angle/theme 1",
      "Angle/theme 2"
    ],
    "anglesToAvoid": [
      "Angle/theme that underperforms or backfires."
    ]
  },
  "languageAndVoice": {
    "samplePhrases": [
      "Example phrases or wording patterns that match this persona."
    ],
    "doSay": [
      "Guidelines for how to talk to them."
    ],
    "dontSay": [
      "Guidelines for what to avoid in wording or framing."
    ]
  },
  "exampleHooks": [
    "3–7 example content hooks tailored to this persona (short lines that could start a post or video)."
  ],
  "callToActionStyles": [
    "How to structure CTAs so they feel natural and compelling for this persona."
  ]
}

Guidelines

The persona MUST be consistent with the research report: don’t invent a completely new audience.

Be concrete and practical. The persona should be directly usable by a content strategist or copywriter.

Use the existing research findings to inform goals, pains, preferred channels, and language – don’t ignore them.

Respond only with the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await req.json();
    const { researchId, additionalClarifications } = body as { 
      researchId?: string;
      additionalClarifications?: string;
    };

    if (!researchId) {
      return ApiErrors.badRequest("researchId is required");
    }

    const research = await getResearchTaskById(researchId, user.id);
    if (!research) {
      return ApiErrors.notFound("Research task");
    }

    if (research.status !== "completed") {
      return ApiErrors.badRequest("Research is still running. Please wait for completion.");
    }

    const finalReport = research.resultDetails?.finalReport;
    if (!finalReport) {
      return ApiErrors.badRequest("Final report is not available for this research yet.");
    }

    const persona = await generatePersona({
      clarifiedScope: research.clarifiedScope,
      parameters: research.parameters,
      finalReport,
      additionalClarifications: additionalClarifications?.trim() || undefined,
    });

    await attachPersonaToResearchTask(research.id, persona, { userId: user.id });

    return NextResponse.json({ persona });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/personas/from-research:", errorMessage);
    return ApiErrors.internalServerError("Failed to generate persona");
  }
}

async function generatePersona(payload: {
  clarifiedScope: string | null;
  parameters: Record<string, unknown> | null;
  finalReport: unknown;
  additionalClarifications?: string;
}): Promise<ResearchPersona> {
  const personaModel =
    process.env.OPENAI_MODEL_PERSONA ||
    process.env.PERSONA_MODEL ||
    process.env.RESEARCH_REASONING_MODEL ||
    "gpt-4o-mini";

  const userContent: Record<string, unknown> = {
    clarifiedScope: payload.clarifiedScope,
    parameters: payload.parameters,
    finalReport: payload.finalReport,
  };

  if (payload.additionalClarifications) {
    userContent.additionalClarifications = payload.additionalClarifications;
  }

  const response = await callChatModel({
    messages: [
      { role: "system", content: PERSONA_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify(userContent),
      },
    ],
    model: personaModel,
    responseFormatType: "json_object",
    temperature: 0.3,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to parse persona JSON:", errorMessage);
    throw new Error("Persona generation returned invalid JSON");
  }

  if (!isResearchPersona(parsed)) {
    console.error("Persona payload failed validation");
    throw new Error("Persona generation returned unexpected shape");
  }

  return parsed;
}

function isResearchPersona(payload: unknown): payload is ResearchPersona {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as ResearchPersona;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.summary === "string" &&
    candidate.demographics !== undefined &&
    typeof candidate.demographics?.roleOrProfession === "string" &&
    Array.isArray(candidate.goals) &&
    Array.isArray(candidate.painPoints) &&
    Array.isArray(candidate.motivators) &&
    Array.isArray(candidate.objections) &&
    Array.isArray(candidate.preferredChannels) &&
    Array.isArray(candidate.contentPreferences?.formats) &&
    Array.isArray(candidate.languageAndVoice?.samplePhrases) &&
    Array.isArray(candidate.exampleHooks) &&
    Array.isArray(candidate.callToActionStyles)
  );
}


