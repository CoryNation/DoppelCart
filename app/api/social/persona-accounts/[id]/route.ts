import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id: accountId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: account, error: accountError } = await supabase
      .from("persona_social_accounts")
      .select(
        `
        *,
        personas!inner (
          user_id
        )
      `
      )
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    if (account.personas.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("persona_social_accounts")
      .update({
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        status: "revoked",
        revoked_at: new Date().toISOString(),
        last_token_error: null,
      })
      .eq("id", accountId);

    if (updateError) {
      console.error("Failed to revoke social account:", updateError);
      return NextResponse.json(
        { error: "Failed to revoke account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Unexpected error in DELETE /api/social/persona-accounts/[id]:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

