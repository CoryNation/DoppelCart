import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { runResonanceResearch } from "@/lib/openai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq("id", id)
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
      .eq("id", id);

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
        .eq("id", id)
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
    } catch (aiError: unknown) {
      // Enhanced error logging
      console.error("AI Rerun failed:", {
        error: aiError,
        errorType: aiError instanceof Error ? aiError.constructor.name : typeof aiError,
        errorMessage: aiError instanceof Error ? aiError.message : String(aiError),
        errorStack: aiError instanceof Error ? aiError.stack : undefined,
        researchId: id,
      });

      const errorMessage = aiError instanceof Error ? aiError.message : "Unknown error during AI rerun";

      // 4b. Update with failure
      const { error: failUpdateError } = await supabase
        .from("resonance_research")
        .update({
          status: "failed",
          error_message: errorMessage,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (failUpdateError) {
        console.error("Error updating resonance research failure status:", failUpdateError);
      }

      // Provide user-friendly error messages
      let userMessage = "Resonance research rerun failed";
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        userMessage = 'OpenAI API configuration error. Please contact support.';
      } else if (errorMessage.includes('rate limit')) {
        userMessage = 'Service is temporarily busy. Please try again in a moment.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        userMessage = 'Service quota exceeded. Please contact support.';
      }

      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    // Enhanced error logging for unexpected errors
    console.error("Unexpected error in POST /api/resonance/[id]/rerun:", {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

