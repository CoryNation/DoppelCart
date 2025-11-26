import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { mapCampaignContentRow } from "@/lib/campaigns/mappers";

interface RouteContext {
  params: Promise<{ contentId: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const { contentId } = await context.params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: postRecord,
    error: postError,
  } = await supabase
    .from("campaign_posts")
    .select(
      `
      *,
      campaigns!inner ( user_id )
    `
    )
    .eq("id", contentId)
    .eq("campaigns.user_id", user.id)
    .single();

  if (postError || !postRecord) {
    if (postError?.code === "PGRST116") {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    console.error("Failed to load campaign content for unschedule", postError);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from("campaign_posts")
    .update({
      status: "draft",
      scheduled_for: null,
      persona_social_account_id: null,
      error_message: null,
    })
    .eq("id", contentId)
    .select("*")
    .single();

  if (updateError || !updatedPost) {
    console.error("Failed to unschedule content", updateError);
    return NextResponse.json(
      { error: "Unable to unschedule content" },
      { status: 500 }
    );
  }

  return NextResponse.json(mapCampaignContentRow(updatedPost));
}


