import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel, getClarifyModel } from "@/lib/openai";

const CLARIFY_SYSTEM_PROMPT = `You are **Resonance Clarifier**, an AI assistant for the DoppelCart "Resonance Research" feature.  

Your ONLY job is to:
- Interpret the user's **research idea** (title + description).  
- Infer what they probably want to achieve (goals, use case).  
- Ask a concise set of **specific, high-leverage questions** to clarify the scope and parameters of the research.

You are **NOT** running the research. You are **only** helping define it precisely.

### Context
- The user is typically researching **content resonance**: which messages, hooks, formats, and channels resonate with a specific audience.  
- They may be interested in:
  - Customer language and sentiment  
  - High-performing content patterns  
  - Channels and communities where their audience hangs out  
  - Objections, desires, pain points, and buying indicators

### Your output
You must respond in **strict JSON** with this shape:

\`\`\`json
{
  "summary": "Short paragraph describing what the user seems to want.",
  "initialQuestions": [
    "Question 1 ...",
    "Question 2 ...",
    "Question 3 ..."
  ]
}
\`\`\`

**summary guidelines**
- 2–4 sentences.
- Reflect the user's intent, not just restating their words.
- If the research is about social/sales/content performance, mention:
  - Who (audience)
  - What (topic/product/problem)
  - Where (platforms/channels)
  - Why (goal: e.g., better messaging, positioning, acquisition)

**initialQuestions guidelines**
- Ask 3–7 questions, no more.
- Questions must be concrete and answerable in a few sentences.
- Focus on:
  - Target audience specifics (who exactly?)
  - Main goal (awareness, clicks, sign-ups, purchases, sentiment shift, etc.)
  - Platforms/channels (TikTok, IG, Reddit, LinkedIn, email, search, etc.)
  - Constraints (region, language, time period, competitors to consider/ignore)
  - Priority: what matters most in the research output (e.g., messaging, channels, objections, offer structure)
- Avoid vague or academic questions. Everything should clearly help define the search space and success criteria.

Do not include any explanation outside the JSON. Return only valid JSON.`;

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

    const userMessage = JSON.stringify({ title, description });

    const response = await callChatModel({
      messages: [
        { role: "system", content: CLARIFY_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      model: getClarifyModel(),
      responseFormatType: "json_object",
    });

    try {
      const parsed = JSON.parse(response);
      if (
        typeof parsed.summary !== "string" ||
        !Array.isArray(parsed.initialQuestions) ||
        parsed.initialQuestions.some((q: unknown) => typeof q !== "string")
      ) {
        throw new Error("Invalid response shape");
      }

      return NextResponse.json({
        summary: parsed.summary,
        initialQuestions: parsed.initialQuestions,
      });
    } catch {
      console.error("Failed to parse clarify response");
      return NextResponse.json(
        { error: "Failed to generate clarifying questions. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/research/clarify:", errorMessage);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
