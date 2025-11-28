import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { generatePersonaFromCorpus } from "@/lib/openai/personaFromCorpus";

interface RequestBody {
  name?: string;
  description?: string;
  platform_hint?: string;
  csv_text: string;
  original_filename?: string;
}

// Simple CSV parser - extracts text from common columns
function parseCSVText(csvText: string): string {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return "";

  // Try to detect header row (first line)
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("text") || 
                    firstLine.includes("content") || 
                    firstLine.includes("post") || 
                    firstLine.includes("comment") ||
                    firstLine.includes("body") ||
                    firstLine.includes("title");

  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  const extractedTexts: string[] = [];

  for (const line of dataLines) {
    // Simple CSV parsing - split by comma, but handle quoted fields
    const fields = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    
    for (const field of fields) {
      // Remove quotes if present
      const cleaned = field.replace(/^"|"$/g, "").trim();
      
      // Skip if it looks like a date, number, or very short
      if (cleaned.length < 10) continue;
      if (/^\d+$/.test(cleaned)) continue;
      if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) continue;
      
      // If it looks like text content, add it
      if (cleaned.length > 20 && /[a-zA-Z]/.test(cleaned)) {
        extractedTexts.push(cleaned);
      }
    }
  }

  // Combine and limit to reasonable token size (~10-20k characters)
  const combined = extractedTexts.join(" ").trim();
  const maxLength = 20000;
  
  return combined.length > maxLength 
    ? combined.substring(0, maxLength) + "..."
    : combined;
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

    const body = (await req.json()) as RequestBody;
    const { name, description, platform_hint, csv_text, original_filename } = body;

    if (!csv_text || typeof csv_text !== "string" || csv_text.trim().length === 0) {
      return NextResponse.json(
        { error: "csv_text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Parse and extract text from CSV
    const corpusSummary = parseCSVText(csv_text);

    if (corpusSummary.trim().length < 100) {
      return NextResponse.json(
        { error: "CSV does not contain enough text content. Please ensure your CSV has text columns with substantial content." },
        { status: 400 }
      );
    }

    // Generate persona from corpus
    const result = await generatePersonaFromCorpus({
      userDescription: description,
      corpusSummary,
      mode: "digital_twin_csv",
    });

    const personaDraft = result.personaDraft;

    // Create agent first (following existing pattern)
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .insert({
        user_id: user.id,
        name: name || personaDraft.name,
        primary_goal: personaDraft.goals[0] || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (agentError) {
      console.error("Error creating agent:", agentError);
      return NextResponse.json(
        { error: "Failed to create agent" },
        { status: 500 }
      );
    }

    const agentId = agentData.id;

    // Map personaDraft to PersonaState structure
    const personaState = {
      display_name: personaDraft.name,
      avatar_prompt: `A social media persona: ${personaDraft.tagline}`,
      stats: {
        charisma: 50,
        logic: 50,
        humor: 50,
        warmth: 50,
        edge: 50,
        creativity: 50,
      },
      goals: personaDraft.goals,
      demographics: {},
      personality: {
        tone: personaDraft.tone,
        bigFive: {},
      },
      biography: personaDraft.bio,
    };

    // Insert persona
    const { data: personaData, error: personaError } = await supabase
      .from("personas")
      .insert({
        user_id: user.id,
        agent_id: agentId,
        display_name: personaDraft.name,
        avatar_prompt: personaState.avatar_prompt,
        stats: personaState.stats,
        goals: personaDraft.goals,
        demographics: personaState.demographics,
        personality: personaState.personality,
        biography: personaDraft.bio,
        raw_definition: personaState,
        origin_type: "digital_twin_csv",
        origin_metadata: {
          source_type: "csv_post_history",
          platform_hint: platform_hint || null,
          row_count: csv_text.split(/\r?\n/).length,
          corpus_length: corpusSummary.length,
        },
      })
      .select("*, agent_id")
      .single();

    if (personaError || !personaData) {
      console.error("Error creating persona:", personaError);
      // Cleanup agent if persona creation fails
      await supabase.from("agents").delete().eq("id", agentId);
      return NextResponse.json(
        { error: "Failed to create persona record" },
        { status: 500 }
      );
    }

    // Optionally insert persona_source
    const sourceSummary = `CSV import with ${csv_text.split(/\r?\n/).length} rows, extracted ${corpusSummary.length} characters of text content`;
    
    await supabase.from("persona_sources").insert({
      persona_id: personaData.id,
      source_type: "csv_post_history",
      storage_path: null, // For now, we don't store the file
      original_filename: original_filename || null,
      source_summary: sourceSummary,
    });

    return NextResponse.json(personaData);
  } catch (error: unknown) {
    console.error("Error in from-csv API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

