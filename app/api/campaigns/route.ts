import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { Campaign } from "@/types/social";

const CampaignQuerySchema = z.object({
  personaId: z.string().uuid().optional(),
  status: z.string().optional(),
});

const CampaignCreateSchema = z.object({
  persona_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  goal: z.string().max(2000).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  status: z
    .enum(["draft", "active", "paused", "completed", "archived"])
    .optional(),
  objective: z.string().max(2000).optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  timezone: z.string().max(120).optional().nullable(),
  metrics: z.record(z.unknown()).optional(),
  budget_cents: z.number().int().optional().nullable(),
  budget_currency: z.string().length(3).optional().nullable(),
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
    const queryResult = CampaignQuerySchema.safeParse({
      personaId: searchParams.get("personaId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { personaId, status } = queryResult.data;

    let query = supabase
      .from("campaigns")
      .select("*")
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

    return NextResponse.json(data as Campaign[]);
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
    const parseResult = CampaignCreateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    // Verify persona ownership
    const { data: personaRecord, error: personaError } = await supabase
      .from("personas")
      .select("id, user_id")
      .eq("id", body.persona_id)
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

    const insertPayload = {
      user_id: user.id,
      persona_id: body.persona_id,
      name: body.name,
      goal: body.goal ?? null,
      notes: body.notes ?? null,
      status: body.status ?? "draft",
      objective: body.objective ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      timezone: body.timezone ?? null,
      metrics: body.metrics ?? {},
      budget_cents: body.budget_cents ?? null,
      budget_currency: body.budget_currency ?? null,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Campaign, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/campaigns:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

