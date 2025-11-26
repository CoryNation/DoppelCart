import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel } from "@/lib/openai";

const CONTINUE_SYSTEM_PROMPT = `You are Resonance Clarifier, an AI assistant for the DoppelCart "Resonance Research" feature.

You receive:
- The original title and description.
- A chat transcript between user and assistant where clarifying questions were asked and answered.

Your job now is to:
- Produce a single, clear research scope statement in natural language.
- Extract structured parameters from the conversation.
- Generate a short, friendly assistant message confirming what will be researched and setting expectations.

You are NOT running the research. You are finalizing the spec to hand to a different model.

Respond with strict JSON:
{
  "clarifiedScope": "One concise paragraph describing exactly what will be researched.",
  "parameters": {
    "targetAudience": "...",
    "useCase": "...",
    "platforms": ["..."],
    "geography": "...",
    "language": "...",
    "timeframe": "...",
    "primaryGoal": "...",
    "secondaryGoals": ["..."],
    "contentTypes": ["..."],
    "competitorsOrComparables": ["..."],
    "constraints": "...",
    "otherNotes": "..."
  },
  "assistantMessage": "Short user-facing message summarizing what will be researched."
}

Guidelines:
- If a field is not specified, set it to null or a reasonable assumption (e.g., "global", "English") and note assumptions in otherNotes.
- Keep the assistantMessage 2-4 sentences, friendly, and focused on outcomes.
- Output only the JSON object.`;

interface ChatMessage {
  role: "assistant" | "user" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, messages } = body as {
      title?: string;
      description?: string;
      messages?: ChatMessage[];
    };

    if (!title || !description || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and conversation messages are required" },
        { status: 400 }
      );
    }

    const transcript = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const userMessage = `Title: ${title}\nDescription: ${description}\n\nConversation:\n${transcript}`;

    const response = await callChatModel({
      messages: [
        { role: "system", content: CONTINUE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      responseFormatType: "json_object",
    });

    try {
      const parsed = JSON.parse(response);
      if (
        typeof parsed.clarifiedScope !== "string" ||
        typeof parsed.parameters !== "object" ||
        typeof parsed.assistantMessage !== "string"
      ) {
        throw new Error("Invalid response shape");
      }

      return NextResponse.json(parsed);
    } catch (err) {
      console.error("Failed to parse clarify/continue response:", response);
      return NextResponse.json(
        { error: "Failed to finalize research scope" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/research/clarify/continue:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


