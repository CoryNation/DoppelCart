import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel } from "@/lib/openai";

const PLAN_SYSTEM_PROMPT = `You are Resonance Researcher, a senior strategist powering the DoppelCart "Resonance Research" feature.

You receive:
- clarifiedScope: paragraph describing exactly what the user wants researched.
- parameters: JSON object with audience, platforms, goals, constraints, etc.

Your task is to produce a practical research plan JSON:
{
  "planSummary": "...",
  "subQuestions": [
    {
      "id": "sq1",
      "question": "...",
      "rationale": "...",
      "priority": "high | medium | low"
    }
  ],
  "dataSources": [
    {
      "id": "src1",
      "type": "platform | search | forum | reviews | competitors | other",
      "name": "TikTok | Reddit | ...",
      "intendedUse": "..."
    }
  ],
  "collectionStrategy": {
    "approach": "...",
    "samplingGuidelines": "...",
    "filters": "..."
  },
  "analysisFocus": {
    "resonanceSignals": ["..."],
    "dimensions": ["..."],
    "expectedDeliverables": ["..."]
  }
}

Guidelines:
- 3-7 subQuestions, each unique.
- Only include platforms/sources relevant to parameters.platforms or implied by the scope.
- Be concrete: specify what to fetch, where, and why.
- Keep JSON valid.`;

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
    const { clarifiedScope, parameters } = body as {
      clarifiedScope?: string;
      parameters?: Record<string, unknown>;
    };

    if (!clarifiedScope || !parameters) {
      return NextResponse.json(
        { error: "clarifiedScope and parameters are required" },
        { status: 400 }
      );
    }

    const userMessage = `Clarified Scope:\n${clarifiedScope}\n\nParameters:\n${JSON.stringify(
      parameters,
      null,
      2
    )}`;

    const response = await callChatModel({
      messages: [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      responseFormatType: "json_object",
    });

    try {
      const parsed = JSON.parse(response);
      return NextResponse.json(parsed);
    } catch (err) {
      console.error("Failed to parse research plan:", response);
      return NextResponse.json(
        { error: "Failed to generate research plan" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/research/plan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


