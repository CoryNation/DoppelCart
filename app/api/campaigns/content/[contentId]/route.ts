import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

interface RouteContext {
  params: Promise<{ contentId: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
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
      id,
      campaign_id,
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
    console.error("Failed to load content for delete", postError);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabase
    .from("campaign_posts")
    .delete()
    .eq("id", postRecord.id);

  if (deleteError) {
    console.error("Failed to delete content item", deleteError);
    return NextResponse.json(
      { error: "Failed to delete content item" },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}


