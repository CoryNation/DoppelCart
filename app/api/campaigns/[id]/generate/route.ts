import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { mapCampaignContentRow, mapCampaignRow } from "@/lib/campaigns/mappers";
import { generateCampaignContent } from "@/lib/openaiCampaign";

const GenerationSchema = z.object({
  prompt: z.string().max(4000).optional(),
  researchContext: z.record(z.string(), z.unknown()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const { id: campaignId } = await context.params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = GenerationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { data: campaignRow, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (campaignError || !campaignRow) {
    if (campaignError?.code === "PGRST116") {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    console.error("Failed to load campaign for generation:", campaignError);
    return NextResponse.json(
      { error: "Failed to load campaign" },
      { status: 500 }
    );
  }

  const { data: personaRow, error: personaError } = await supabase
    .from("personas")
    .select(
      "id, display_name, biography, occupation, industry, goals, personality, voice, niche"
    )
    .eq("id", campaignRow.persona_id)
    .single();

  if (personaError || !personaRow) {
    console.error("Persona missing for campaign generation", personaError);
    return NextResponse.json(
      { error: "Persona not found for campaign" },
      { status: 422 }
    );
  }

  const { data: jobRecord, error: jobError } = await supabase
    .from("campaign_generation_jobs")
    .insert({
      campaign_id: campaignRow.id,
      input_prompt:
        parsed.data.prompt ??
        campaignRow.objective ??
        "Generate campaign content for the persona.",
    })
    .select("*")
    .single();

  if (jobError || !jobRecord) {
    console.error("Failed to create generation job", jobError);
    return NextResponse.json(
      { error: "Unable to start generation job" },
      { status: 500 }
    );
  }

  try {
    const campaign = mapCampaignRow(campaignRow);
    const generation = await generateCampaignContent(
      {
        id: personaRow.id,
        display_name: personaRow.display_name,
        biography: personaRow.biography,
        occupation: personaRow.occupation,
        industry: personaRow.industry,
        goals: personaRow.goals,
        personality: personaRow.personality,
        voice: personaRow.voice,
        niche: personaRow.niche,
      },
      campaign,
      parsed.data.researchContext
    );

    const inserts = generation.posts.map((post) => ({
      campaign_id: campaign.id,
      persona_id: campaign.persona_id,
      persona_social_account_id: null,
      platform_id:
        post.recommended_platforms?.[0] ??
        campaign.target_platforms[0] ??
        null,
      status: "draft",
      content_json: {
        title: post.title,
        text: post.text,
        image_prompt: post.image_prompt ?? undefined,
        recommended_platforms: post.recommended_platforms,
      },
      created_by: "ai",
    }));

    const { data: insertedContent, error: insertError } = await supabase
      .from("campaign_posts")
      .insert(inserts)
      .select("*");

    if (insertError) {
      throw insertError;
    }

    const { data: updatedJob } = await supabase
      .from("campaign_generation_jobs")
      .update({
        status: "completed",
        result_json: generation,
        error_message: null,
      })
      .eq("id", jobRecord.id)
      .select("*")
      .single();

    return NextResponse.json({
      job: updatedJob ?? {
        ...jobRecord,
        status: "completed",
        result_json: generation,
        error_message: null,
      },
      campaign,
      created_content: (insertedContent ?? []).map(mapCampaignContentRow),
    });
  } catch (error) {
    console.error("AI generation failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate content";
    await supabase
      .from("campaign_generation_jobs")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", jobRecord.id);

    return NextResponse.json(
      { error: "AI generation failed", details: message },
      { status: 500 }
    );
  }
}


