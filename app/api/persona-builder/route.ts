import { NextRequest, NextResponse } from 'next/server';
import { PersonaState, PersonaStage, ChatMessage } from '@/types/persona';

interface RequestBody {
  messages: ChatMessage[];
  currentPersona?: PersonaState | null;
  turnLimit?: number;
  currentTurn?: number;
}

interface OpenAIResponse {
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
- biography (1–3 paragraph fictitious but plausible bio)

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
    const { messages, currentPersona, turnLimit, currentTurn } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check turn limit
    if (turnLimit !== undefined && currentTurn !== undefined && currentTurn >= turnLimit) {
      return NextResponse.json({
        updatedPersona: currentPersona || {},
        assistantReply: "You’ve reached the free refinement limit for this persona. Save your agent or upgrade to continue refining.",
        stage: 'final_review' // Or keep existing stage, but final_review seems appropriate if stopping
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not defined');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini as a cost-effective option, similar to 4.1-mini request
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API returned ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty response content from OpenAI');
      throw new Error('No content received from AI provider');
    }

    try {
      const parsedContent = JSON.parse(content) as OpenAIResponse;
      
      // Basic validation of the response structure
      if (!parsedContent.updatedPersona || !parsedContent.assistantReply || !parsedContent.stage) {
        console.error('Invalid JSON structure from AI:', parsedContent);
        throw new Error('AI response missing required fields');
      }

      return NextResponse.json(parsedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response');
    }

  } catch (error: any) {
    console.error('Error in persona builder API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
