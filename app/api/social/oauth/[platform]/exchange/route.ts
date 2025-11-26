import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  resolvePlatformClientId,
  resolvePlatformClientSecret,
} from "@/lib/social/oauth";
import { encryptSecret } from "@/lib/security/encryption";
import { PersonaSocialAccount } from "@/types/social";

const ExchangeSchema = z.object({
  state: z.string().min(10),
});

const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
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
    const parseResult = ExchangeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { state } = parseResult.data;

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("social_oauth_sessions")
      .select("*")
      .eq("state", state)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "OAuth session not found" },
        { status: 404 }
      );
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "OAuth session expired" },
        { status: 410 }
      );
    }

    if (!session.authorization_code) {
      return NextResponse.json(
        { error: "Authorization code not yet captured" },
        { status: 409 }
      );
    }

    const { data: platformRecord, error: platformError } = await supabase
      .from("social_platforms")
      .select("*")
      .eq("id", platformId)
      .single();

    if (platformError || !platformRecord) {
      return NextResponse.json(
        { error: "Platform not found" },
        { status: 404 }
      );
    }

    if (!platformRecord.oauth_token_url) {
      return NextResponse.json(
        { error: "Platform not configured for token exchange" },
        { status: 422 }
      );
    }

    let clientId: string;
    let clientSecret: string;
    try {
      ({ clientId } = resolvePlatformClientId(platformId));
      ({ clientSecret } = resolvePlatformClientSecret(platformId));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Missing OAuth credentials" },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch(platformRecord.oauth_token_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: session.authorization_code,
        redirect_uri: session.redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: session.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      console.error("OAuth token exchange failed:", tokenResponse.status, text);
      await supabase
        .from("social_oauth_sessions")
        .update({
          error: `token_exchange_failed:${tokenResponse.status}`,
          raw_callback: { token_response: text },
        })
        .eq("id", session.id);

      return NextResponse.json(
        { error: "Token exchange failed" },
        { status: 502 }
      );
    }

    const tokenJson = await tokenResponse.json();
    const parsedToken = TokenResponseSchema.safeParse(tokenJson);

    if (!parsedToken.success) {
      return NextResponse.json(
        { error: "Unexpected token response shape" },
        { status: 502 }
      );
    }

    const now = Date.now();
    const accessTokenExpiresAt = parsedToken.data.expires_in
      ? new Date(now + parsedToken.data.expires_in * 1000).toISOString()
      : null;

    const scopeArray = parsedToken.data.scope
      ? parsedToken.data.scope
          .split(/[ ,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : session.scopes ?? [];

    const accessTokenEncrypted = encryptSecret(parsedToken.data.access_token);
    const refreshTokenEncrypted = encryptSecret(
      parsedToken.data.refresh_token ?? ""
    );

    const { data: existingAccount } = await supabase
      .from("persona_social_accounts")
      .select("*")
      .eq("persona_id", session.persona_id)
      .eq("platform_id", platformId)
      .maybeSingle();

    const upsertPayload = {
      id: existingAccount?.id,
      persona_id: session.persona_id,
      platform_id: platformId,
      platform_account_id: existingAccount?.platform_account_id ?? null,
      display_name: existingAccount?.display_name ?? null,
      account_handle: existingAccount?.account_handle ?? null,
      profile_url: existingAccount?.profile_url ?? null,
      avatar_url: existingAccount?.avatar_url ?? null,
      token_type: parsedToken.data.token_type ?? "bearer",
      access_token_expires_at: accessTokenExpiresAt,
      refresh_token_expires_at: null,
      scopes: scopeArray,
      status: "connected",
      last_token_refresh_at: new Date(now).toISOString(),
      last_token_error: null,
      metadata: existingAccount?.metadata ?? {},
      last_synced_at: existingAccount?.last_synced_at ?? null,
      last_engagement_sync_at: existingAccount?.last_engagement_sync_at ?? null,
      revoked_at: null,
      updated_at: new Date(now).toISOString(),
    } as Record<string, unknown>;

    if (accessTokenEncrypted) {
      upsertPayload["access_token_encrypted"] = accessTokenEncrypted;
    }
    if (refreshTokenEncrypted) {
      upsertPayload["refresh_token_encrypted"] = refreshTokenEncrypted;
    }

    const { data: upsertedAccount, error: upsertError } = await supabase
      .from("persona_social_accounts")
      .upsert(upsertPayload)
      .select("*")
      .single();

    if (upsertError || !upsertedAccount) {
      console.error("Failed to upsert persona social account:", upsertError);
      return NextResponse.json(
        { error: "Failed to persist account tokens" },
        { status: 500 }
      );
    }

    await supabase
      .from("social_oauth_sessions")
      .update({
        authorization_code: null,
        error: null,
        raw_callback: tokenJson,
        processed_at: new Date(now).toISOString(),
        persona_social_account_id: upsertedAccount.id,
      })
      .eq("id", session.id);

    const responsePayload: PersonaSocialAccount = {
      id: upsertedAccount.id,
      persona_id: upsertedAccount.persona_id,
      platform_id: upsertedAccount.platform_id,
      platform_account_id: upsertedAccount.platform_account_id,
      display_name: upsertedAccount.display_name,
      account_handle: upsertedAccount.account_handle,
      profile_url: upsertedAccount.profile_url,
      avatar_url: upsertedAccount.avatar_url,
      token_type: upsertedAccount.token_type,
      access_token_expires_at: upsertedAccount.access_token_expires_at,
      refresh_token_expires_at: upsertedAccount.refresh_token_expires_at,
      scopes: upsertedAccount.scopes,
      status: upsertedAccount.status,
      last_token_refresh_at: upsertedAccount.last_token_refresh_at,
      last_token_error: upsertedAccount.last_token_error,
      metadata: upsertedAccount.metadata,
      last_synced_at: upsertedAccount.last_synced_at,
      last_engagement_sync_at: upsertedAccount.last_engagement_sync_at,
      revoked_at: upsertedAccount.revoked_at,
      created_at: upsertedAccount.created_at,
      updated_at: upsertedAccount.updated_at,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/social/oauth/[platform]/exchange:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

