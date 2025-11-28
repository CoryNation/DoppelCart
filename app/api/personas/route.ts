import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

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
      .from("personas")
      .select("id, display_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching personas:", error);
      return NextResponse.json(
        { error: "Failed to fetch personas" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Unexpected error in GET /api/personas:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const persona = payload?.persona ?? payload;
    const researchId = payload?.researchId;

    // Map ResearchPersona to personas table structure
    const personaData = {
      user_id: user.id,
      display_name: persona.name || persona.display_name || "Untitled Persona",
      biography: persona.summary || null,
      goals: Array.isArray(persona.goals) ? persona.goals : [],
      demographics: persona.demographics ? {
        roleOrProfession: persona.demographics.roleOrProfession,
        experienceLevel: persona.demographics.experienceLevel,
        organizationContext: persona.demographics.organizationContext,
        geography: persona.demographics.geography,
        other: persona.demographics.other,
      } : null,
      personality: {
        painPoints: persona.painPoints || [],
        motivators: persona.motivators || [],
        objections: persona.objections || [],
        preferredChannels: persona.preferredChannels || [],
        contentPreferences: persona.contentPreferences || {},
        languageAndVoice: persona.languageAndVoice || {},
        exampleHooks: persona.exampleHooks || [],
        callToActionStyles: persona.callToActionStyles || [],
      },
      raw_definition: persona,
      origin_type: researchId ? "resonance_research" : null,
      origin_metadata: researchId ? { researchId } : null,
    };

    const { data, error } = await supabase
      .from("personas")
      .insert(personaData)
      .select()
      .single();

    if (error) {
      console.error("Error saving persona:", error);
      return NextResponse.json(
        { error: "Failed to save persona", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      persona: data,
      status: "saved",
      message: "Persona saved successfully",
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/personas:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

