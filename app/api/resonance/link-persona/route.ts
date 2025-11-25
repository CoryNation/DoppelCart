import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { researchId, personaId } = body;

    if (!researchId || !personaId) {
      return NextResponse.json(
        { error: "researchId and personaId are required" },
        { status: 400 }
      );
    }

    // 1. Verify research ownership
    const { data: research, error: researchError } = await supabase
      .from("resonance_research")
      .select("id")
      .eq("id", researchId)
      .eq("user_id", user.id)
      .single();

    if (researchError || !research) {
      if (researchError?.code === "PGRST116" || !research) {
        return NextResponse.json(
          { error: "Resonance research not found or access denied" },
          { status: 404 }
        );
      }
      console.error("Error verifying research ownership:", researchError);
      return NextResponse.json(
        { error: "Failed to verify research ownership" },
        { status: 500 }
      );
    }

    // 2. Verify persona ownership (optional but recommended for security)
    const { data: persona, error: personaError } = await supabase
      .from("personas") // Assuming table name is 'personas'
      .select("id")
      .eq("id", personaId)
      .eq("user_id", user.id) // Assuming personas have user_id
      .single();

    if (personaError || !persona) {
       if (personaError?.code === "PGRST116" || !persona) {
        return NextResponse.json(
          { error: "Persona not found or access denied" },
          { status: 404 }
        );
      }
      console.error("Error verifying persona ownership:", personaError);
       return NextResponse.json(
        { error: "Failed to verify persona ownership" },
        { status: 500 }
      );
    }

    // 3. Link them
    const { data: link, error: linkError } = await supabase
      .from("resonance_research_personas")
      .upsert(
        {
          research_id: researchId,
          persona_id: personaId,
        },
        { onConflict: "research_id, persona_id" }
      )
      .select()
      .single();

    if (linkError) {
      console.error("Error linking persona to research:", linkError);
      return NextResponse.json(
        { error: "Failed to link persona to research" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("Unexpected error in POST /api/resonance/link-persona:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

