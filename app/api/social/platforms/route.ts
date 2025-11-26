import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { SocialPlatform } from "@/types/social";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("social_platforms")
      .select("*")
      .order("display_name");

    if (error) {
      console.error("Error fetching social platforms:", error);
      return NextResponse.json(
        { error: "Failed to fetch social platforms" },
        { status: 500 }
      );
    }

    // Explicitly cast to ensure type safety, though data should match
    const platforms: SocialPlatform[] = data as SocialPlatform[];

    return NextResponse.json(platforms);
  } catch (error) {
    console.error("Unexpected error in GET /api/social/platforms:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}



