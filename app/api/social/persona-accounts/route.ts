import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { PersonaSocialAccount } from "@/types/social";

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
    const personaId = searchParams.get("personaId");

    const accountColumns = `
      id,
      persona_id,
      platform_id,
      platform_account_id,
      display_name,
      account_handle,
      profile_url,
      avatar_url,
      provider_account_id,
      provider_username,
      status,
      scopes,
      token_type,
      access_token_expires_at,
      refresh_token_expires_at,
      last_token_refresh_at,
      last_token_error,
      last_refreshed_at,
      metadata,
      last_synced_at,
      last_engagement_sync_at,
      revoked_at,
      created_at,
      updated_at
    `;

    let query = supabase
      .from("persona_social_accounts")
      .select(
        `
        ${accountColumns},
        personas!inner (
          user_id
        )
      `
      )
      .eq("personas.user_id", user.id);

    if (personaId) {
      query = query.eq("persona_id", personaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching persona social accounts:", error);
      return NextResponse.json(
        { error: "Failed to fetch persona social accounts" },
        { status: 500 }
      );
    }

    // Clean up the response to remove the joined table data if not part of the type
    // and cast to PersonaSocialAccount[]
    const accounts: PersonaSocialAccount[] = (data || []).map((item: any) => {
      const { personas, metadata, ...account } = item;
      return {
        ...account,
        metadata: metadata ?? {},
      };
    }) as PersonaSocialAccount[];

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Unexpected error in GET /api/social/persona-accounts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

