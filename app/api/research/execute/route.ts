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

    const task = await createResearchTask({
      userId: user.id,
      title,
      description,
      clarifiedScope,
      parameters,
      messages: messages as ResearchChatMessage[],
    });

    return NextResponse.json({ researchId: task.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/research/execute:", errorMessage);
    return ApiErrors.internalServerError();
  }
}

