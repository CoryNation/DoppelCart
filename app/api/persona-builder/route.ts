import { NextRequest, NextResponse } from 'next/server';
import { callPersonaBuilderModel } from '@/lib/openai';
import { PersonaState, PersonaStage, ChatMessage } from '@/types/persona';

interface RequestBody {
  messages: ChatMessage[];
  currentPersona?: PersonaState | null;
  assistantTurns: number;
  maxAssistantTurns?: number;
}

interface BuilderResponse {
  updatedPersona: PersonaState;
  assistantReply: string;
  stage: PersonaStage;
}

const SYSTEM_PROMPT = `You are a Persona Architect helping a user build a deeply human-feeling social media persona for an AI agent.

Always maintain and refine a single persona JSON object.

Schema for updatedPersona:
- display_name (string)
- avatar_prompt (string, description for a cartoon avatar)
- stats (object with numeric attributes 0–100: charisma, logic, humor, warmth, edge, creativity)
- goals (array of short clear goals)
- demographics (age, location, occupation, industry, income_level, language, time_zone)
- personality (tone, and bigFive: openness, conscientiousness, extraversion, agreeableness, neuroticism)
- biography (1–3 paragraph plausible bio)

Preserve existing fields unless the user explicitly changes them.

Return JSON:
{
  "updatedPersona": { ... },
  "assistantReply": "string",
  "stage": "initial" | "goals" | "demographics" | "personality" | "biography" | "final_review"
}

Ask at most 1–2 concise follow-up questions at a time.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { messages, currentPersona, assistantTurns, maxAssistantTurns = 20 } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check refinement limit
    if (assistantTurns >= maxAssistantTurns) {
      return NextResponse.json({
        updatedPersona: currentPersona ?? {},
        assistantReply: "You've reached the refinement limit for this persona. Save your agent or upgrade to continue refining.",
        stage: 'final_review'
      });
    }

    const systemMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Current persona JSON (may be partial): ${JSON.stringify(
          currentPersona || {}
        )}`,
      },
    ];

    const apiMessages = [
      ...systemMessages,
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const responseContent = await callPersonaBuilderModel(apiMessages);

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(responseContent);
    } catch (parseError) {
      console.error(
        "JSON parse error from persona builder:",
        parseError,
        "Content preview:",
        responseContent.substring(0, 500)
      );
      return NextResponse.json(
        { error: "Received invalid response format from AI. Please try again." },
        { status: 500 }
      );
    }

    if (!parsedContent || typeof parsedContent !== "object") {
      console.error(
        "AI response is not an object:",
        typeof parsedContent
      );
      return NextResponse.json(
        { error: "Received invalid response format from AI. Please try again." },
        { status: 500 }
      );
    }

    // Type guard: at this point we know it's an object
    const contentRecord = parsedContent as Record<string, unknown>;

    if (!contentRecord.updatedPersona || !contentRecord.assistantReply || !contentRecord.stage) {
      console.error(
        "AI response missing required fields:",
        Object.keys(contentRecord)
      );
      return NextResponse.json(
        { error: "Received incomplete response from AI. Please try again." },
        { status: 500 }
      );
    }

    const typedContent = contentRecord as BuilderResponse;
    return NextResponse.json(typedContent);

  } catch (error: unknown) {
    console.error('Error in persona builder API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
