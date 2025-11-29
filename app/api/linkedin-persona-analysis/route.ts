import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { callChatModel } from "@/lib/openai";
import { LinkedInAnalysisResult } from "@/types/linkedin-analysis";

interface RequestBody {
  title: string;
  description?: string;
  csv_text: string;
  original_filename?: string;
}

// Parse CSV and extract text content from LinkedIn data
function parseLinkedInCSV(csvText: string): string {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return "";

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("text") || 
                    firstLine.includes("content") || 
                    firstLine.includes("post") || 
                    firstLine.includes("comment");

  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  // Find text column index
  const headerFields = hasHeader 
    ? lines[0].split(',').map(f => f.replace(/^"|"$/g, '').toLowerCase().trim())
    : [];
  
  const textColumnIndex = headerFields.findIndex(h => 
    h.includes('text') || h.includes('content') || h.includes('post') || h.includes('comment')
  );

  const extractedTexts: string[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Parse CSV line (handle quoted fields)
    const fields = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    
    if (textColumnIndex >= 0 && fields[textColumnIndex]) {
      const text = fields[textColumnIndex].replace(/^"|"$/g, "").trim();
      if (text.length > 20) {
        extractedTexts.push(text);
      }
    } else {
      // Fallback: find longest text field
      for (const field of fields) {
        const cleaned = field.replace(/^"|"$/g, "").trim();
        if (cleaned.length > 50 && /[a-zA-Z]/.test(cleaned)) {
          extractedTexts.push(cleaned);
          break; // Take first substantial text field
        }
      }
    }
  }

  // Combine and limit to reasonable token size
  const combined = extractedTexts.join("\n\n").trim();
  const maxLength = 30000; // Increased for more context
  
  return combined.length > maxLength 
    ? combined.substring(0, maxLength) + "..."
    : combined;
}

