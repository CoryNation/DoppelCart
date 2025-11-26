import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { CampaignPost } from "@/types/social";

const CampaignPostQuerySchema = z.object({
  campaignId: z.string().uuid().optional(),
  personaId: z.string().uuid().optional(),
  platformId: z.string().optional(),
  status: z.string().optional(),
});

const CampaignPostContentSchema = z
  .object({
    title: z.string().min(1).optional(),
    text: z.string().min(1),
    image_prompt: z.string().optional().nullable(),
    image_url: z.string().url().optional().nullable(),
    recommended_platforms: z.array(z.string()).optional(),
    prompt_metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const CampaignPostCreateSchema = z.object({
  campaign_id: z.string().uuid(),
  persona_id: z.string().uuid(),
  persona_social_account_id: z.string().uuid(),
  platform_id: z.string().min(1),
  status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
  scheduled_for: z.string().datetime().optional().nullable(),
  posted_at: z.string().datetime().optional().nullable(),
  content_json: CampaignPostContentSchema,
  media_assets: z.array(z.unknown()).optional(),
  platform_options: z.record(z.string(), z.unknown()).optional(),
  created_by: z.enum(["user", "ai"]).optional(),
});

const CampaignPostUpdateSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
    scheduled_for: z.string().datetime().optional().nullable(),
    posted_at: z.string().datetime().optional().nullable(),
    content_json: CampaignPostContentSchema.optional(),
    media_assets: z.array(z.unknown()).optional(),
    platform_options: z.record(z.string(), z.unknown()).optional(),
    error_message: z.string().optional().nullable(),
    retry_count: z.number().int().optional(),
    last_attempt_at: z.string().datetime().optional().nullable(),
    workflow_state: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => {
    const keys = Object.keys(value).filter((key) => key !== "id");
    return keys.length > 0;
  }, "At least one field besides id must be provided");

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
    const queryResult = CampaignPostQuerySchema.safeParse({
      campaignId: searchParams.get("campaignId") || undefined,
      personaId: searchParams.get("personaId") || undefined,
      platformId: searchParams.get("platformId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { campaignId, personaId, platformId, status } = queryResult.data;

    let query = supabase
      .from("campaign_posts")
      .select(
        `
        *,
        campaigns!inner (
          id,
          user_id
        )
      `
      )
      .eq("campaigns.user_id", user.id)
      .order("created_at", { ascending: false });

    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    if (personaId) {
      query = query.eq("persona_id", personaId);
    }

    if (platformId) {
      query = query.eq("platform_id", platformId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching campaign posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaign posts" },
        { status: 500 }
      );
    }

    type CampaignPostRow = CampaignPost & {
      campaigns?: { user_id: string } | null;
    };

    const posts =
      ((data as CampaignPostRow[] | null) ?? []).map((row) => {
        const { campaigns, ...post } = row;
        void campaigns;
        return post as CampaignPost;
      });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Unexpected error in GET /api/campaign-posts:", error);
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

    const json = await req.json();
    const parseResult = CampaignPostCreateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    // Verify campaign ownership
    const { data: campaignRecord, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, user_id, persona_id")
      .eq("id", body.campaign_id)
      .single();

    if (campaignError || !campaignRecord) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaignRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (campaignRecord.persona_id !== body.persona_id) {
      return NextResponse.json(
        { error: "Persona does not match campaign" },
        { status: 400 }
      );
    }

    const { data: accountRecord, error: accountError } = await supabase
      .from("persona_social_accounts")
      .select("id, persona_id, platform_id")
      .eq("id", body.persona_social_account_id)
      .single();

    if (accountError || !accountRecord) {
      return NextResponse.json(
        { error: "Persona social account not found" },
        { status: 404 }
      );
    }

    if (accountRecord.persona_id !== body.persona_id) {
      return NextResponse.json(
        { error: "Social account does not belong to persona" },
        { status: 400 }
      );
    }

    if (accountRecord.platform_id !== body.platform_id) {
      return NextResponse.json(
        { error: "Platform mismatch between account and request" },
        { status: 400 }
      );
    }

    const insertPayload = {
      campaign_id: body.campaign_id,
      persona_id: body.persona_id,
      persona_social_account_id: body.persona_social_account_id,
      platform_id: body.platform_id,
      status: body.status ?? "draft",
      scheduled_for: body.scheduled_for ?? null,
      posted_at: body.posted_at ?? null,
      content_json: body.content_json,
      media_assets: body.media_assets ?? [],
      platform_options: body.platform_options ?? {},
      created_by: body.created_by ?? "user",
    };

    const { data, error } = await supabase
      .from("campaign_posts")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating campaign post:", error);
      return NextResponse.json(
        { error: "Failed to create campaign post" },
        { status: 500 }
      );
    }

    return NextResponse.json(data as CampaignPost, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/campaign-posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parseResult = CampaignPostUpdateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parseResult.data;

    const { data: postRecord, error: postError } = await supabase
      .from("campaign_posts")
      .select(
        `
        *,
        campaigns!inner (
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("campaigns.user_id", user.id)
      .single();

    if (postError || !postRecord) {
      return NextResponse.json(
        { error: "Campaign post not found" },
        { status: 404 }
      );
    }

    const normalizedUpdates = {
      ...updates,
      scheduled_for:
        updates.scheduled_for !== undefined
          ? updates.scheduled_for
          : undefined,
      posted_at:
        updates.posted_at !== undefined ? updates.posted_at : undefined,
      error_message:
        updates.error_message !== undefined ? updates.error_message : undefined,
      last_attempt_at:
        updates.last_attempt_at !== undefined
          ? updates.last_attempt_at
          : undefined,
      media_assets: updates.media_assets ?? undefined,
      platform_options: updates.platform_options ?? undefined,
      workflow_state: updates.workflow_state ?? undefined,
      content_json: updates.content_json ?? undefined,
      status: updates.status ?? undefined,
    };

    const { data, error } = await supabase
      .from("campaign_posts")
      .update(normalizedUpdates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating campaign post:", error);
      return NextResponse.json(
        { error: "Failed to update campaign post" },
        { status: 500 }
      );
    }

    return NextResponse.json(data as CampaignPost);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/campaign-posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

