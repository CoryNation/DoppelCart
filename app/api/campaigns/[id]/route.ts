import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  mapCampaignContentRow,
  mapCampaignRow,
  upsertTargetPlatforms,
} from "@/lib/campaigns/mappers";

const CampaignUpdateSchema = z
  .object({
    persona_id: z.string().uuid().optional(),
    name: z.string().min(1).max(200).optional(),
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
    target_platforms: z.array(z.string().min(1)).optional(),
    budget_cents: z.number().int().optional().nullable(),
    budget_currency: z.string().length(3).optional().nullable(),
    archived_at: z.string().datetime().optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

interface RouteContext {
  params: { id: string };
}

function mapGenerationJob(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    input_prompt: row.input_prompt,
    status: row.status,
    error_message: row.error_message ?? null,
    result_json: row.result_json ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", context.params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      console.error("Error fetching campaign:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaign" },
        { status: 500 }
      );
    }

    const [{ data: posts }, { data: job }] = await Promise.all([
      supabase
        .from("campaign_posts")
        .select("*")
        .eq("campaign_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("campaign_generation_jobs")
        .select("*")
        .eq("campaign_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      ...mapCampaignRow(data),
      content_items: (posts ?? []).map(mapCampaignContentRow),
      latest_generation_job: mapGenerationJob(job),
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/campaigns/[id]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = CampaignUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    if (updates.persona_id) {
      const { data: personaRecord, error: personaError } = await supabase
        .from("personas")
        .select("id, user_id")
        .eq("id", updates.persona_id)
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
    }

    const normalizedMetrics =
      updates.target_platforms !== undefined
        ? upsertTargetPlatforms(
            updates.metrics ?? {},
            Array.from(new Set(updates.target_platforms))
          )
        : updates.metrics;

    const mappedUpdates = {
      ...updates,
      metrics: normalizedMetrics ?? undefined,
      goal: updates.goal ?? undefined,
      notes: updates.notes ?? undefined,
      objective: updates.objective ?? undefined,
      start_date: updates.start_date ?? undefined,
      end_date: updates.end_date ?? undefined,
      timezone: updates.timezone ?? undefined,
      budget_cents: updates.budget_cents ?? undefined,
      budget_currency: updates.budget_currency ?? undefined,
      archived_at: updates.archived_at ?? undefined,
      target_platforms: undefined,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .update(mappedUpdates)
      .eq("id", context.params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      console.error("Error updating campaign:", error);
      return NextResponse.json(
        { error: "Failed to update campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json(mapCampaignRow(data));
  } catch (error) {
    console.error("Unexpected error in PATCH /api/campaigns/[id]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", context.params.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting campaign:", error);
      return NextResponse.json(
        { error: "Failed to delete campaign" },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/campaigns/[id]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

