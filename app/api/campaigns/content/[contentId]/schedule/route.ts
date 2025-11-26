import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { mapCampaignContentRow } from "@/lib/campaigns/mappers";

const ScheduleSchema = z.object({
  scheduledFor: z.string().datetime(),
  personaSocialAccountId: z.string().uuid(),
  platformId: z.string().optional(),
});

interface RouteContext {
  params: { contentId: string };
}

export async function POST(req: NextRequest, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = ScheduleSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { contentId } = context.params;
  const { scheduledFor, personaSocialAccountId, platformId } = parsed.data;

  const {
    data: postRecord,
    error: postError,
  } = await supabase
    .from("campaign_posts")
    .select(
      `
      *,
      campaigns!inner ( user_id, persona_id )
    `
    )
    .eq("id", contentId)
    .eq("campaigns.user_id", user.id)
    .single();

  if (postError || !postRecord) {
    if (postError?.code === "PGRST116") {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    console.error("Unable to load campaign content", postError);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }

  const { data: accountRecord, error: accountError } = await supabase
    .from("persona_social_accounts")
    .select("id, platform_id, persona_id, status")
    .eq("id", personaSocialAccountId)
    .single();

  if (accountError || !accountRecord) {
    return NextResponse.json(
      { error: "Persona social account not found" },
      { status: 404 }
    );
  }

  if (accountRecord.persona_id !== postRecord.persona_id) {
    return NextResponse.json(
      { error: "Account does not belong to this persona" },
      { status: 403 }
    );
  }

  const resolvedPlatform = platformId ?? accountRecord.platform_id;

  const { data: updatedPost, error: updateError } = await supabase
    .from("campaign_posts")
    .update({
      status: "scheduled",
      persona_social_account_id: accountRecord.id,
      platform_id: resolvedPlatform,
      scheduled_for: scheduledFor,
      error_message: null,
    })
    .eq("id", contentId)
    .select("*")
    .single();

  if (updateError || !updatedPost) {
    console.error("Failed to schedule content", updateError);
    return NextResponse.json(
      { error: "Failed to schedule content" },
      { status: 500 }
    );
  }

  return NextResponse.json(mapCampaignContentRow(updatedPost));
}


