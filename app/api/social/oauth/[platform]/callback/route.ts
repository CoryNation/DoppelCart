import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/serviceClient";

interface RouteContext {
  params: { platform: string };
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const code = searchParams.get("code");
    const errorCode = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (!state) {
      return NextResponse.json(
        { error: "Missing OAuth state parameter" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("social_oauth_sessions")
      .select("*")
      .eq("state", state)
      .single();

    if (sessionError || !session) {
      console.error("OAuth callback session lookup failed:", sessionError);
      return NextResponse.json(
        { error: "OAuth session not found" },
        { status: 404 }
      );
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "OAuth session has expired" },
        { status: 410 }
      );
    }

    if (!code && !errorCode) {
      return NextResponse.json(
        { error: "Missing authorization code or error in callback" },
        { status: 400 }
      );
    }

    const callbackPayload = Object.fromEntries(searchParams.entries());

    await supabase
      .from("social_oauth_sessions")
      .update({
        authorization_code: code ?? null,
        error: errorCode || errorDescription || null,
        raw_callback: callbackPayload,
        processed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    let redirectUrl: URL;
    try {
      redirectUrl = new URL(session.redirect_uri);
    } catch {
      return NextResponse.json(
        { error: "Invalid redirect URI stored for session" },
        { status: 500 }
      );
    }

    redirectUrl.searchParams.set("platform", context.params.platform);
    redirectUrl.searchParams.set("state", state);

    if (errorCode || errorDescription) {
      redirectUrl.searchParams.set("oauth_status", "error");
      redirectUrl.searchParams.set("oauth_error", errorCode ?? "unknown_error");
      if (errorDescription) {
        redirectUrl.searchParams.set(
          "oauth_error_description",
          errorDescription
        );
      }
    } else {
      redirectUrl.searchParams.set("oauth_status", "code_saved");
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/social/oauth/[platform]/callback:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

