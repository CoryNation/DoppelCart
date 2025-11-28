import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getOAuthConfigForPlatform, getRedditRedirectUri, getRedditClientCredentials } from "@/lib/social/config";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

function buildRedirectTo(personaId: string, explicit?: string | null) {
  if (explicit) {
    return explicit;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return null;
  }

  const base = appUrl.replace(/\/+$/, "");
  return `${base}/personas/${personaId}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const personaId = req.nextUrl.searchParams.get("personaId");

    if (!personaId) {
      return NextResponse.json(
        { error: "Missing personaId" },
        { status: 400 }
      );
    }

    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .select("id, user_id")
      .eq("id", personaId)
      .single();

    if (personaError || !persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    if (persona.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const state = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const redirectParam = req.nextUrl.searchParams.get("redirectTo");
    const redirectTo = buildRedirectTo(personaId, redirectParam);

    const { error: insertError } = await supabase.from("oauth_states").insert({
      user_id: user.id,
      persona_id: personaId,
      platform_id: "reddit",
      state,
      redirect_to: redirectTo,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to persist oauth state", insertError);
      return NextResponse.json(
        { error: "Failed to initialize OAuth flow" },
        { status: 500 }
      );
    }

    const oauthConfig = getOAuthConfigForPlatform("reddit");
    if (!oauthConfig) {
      return NextResponse.json(
        { error: "Reddit OAuth is not configured" },
        { status: 500 }
      );
    }

    const { clientId } = getRedditClientCredentials();
    const redirectUri = getRedditRedirectUri();

    const authorizeUrl = new URL(oauthConfig.authorizeUrl);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("duration", "permanent");
    authorizeUrl.searchParams.set("scope", oauthConfig.scopes.join(" "));

    return NextResponse.json({ url: authorizeUrl.toString() });
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/social/oauth/reddit/start",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}







