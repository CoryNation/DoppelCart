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