const LINKEDIN_ANALYSIS_SYSTEM_PROMPT = `You are a LinkedIn Persona Analyst specializing in understanding people's professional identity, motivations, and values based on their LinkedIn activity.

Your task is to analyze LinkedIn posts and comments to extract deep insights about a person's:
1. Core drivers and motivations (both intrinsic and extrinsic)
2. Cultivated persona (how they want to be seen)
3. Definition of success (what a "win" looks like for them)
4. Guiding values (principles that guide their decisions)
5. Key interests, passions, and areas they're seeking growth

You must output ONLY a JSON object matching this exact structure:
{
  "core_drivers": {
    "intrinsic": ["string"] - 3-5 internal motivators (e.g., "autonomy", "mastery", "purpose"),
    "extrinsic": ["string"] - 3-5 external motivators (e.g., "recognition", "financial success", "status")
  },
  "cultivated_persona": "string - 2-3 sentences describing how they want to be perceived professionally",
  "definition_of_success": "string - 2-3 sentences describing what success means to them based on their content",
  "guiding_values": ["string"] - 5-8 core values/principles evident in their content,
  "interests_and_growth": {
    "key_interests": ["string"] - 5-7 main topics/domains they engage with,
    "passions": ["string"] - 3-5 things they're deeply passionate about,
    "growth_areas": ["string"] - 3-5 areas where they're seeking development or learning
  }
}

Guidelines:
- Base insights ONLY on patterns you can observe in the provided content
- Look for recurring themes, language patterns, and topics
- Infer motivations from what they celebrate, complain about, or focus on
- Identify values from what they advocate for or stand against
- Be specific and evidence-based, not generic
- Use professional but insightful language

Return JSON ONLY. No markdown, no commentary, no extra text.`;

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
    const { title, description, csv_text } = body;

    if (!csv_text || typeof csv_text !== "string" || csv_text.trim().length === 0) {
      return NextResponse.json(
        { error: "csv_text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Parse and extract text from CSV
    const contentSummary = parseLinkedInCSV(csv_text);

    if (contentSummary.trim().length < 200) {
      return NextResponse.json(
        { error: "CSV does not contain enough text content. Please ensure your CSV has substantial text data from LinkedIn posts/comments." },
        { status: 400 }
      );
    }

    // Build user message with context
    let userMessage = `Analyze the following LinkedIn activity data to extract persona insights.\n\n`;
    
    if (description) {
      userMessage += `Analysis Context: ${description}\n\n`;
    }
    
    userMessage += `LinkedIn Activity Data:\n${contentSummary}`;

    const messages = [
      { role: "system" as const, content: LINKEDIN_ANALYSIS_SYSTEM_PROMPT },
      { role: "user" as const, content: userMessage },
    ];

    // Call OpenAI with GPT-4o-mini for cost efficiency
    const responseContent = await callChatModel({
      messages,
      model: "gpt-4o-mini",
      temperature: 0.7,
      responseFormatType: "json_object",
    });

    let analysis: unknown;
    try {
      analysis = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("JSON parse error from LinkedIn analysis:", parseError);
      return NextResponse.json(
        { error: "Failed to parse analysis response. Please try again." },
        { status: 500 }
      );
    }

    // Validate structure
    const analysisObj = analysis as Record<string, unknown>;
    const requiredKeys = [
      "core_drivers",
      "cultivated_persona",
      "definition_of_success",
      "guiding_values",
      "interests_and_growth",
    ];

    for (const key of requiredKeys) {
      if (!(key in analysisObj)) {
        console.error(`Missing required key in analysis: ${key}`);
        return NextResponse.json(
          { error: `Received incomplete analysis. Missing: ${key}` },
          { status: 500 }
        );
      }
    }

    // Validate nested structure
    const coreDrivers = analysisObj.core_drivers as Record<string, unknown>;
    if (!Array.isArray(coreDrivers.intrinsic) || !Array.isArray(coreDrivers.extrinsic)) {
      return NextResponse.json(
        { error: "Invalid core_drivers structure" },
        { status: 500 }
      );
    }

    const interestsAndGrowth = analysisObj.interests_and_growth as Record<string, unknown>;
    if (
      !Array.isArray(interestsAndGrowth.key_interests) ||
      !Array.isArray(interestsAndGrowth.passions) ||
      !Array.isArray(interestsAndGrowth.growth_areas)
    ) {
      return NextResponse.json(
        { error: "Invalid interests_and_growth structure" },
        { status: 500 }
      );
    }

    // Validate remaining required fields
    if (
      typeof analysisObj.cultivated_persona !== "string" ||
      typeof analysisObj.definition_of_success !== "string" ||
      !Array.isArray(analysisObj.guiding_values)
    ) {
      return NextResponse.json(
        { error: "Invalid analysis structure - missing required fields" },
        { status: 500 }
      );
    }

    // Construct properly typed analysis result
    const typedAnalysisResult: LinkedInAnalysisResult = {
      core_drivers: {
        intrinsic: coreDrivers.intrinsic as string[],
        extrinsic: coreDrivers.extrinsic as string[],
      },
      cultivated_persona: analysisObj.cultivated_persona as string,
      definition_of_success: analysisObj.definition_of_success as string,
      guiding_values: analysisObj.guiding_values as string[],
      interests_and_growth: {
        key_interests: interestsAndGrowth.key_interests as string[],
        passions: interestsAndGrowth.passions as string[],
        growth_areas: interestsAndGrowth.growth_areas as string[],
      },
    };

    // Store the analysis in the database
    const csvMetadata = {
      original_filename: body.original_filename || null,
      row_count: csv_text.split(/\r?\n/).length,
      content_length: contentSummary.length,
    };

    const { data: analysisData, error: dbError } = await supabase
      .from("linkedin_persona_analysis")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        analysis_result: typedAnalysisResult,
        csv_metadata: csvMetadata,
      })
      .select("id, created_at")
      .single();

    if (dbError) {
      console.error("Error saving LinkedIn analysis to database:", dbError);
      // Still return the analysis even if DB save fails
      return NextResponse.json({
        analysis: typedAnalysisResult,
        metadata: {
          title,
          description: description || null,
          content_length: contentSummary.length,
          row_count: csv_text.split(/\r?\n/).length,
        },
        saved: false,
        error: "Analysis completed but failed to save to database",
      });
    }

    return NextResponse.json({
      analysis: typedAnalysisResult,
      analysis_id: analysisData.id,
      metadata: {
        title,
        description: description || null,
        content_length: contentSummary.length,
        row_count: csv_text.split(/\r?\n/).length,
      },
      saved: true,
    });
  } catch (error: unknown) {
    console.error("Error in LinkedIn persona analysis API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

