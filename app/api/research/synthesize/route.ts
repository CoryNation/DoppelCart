import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel } from "@/lib/openai";

const SYNTHESIS_SYSTEM_PROMPT = `You are Resonance Researcher, creating the final report for a Resonance Research study in DoppelCart.

You receive:
- clarifiedScope
- parameters
- The research plan JSON (subQuestions, dataSources, analysisFocus).
- A list of intermediate analysis results from previous steps (pattern and batch summaries for each subQuestion).

Your job:
Merge all this into a clear, practical report that helps the user understand:
- What resonates with their audience
- What doesn't
- How they should adjust messaging, content, and channel strategy

Output format:
Respond with strict JSON:

{
  "executiveSummary": "3–6 sentence summary of the most important findings and what to do about them.",
  "audienceSnapshot": {
    "whoTheyAre": "Short description based on parameters and observed behavior.",
    "keyMotivations": ["Main motivations or desired outcomes."],
    "keyFrustrations": ["Top frustrations or objections."]
  },
  "resonanceFindings": [
    {
      "theme": "Short title for a major theme (e.g., 'Practical demos beat abstract promises').",
      "description": "2–4 sentences describing the theme.",
      "supportingEvidence": [
        "Short references to patterns or examples (no need for exact URLs unless provided)."
      ],
      "implications": [
        "Concrete implications for messaging or content strategy."
      ]
    }
  ],
  "channelAndFormatInsights": {
    "byPlatform": [
      {
        "platform": "TikTok | Instagram | Reddit | etc.",
        "whatWorks": ["Behaviors, styles, or formats that resonate here."],
        "whatToAvoid": ["Patterns that underperform or backfire."],
        "exampleAngles": ["Concrete content angle ideas tailored to this platform."]
      }
    ],
    "crossPlatformPatterns": [
      "Patterns that seem to hold across multiple platforms."
    ]
  },
  "messagingRecommendations": {
    "coreNarratives": [
      "High-level storylines or narratives the user should lean into."
    ],
    "recommendedHooks": [
      "Example opening lines, hook styles, or question framings."
    ],
    "languageToUse": [
      "Words or phrasing patterns that match the audience's voice."
    ],
    "languageToAvoid": [
      "Words or framings that clash with the audience or show up negatively."
    ]
  },
  "objectionsAndResponses": [
    {
      "objection": "Concise statement of an objection.",
      "context": "When/why it appears.",
      "recommendedResponseAngle": "How to address or reframe it in messaging."
    }
  ],
  "nextSteps": [
    "Prioritized, practical next actions the user can take based on this research."
  ]
}

Guidelines:
- Be practical and concrete, not academic.
- Think like a strategist who needs to help the user change their content and messaging tomorrow.
- If the data was thin or ambiguous in some areas, acknowledge that, and steer them toward safer, higher-confidence recommendations.
- Keep examples short but vivid enough to be usable.
- Respond only with the JSON object.`;

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
    const { clarifiedScope, parameters, researchPlan, batchAnalyses } = body;

    if (!clarifiedScope || !parameters || !researchPlan || !batchAnalyses) {
      return NextResponse.json(
        { error: "Missing required fields: clarifiedScope, parameters, researchPlan, batchAnalyses" },
        { status: 400 }
      );
    }

    const userMessage = `clarifiedScope:\n${clarifiedScope}\n\nparameters:\n${JSON.stringify(parameters, null, 2)}\n\nresearchPlan:\n${JSON.stringify(researchPlan, null, 2)}\n\nbatchAnalyses:\n${JSON.stringify(batchAnalyses, null, 2)}`;

    const model = process.env.RESEARCH_REASONING_MODEL || process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini";

    const response = await callChatModel({
      messages: [
        { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      model,
      responseFormatType: "json_object",
    });

    try {
      const result = JSON.parse(response);
      return NextResponse.json(result);
    } catch {
      console.error("Failed to parse synthesis response");
      return NextResponse.json(
        { error: "Failed to generate synthesis report" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in research/synthesize:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

