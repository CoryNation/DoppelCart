import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { generatePersonaFromCorpus } from "@/lib/openai/personaFromCorpus";

interface RequestBody {
  name?: string;
  description?: string;
  ai_history_text: string;
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

    const body = (await req.json()) as RequestBody;
    const { name, description, ai_history_text } = body;

    if (!ai_history_text || typeof ai_history_text !== "string" || ai_history_text.trim().length === 0) {
      return NextResponse.json(
        { error: "ai_history_text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Trim to safe max length (e.g., 50k characters to stay within token limits)
    const maxLength = 50000;
    const trimmedText = ai_history_text.length > maxLength
      ? ai_history_text.substring(0, maxLength) + "..."
      : ai_history_text;

    if (trimmedText.trim().length < 200) {
      return NextResponse.json(
        { error: "AI history text is too short. Please provide more content." },
        { status: 400 }
      );
    }

    // Generate persona from corpus
    const result = await generatePersonaFromCorpus({
      userName: name,
      userDescription: description,
      corpusSummary: trimmedText,
      mode: "ai_history_import",
    });

    const personaDraft = result.personaDraft;

    // Create agent first (following existing pattern)
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .insert({
        user_id: user.id,
        name: name || personaDraft.name,
        primary_goal: personaDraft.goals[0] || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (agentError) {
      console.error("Error creating agent:", agentError);
      return NextResponse.json(
        { error: "Failed to create agent" },
        { status: 500 }
      );
    }

    const agentId = agentData.id;

    // Map personaDraft to PersonaState structure
    const personaState = {
      display_name: personaDraft.name,
      avatar_prompt: `A social media persona: ${personaDraft.tagline}`,
      stats: {
        charisma: 50,
        logic: 50,
        humor: 50,
        warmth: 50,
        edge: 50,
        creativity: 50,
      },
      goals: personaDraft.goals,
      demographics: {},
      personality: {
        tone: personaDraft.tone,
        bigFive: {},
      },
      biography: personaDraft.bio,
    };

    // Insert persona
    const { data: personaData, error: personaError } = await supabase
      .from("personas")
      .insert({
        user_id: user.id,
        agent_id: agentId,
        display_name: personaDraft.name,
        avatar_prompt: personaState.avatar_prompt,
        stats: personaState.stats,
        goals: personaDraft.goals,
        demographics: personaState.demographics,
        personality: personaState.personality,
        biography: personaDraft.bio,
        raw_definition: personaState,
        origin_type: "ai_history_import",
        origin_metadata: {
          source_type: "ai_history_text",
          text_length: trimmedText.length,
          notes: description || null,
        },
      })
      .select("*, agent_id")
      .single();

    if (personaError || !personaData) {
      console.error("Error creating persona:", personaError);
      // Cleanup agent if persona creation fails
      await supabase.from("agents").delete().eq("id", agentId);
      return NextResponse.json(
        { error: "Failed to create persona record" },
        { status: 500 }
      );
    }

    // Optionally insert persona_source
    const sourceSummary = `AI history import with ${trimmedText.length} characters of conversation text`;
    
    await supabase.from("persona_sources").insert({
      persona_id: personaData.id,
      source_type: "ai_history_text",
      storage_path: null,
      original_filename: null,
      source_summary: sourceSummary,
    });

    return NextResponse.json(personaData);
  } catch (error: unknown) {
    console.error("Error in from-ai-history API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

