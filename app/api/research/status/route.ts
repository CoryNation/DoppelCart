import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getResearchTaskById, progressResearchTask } from "@/lib/research";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    let task = await getResearchTaskById(id, user.id);

    if (!task) {
      return NextResponse.json(
        { error: "Research task not found" },
        { status: 404 }
      );
    }

    if (task.status === "running") {
      const progressed = await progressResearchTask(id, { userId: user.id });
      if (progressed) {
        task = progressed;
      }
    }

    // Also update the resonance_research table if it exists
    // Find the resonance_research record that links to this research task
    const { data: allResonanceRecords } = await supabase
      .from("resonance_research")
      .select("id, input_context")
      .eq("user_id", user.id);

    const resonanceRecord = allResonanceRecords?.find(
      (record) =>
        record.input_context &&
        typeof record.input_context === "object" &&
        "researchTaskId" in record.input_context &&
        record.input_context.researchTaskId === id
    );

    if (resonanceRecord) {
      const resonanceId = resonanceRecord.id;
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Map research_tasks status to resonance_research status
      if (task.status === "completed") {
        updateData.status = "completed";
        updateData.last_run_at = new Date().toISOString();
        // If there's a final report, we could store it in result, but for now just mark as completed
      } else if (task.status === "failed") {
        updateData.status = "failed";
        updateData.error_message = task.resultSummary || "Research task failed";
        updateData.last_run_at = new Date().toISOString();
      } else {
        updateData.status = "running";
      }

      await supabase
        .from("resonance_research")
        .update(updateData)
        .eq("id", resonanceId);
    }

    const statusMessage =
      task.status === "completed"
        ? "Research completed."
        : task.status === "failed"
        ? "Research failed."
        : task.progress > 70
        ? "Synthesizing final report…"
        : "Collecting signals…";

    return NextResponse.json({
      status: task.status,
      progress: task.progress,
      statusMessage,
      reportReady: Boolean(task.resultDetails?.finalReport),
    });
  } catch (error) {
    console.error("Error in GET /api/research/status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

