import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { postCampaignContentToReddit } from "@/lib/campaigns/posting";
import { mapCampaignContentRow } from "@/lib/campaigns/mappers";

interface RouteContext {
  params: Promise<{ contentId: string }>;
}

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contentId } = await context.params;

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Post to Reddit using shared helper
    const updatedContent = await postCampaignContentToReddit(contentId, user.id);

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error("Error posting campaign content to Reddit:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to post content to Reddit";

    // Return appropriate status codes based on error type
    if (errorMessage.includes("not found") || errorMessage.includes("access denied")) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    if (errorMessage.includes("not configured for Reddit")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (errorMessage.includes("status")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (errorMessage.includes("No connected Reddit account")) {
      return NextResponse.json({ error: errorMessage }, { status: 422 });
    }

    if (errorMessage.includes("Subreddit") || errorMessage.includes("Invalid content")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

