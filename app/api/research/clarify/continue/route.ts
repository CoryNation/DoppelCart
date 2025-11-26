import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel, getClarifyModel } from "@/lib/openai";

const CONTINUE_SYSTEM_PROMPT = `You are **Resonance Clarifier**, an AI assistant for the DoppelCart "Resonance Research" feature.  

You have access to:
- The original **title** and **description**.  
- A **chat transcript** between user and assistant where you previously asked clarifying questions and the user replied.

Your job now is to:
1. Produce a **single, clear research scope** statement in natural language.  
2. Extract **structured parameters** from the conversation.  
3. Generate a short, friendly **assistant message** confirming what will be researched and setting expectations.

You are NOT running the research. You are finalizing the spec to hand to a more expensive "Researcher" model.

### Output format
Respond in strict JSON:

\`\`\`json
{
  "clarifiedScope": "One concise paragraph describing exactly what will be researched.",
  "parameters": {
    "targetAudience": "Who the research focuses on.",
    "useCase": "What the user is trying to accomplish with this research.",
    "platforms": ["List", "of", "platforms"],
    "geography": "Regions / markets of interest, or 'global' if not constrained.",
    "language": "Language(s) to assume.",
    "timeframe": "Any time scope if specified (e.g., last 12 months).",
    "primaryGoal": "Core outcome: e.g., better messaging, higher click-through, more sign-ups.",
    "secondaryGoals": ["Other useful outcomes if specified."],
    "contentTypes": ["Reels", "short-form video", "memes", "threads", "ads", etc. if mentioned."],
    "competitorsOrComparables": ["Names of brands, creators, products to use as reference if mentioned."],
    "constraints": "Any constraints or exclusions (no paid ads, no X platform, etc.).",
    "otherNotes": "Any extra nuance that will help the researcher make smart decisions."
  },
  "assistantMessage": "Short user-facing message summarizing what you will research and what they can expect."
}
\`\`\`

**clarifiedScope guidelines**
- 3–6 sentences.
- Make it specific enough that another person could run the research without guessing.
- Clearly state:
  - Audience
  - Topic / product / problem
  - Platforms / channels
  - Main lens: resonance, messaging, funnels, objections, etc.
  - Primary goal of insights.

**parameters guidelines**
- Use the keys above.
- If something is not specified, set it to null or a reasonable generic value (e.g., "global", "English") and state that assumption in otherNotes.
- Keep strings concise but informative; this will be used programmatically.

**assistantMessage guidelines**
- 2–4 sentences.
- Confirm what you'll focus on and how that will help them.
- Avoid technical jargon. Talk like a pragmatic strategist:
  - "I'll focus on… so we can figure out…"
- Do not output anything except the JSON object.`;

interface ChatMessage {
  role: "system" | "assistant" | "user";
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

    // Input validation with length limits
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: "Description must be 5000 characters or less" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: "Messages array must contain 50 items or fewer" },
        { status: 400 }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return NextResponse.json(
          { error: "Each message must be an object" },
          { status: 400 }
        );
      }
      if (typeof msg.role !== "string" || !["system", "assistant", "user"].includes(msg.role)) {
        return NextResponse.json(
          { error: "Each message must have a valid role (system, assistant, or user)" },
          { status: 400 }
        );
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json(
          { error: "Each message must have a string content field" },
          { status: 400 }
        );
      }
      if (msg.content.length > 10000) {
        return NextResponse.json(
          { error: "Each message content must be 10000 characters or less" },
          { status: 400 }
        );
      }
    }

    const userMessage = JSON.stringify({
      title,
      description,
      messages,
    });

    const response = await callChatModel({
      messages: [
        { role: "system", content: CONTINUE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      model: getClarifyModel(),
      responseFormatType: "json_object",
    });

    try {
      const parsed = JSON.parse(response);
      if (
        typeof parsed.clarifiedScope !== "string" ||
        typeof parsed.parameters !== "object" ||
        parsed.parameters === null ||
        typeof parsed.assistantMessage !== "string"
      ) {
        throw new Error("Invalid response shape");
      }

      return NextResponse.json({
        clarifiedScope: parsed.clarifiedScope,
        parameters: parsed.parameters,
        assistantMessage: parsed.assistantMessage,
      });
    } catch {
      console.error("Failed to parse clarify/continue response");
      return NextResponse.json(
        { error: "Failed to finalize research scope. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/research/clarify/continue:", errorMessage);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
