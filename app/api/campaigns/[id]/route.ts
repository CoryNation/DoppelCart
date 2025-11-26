import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { Campaign } from "@/types/social";

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

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      console.error("Error fetching campaign:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaign" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data as Campaign);
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
    const parseResult = CampaignUpdateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

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

    const mappedUpdates = {
      ...updates,
      goal: updates.goal ?? undefined,
      notes: updates.notes ?? undefined,
      objective: updates.objective ?? undefined,
      start_date: updates.start_date ?? undefined,
      end_date: updates.end_date ?? undefined,
      timezone: updates.timezone ?? undefined,
      metrics: updates.metrics ?? undefined,
      budget_cents: updates.budget_cents ?? undefined,
      budget_currency: updates.budget_currency ?? undefined,
      archived_at: updates.archived_at ?? undefined,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .update(mappedUpdates)
      .eq("id", context.params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating campaign:", error);
      return NextResponse.json(
        { error: "Failed to update campaign" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data as Campaign);
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

