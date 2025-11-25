import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { runResonanceResearch } from "@/lib/openai";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch existing record to verify ownership and get prompt details
    const { data: existingResearch, error: fetchError } = await supabase
      .from("resonance_research")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingResearch) {
      if (fetchError?.code === "PGRST116" || !existingResearch) {
        return NextResponse.json(
          { error: "Resonance research not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching resonance research for rerun:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch resonance research" },
        { status: 500 }
      );
    }

    // 2. Set status to running
    const { error: updateStartError } = await supabase
      .from("resonance_research")
      .update({
        status: "running",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateStartError) {
      console.error("Error setting resonance research to running:", updateStartError);
      return NextResponse.json(
        { error: "Failed to start rerun" },
        { status: 500 }
      );
    }

    // 3. Run AI research
    try {
      const result = await runResonanceResearch(
        existingResearch.initial_prompt,
        existingResearch.input_context
      );

      // 4a. Update with success
      const { data: updatedResearch, error: updateSuccessError } = await supabase
        .from("resonance_research")
        .update({
          result,
          status: "completed",
          error_message: null,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .select()
        .single();

      if (updateSuccessError) {
        console.error("Error saving rerun results:", updateSuccessError);
        return NextResponse.json(
          { error: "Failed to save rerun results" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedResearch);
    } catch (aiError: any) {
      console.error("AI Rerun failed:", aiError);

      // 4b. Update with failure
      const { error: failUpdateError } = await supabase
        .from("resonance_research")
        .update({
          status: "failed",
          error_message: aiError.message || "Unknown error during AI rerun",
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (failUpdateError) {
        console.error("Error updating resonance research failure status:", failUpdateError);
      }

      return NextResponse.json(
        { error: "Resonance research rerun failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/resonance/[id]/rerun:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

