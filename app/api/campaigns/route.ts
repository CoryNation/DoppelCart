import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  mapCampaignRow,
  upsertTargetPlatforms,
  type DbCampaignRow,
} from "@/lib/campaigns/mappers";

const CampaignQuerySchema = z.object({
  personaId: z.string().uuid().optional(),
  status: z.string().optional(),
});

const CampaignCreateSchema = z.object({
  personaId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  targetPlatforms: z.array(z.string().min(1)).min(1).max(6),
});

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
    const parsed = CampaignQuerySchema.safeParse({
      personaId: searchParams.get("personaId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { personaId, status } = parsed.data;

    let query = supabase
      .from("campaigns")
      .select(
        `
        *,
        campaign_posts(count)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (personaId) {
      query = query.eq("persona_id", personaId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching campaigns:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaigns" },
        { status: 500 }
      );
    }

    type RowWithCount = DbCampaignRow & {
      campaign_posts?: { count?: number }[];
    };

    const campaigns =
      ((data as RowWithCount[] | null) ?? []).map((row) => {
        const mapped = mapCampaignRow(row);
        const count = row.campaign_posts?.[0]?.count ?? 0;
        return {
          ...mapped,
          content_count: count,
        };
      });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Unexpected error in GET /api/campaigns:", error);
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
    const parsed = CampaignCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { personaId, title, description, targetPlatforms } = parsed.data;

    const { data: personaRecord, error: personaError } = await supabase
      .from("personas")
      .select("id, user_id")
      .eq("id", personaId)
      .single();

    if (personaError || !personaRecord) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
    }

    if (personaRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const normalizedPlatforms = Array.from(new Set(targetPlatforms));
    const metrics = upsertTargetPlatforms({}, normalizedPlatforms);

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        persona_id: personaId,
        name: title,
        objective: description ?? null,
        status: "draft",
        metrics,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json(mapCampaignRow(data), { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/campaigns:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

