import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel } from "@/lib/openai";

const CLARIFY_SYSTEM_PROMPT = `You are Resonance Clarifier, an AI assistant for the DoppelCart "Resonance Research" feature.

Your ONLY job is to:
- Interpret the user's research idea (title + description).
- Infer what they probably want to achieve (goals, use case).
- Ask a concise set of specific, high-leverage questions to clarify the scope and parameters of the research.

You are NOT running the research. You are only helping define it precisely.

Context
The user is typically researching content resonance: which messages, hooks, formats, and channels resonate with a specific audience.
They may be interested in:
- Customer language and sentiment
- High-performing content patterns
- Channels and communities where their audience hangs out
- Objections, desires, pain points, and buying indicators

Your output
Respond in strict JSON:
{
  "summary": "Short paragraph describing what the user seems to want.",
  "initialQuestions": [
    "Question 1 ...",
    "Question 2 ...",
    "Question 3 ..."
  ]
}

Summary guidelines:
- 2-4 sentences describing audience, objective, and likely use case.

InitialQuestions guidelines:
- Ask 3-7 concrete questions about goals, audience, channels, constraints, priorities.
- Avoid vague or academic language.

Return only the JSON object.`;

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
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const userMessage = `Title: ${title}\nDescription: ${description}`;

    const response = await callChatModel({
      messages: [
        { role: "system", content: CLARIFY_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      responseFormatType: "json_object",
    });

    try {
      const parsed = JSON.parse(response);
      if (
        typeof parsed.summary !== "string" ||
        !Array.isArray(parsed.initialQuestions)
      ) {
        throw new Error("Invalid response shape");
      }

      return NextResponse.json(parsed);
    } catch (err) {
      console.error("Failed to parse clarify response:", response);
      return NextResponse.json(
        { error: "Failed to generate clarifying questions" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/research/clarify:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


