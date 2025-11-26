import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel } from "@/lib/openai";

const ANALYZE_SYSTEM_PROMPT = `You are Resonance Researcher, analyzing a batch of content for a single sub-question within a Resonance Research study.

You receive:
- clarifiedScope
- parameters
- subQuestion (id + question text)
- snippets (each with metadata and text)

Your job is to extract patterns about what resonates or fails, capture hooks/formats, and surface objections/desires.

Respond with strict JSON:
{
  "subQuestionId": "...",
  "insightSummary": "...",
  "patterns": [
    {
      "pattern": "...",
      "evidenceSnippets": [
        { "snippetId": "...", "quote": "..." }
      ],
      "implication": "..."
    }
  ],
  "resonantElements": {
    "hooks": ["..."],
    "phrases": ["..."],
    "formats": ["..."],
    "emotionalTones": ["..."]
  },
  "objectionsAndFears": [
    { "theme": "...", "example": "..." }
  ],
  "desiresAndOutcomes": [
    { "theme": "...", "example": "..." }
  ]
}

Guidelines:
- Prioritize patterns that would change content strategy.
- Reference snippet IDs/quotes when citing evidence.
- If the batch is weak/noisy, say so in insightSummary and keep patterns sparse.
- Output only valid JSON.`;

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
    const { clarifiedScope, parameters, subQuestion, snippets } = body as {
      clarifiedScope?: string;
      parameters?: Record<string, unknown>;
      subQuestion?: { id: string; question: string };
      snippets?: Array<Record<string, unknown>>;
    };

    if (!clarifiedScope || !parameters || !subQuestion || !snippets) {
      return NextResponse.json(
        { error: "clarifiedScope, parameters, subQuestion, and snippets are required" },
        { status: 400 }
      );
    }

    const userMessage = `Clarified Scope:\n${clarifiedScope}\n\nParameters:\n${JSON.stringify(
      parameters,
      null,
      2
    )}\n\nSubQuestion:\n${JSON.stringify(subQuestion, null, 2)}\n\nSnippets:\n${JSON.stringify(
      snippets,
      null,
      2
    )}`;

    const response = await callChatModel({
      messages: [
        { role: "system", content: ANALYZE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      responseFormatType: "json_object",
    });

    try {
      const parsed = JSON.parse(response);
      return NextResponse.json(parsed);
    } catch {
      console.error("Failed to parse batch analysis response");
      return NextResponse.json(
        { error: "Failed to analyze snippets" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/research/analyze:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


