import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { runResonanceResearch } from "@/lib/openai";
import { ResonanceResearchListItem } from "@/types/resonance";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query resonance_research with a count of related personas
    // Note: This assumes a foreign key relationship exists between resonance_research and resonance_research_personas
    const { data, error } = await supabase
      .from("resonance_research")
      .select("*, resonance_research_personas(count:persona_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resonance research:", error);
      return NextResponse.json(
        { error: "Failed to fetch resonance research" },
        { status: 500 }
      );
    }

    // Map the result to include persona_count as a number
    const researchList: ResonanceResearchListItem[] = (data || []).map(
      (item: any) => {
        const { resonance_research_personas, ...rest } = item;
        return {
          ...rest,
          persona_count: resonance_research_personas?.[0]?.count ?? 0,
        };
      }
    );

    return NextResponse.json(researchList);
  } catch (error) {
    console.error("Unexpected error in GET /api/resonance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
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
    const { title, initial_prompt, input_context } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!initial_prompt || typeof initial_prompt !== "string" || !initial_prompt.trim()) {
      return NextResponse.json(
        { error: "Initial prompt is required" },
        { status: 400 }
      );
    }

    // 1. Insert initial record with 'running' status
    const { data: newResearch, error: insertError } = await supabase
      .from("resonance_research")
      .insert({
        user_id: user.id,
        title,
        initial_prompt,
        input_context: input_context ?? null,
        status: "running",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating resonance research:", insertError);
      return NextResponse.json(
        { error: "Failed to create resonance research" },
        { status: 500 }
      );
    }

    // 2. Run AI research
    try {
      const result = await runResonanceResearch(initial_prompt, input_context);

      // 3a. Update with success
      const { data: updatedResearch, error: updateError } = await supabase
        .from("resonance_research")
        .update({
          result,
          status: "completed",
          error_message: null,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", newResearch.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating resonance research with result:", updateError);
        // Even if update fails, we tried. But we can't return the updated row.
        // We'll return 500 here because the state is inconsistent with the result we have.
        return NextResponse.json(
          { error: "Failed to save research results" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedResearch);

    } catch (aiError: any) {
      console.error("AI Research failed:", aiError);

      // 3b. Update with failure
      const { error: failUpdateError } = await supabase
        .from("resonance_research")
        .update({
          status: "failed",
          error_message: aiError.message || "Unknown error during AI research",
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", newResearch.id);

      if (failUpdateError) {
        console.error("Error updating resonance research failure status:", failUpdateError);
      }

      return NextResponse.json(
        { error: "Resonance research failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Unexpected error in POST /api/resonance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

