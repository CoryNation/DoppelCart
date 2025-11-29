import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { createResearchTask, type ResearchChatMessage } from "@/lib/research";
import { ApiErrors } from "@/lib/utils/api-errors";

interface ExecuteRequestBody {
  title: string;
  description: string;
  clarifiedScope: string;
  parameters: Record<string, unknown>;
  messages: { role: string; content: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await req.json() as ExecuteRequestBody;
    const { title, description, clarifiedScope, parameters, messages } = body;

    // Input validation with length limits
    if (!title || typeof title !== "string" || !title.trim()) {
      return ApiErrors.badRequest("Title is required and must be a non-empty string");
    }

    if (title.length > 200) {
      return ApiErrors.badRequest("Title must be 200 characters or less");
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: "Description must be 5000 characters or less" },
        { status: 400 }
      );
    }

    if (!clarifiedScope || typeof clarifiedScope !== "string" || !clarifiedScope.trim()) {
      return NextResponse.json(
        { error: "clarifiedScope is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (clarifiedScope.length > 10000) {
      return NextResponse.json(
        { error: "clarifiedScope must be 10000 characters or less" },
        { status: 400 }
      );
    }

    if (!parameters || typeof parameters !== "object" || parameters === null) {
      return NextResponse.json(
        { error: "parameters is required and must be an object" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages is required and must be an array" },
        { status: 400 }
      );
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: "messages array must contain 50 items or fewer" },
        { status: 400 }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return NextResponse.json(
          { error: "Each message must be an object" },
          { status: 400 }
        );
      }
      if (typeof msg.role !== "string" || !["system", "assistant", "user"].includes(msg.role)) {
        return NextResponse.json(
          { error: "Each message must have a valid role (system, assistant, or user)" },
          { status: 400 }
        );
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json(
          { error: "Each message must have a string content field" },
          { status: 400 }
        );
      }
      if (msg.content.length > 10000) {
        return NextResponse.json(
          { error: "Each message content must be 10000 characters or less" },
          { status: 400 }
        );
      }
    }

    // Create research task in research_tasks table
    const task = await createResearchTask({
      userId: user.id,
      title,
      description,
      clarifiedScope,
      parameters,
      messages: messages as ResearchChatMessage[],
    });

    // Also create a record in resonance_research table so it shows up on the main page
    // Use the clarifiedScope as the initial_prompt, and store the full context in input_context
    const initialPrompt = `Clarified Scope:\n${clarifiedScope}\n\nOriginal Description:\n${description}`;
    
    const { error: resonanceError } = await supabase
      .from("resonance_research")
      .insert({
        user_id: user.id,
        title,
        initial_prompt: initialPrompt,
        input_context: {
          description,
          clarifiedScope,
          parameters,
          messages,
          researchTaskId: task.id, // Link to research_tasks table
        },
        status: "running",
      })
      .select()
      .single();

    if (resonanceError) {
      console.error("Error creating resonance_research record:", resonanceError);
      // Don't fail the request - the research task was created successfully
      // Just log the error and continue with the task.id
    }

    // Return the research_tasks id (task.id) as researchId
    // The resonance_research record is linked via input_context.researchTaskId
    return NextResponse.json({ researchId: task.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/research/execute:", errorMessage);
    return ApiErrors.internalServerError();
  }
}

