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

    let query = supabase
      .from("persona_social_accounts")
      .select(`
        *,
        personas!inner (
          user_id
        )
      `)
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { personas, ...account } = item;
      return account;
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

