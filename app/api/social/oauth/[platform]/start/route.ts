import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  enforceRedirectUri,
  generateOAuthState,
  generatePkcePair,
  resolvePlatformClientId,
} from "@/lib/social/oauth";

const StartRequestSchema = z.object({
  personaId: z.string().uuid(),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).optional(),
});

interface RouteContext {
  params: { platform: string };
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const platformId = context.params.platform?.toLowerCase();

    if (!platformId) {
      return NextResponse.json({ error: "Missing platform" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = StartRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { personaId, redirectUri, scopes: requestedScopes } =
      parseResult.data;

    const safeRedirectUri = enforceRedirectUri(redirectUri);

    const { data: personaRecord, error: personaError } = await supabase
      .from("personas")
      .select("id, user_id")
      .eq("id", personaId)
      .single();

    if (personaError || !personaRecord) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    if (personaRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: platformRecord, error: platformError } = await supabase
      .from("social_platforms")
      .select("*")
      .eq("id", platformId)
      .maybeSingle();

    if (platformError) {
      console.error("Error fetching social platform:", platformError);
      return NextResponse.json(
        { error: "Failed to load platform configuration" },
        { status: 500 }
      );
    }

    if (!platformRecord) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    if (!platformRecord.oauth_authorize_url) {
      return NextResponse.json(
        { error: "Platform is not configured for OAuth" },
        { status: 422 }
      );
    }

    const platformScopes =
      requestedScopes && requestedScopes.length > 0
        ? requestedScopes
        : platformRecord.default_scopes ?? [];

    let authorizeUrl: URL;
    try {
      authorizeUrl = new URL(platformRecord.oauth_authorize_url);
    } catch {
      return NextResponse.json(
        { error: "Invalid platform authorization URL" },
        { status: 500 }
      );
    }

    let clientId: string;
    try {
      ({ clientId } = resolvePlatformClientId(platformId));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Missing OAuth client configuration" },
        { status: 500 }
      );
    }

    const { codeVerifier, codeChallenge, codeChallengeMethod } =
      generatePkcePair();
    const state = generateOAuthState();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: session, error: sessionError } = await supabase
      .from("social_oauth_sessions")
      .insert({
        user_id: user.id,
        persona_id: personaId,
        platform_id: platformId,
        redirect_uri: safeRedirectUri,
        state,
        code_verifier: codeVerifier,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        scopes: platformScopes,
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (sessionError || !session) {
      console.error("Error creating OAuth session:", sessionError);
      return NextResponse.json(
        { error: "Failed to initialize OAuth session" },
        { status: 500 }
      );
    }

    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", safeRedirectUri);
    authorizeUrl.searchParams.set("scope", platformScopes.join(" "));
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set(
      "code_challenge_method",
      codeChallengeMethod
    );

    return NextResponse.json({
      session_id: session.id,
      platform_id: platformRecord.id,
      persona_id: session.persona_id,
      authorize_url: authorizeUrl.toString(),
      state,
      expires_at: session.expires_at,
      scopes: session.scopes,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/social/oauth/[platform]/start:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

