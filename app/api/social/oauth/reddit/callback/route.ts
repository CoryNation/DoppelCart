import { NextRequest, NextResponse } from "next/server";

import { encryptSecret } from "@/lib/security/encryption";
import {
  getOAuthConfigForPlatform,
  getRedditClientCredentials,
  getRedditRedirectUri,
} from "@/lib/social/config";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

const REDDIT_USER_AGENT =
  process.env.REDDIT_USER_AGENT ||
  "DoppelCartApp/1.0 (+https://www.doppelcart.com)";

function resolveAbsoluteUrl(target: string, req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  return new URL(target, base).toString();
}

function buildErrorRedirect(req: NextRequest, reason?: string) {
  const params = new URLSearchParams({ source: "reddit" });
  if (reason) {
    params.set("reason", reason);
  }
  return resolveAbsoluteUrl(`/auth/error?${params.toString()}`, req);
}

function buildSuccessRedirect(
  req: NextRequest,
  personaId: string,
  redirectTo?: string | null
) {
  if (redirectTo) {
    try {
      return new URL(redirectTo).toString();
    } catch {
      return resolveAbsoluteUrl(redirectTo, req);
    }
  }

  return resolveAbsoluteUrl(`/personas/${personaId}?connected=reddit`, req);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const errorParam = searchParams.get("error");
  const stateParam = searchParams.get("state");
  const code = searchParams.get("code");

  if (errorParam) {
    console.error("Reddit OAuth returned error:", errorParam);
    return NextResponse.redirect(buildErrorRedirect(req, errorParam));
  }

  if (!stateParam || !code) {
    return NextResponse.redirect(buildErrorRedirect(req, "missing_params"));
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: oauthState, error: oauthStateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", stateParam)
      .eq("platform_id", "reddit")
      .single();

    if (oauthStateError || !oauthState) {
      console.error("Invalid or missing oauth_state for Reddit:", oauthStateError);
      return NextResponse.redirect(buildErrorRedirect(req, "invalid_state"));
    }

    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      console.error("OAuth state expired for Reddit", {
        stateId: oauthState.id,
      });
      return NextResponse.redirect(buildErrorRedirect(req, "expired_state"));
    }

    const oauthConfig = getOAuthConfigForPlatform("reddit");
    if (!oauthConfig) {
      console.error("Missing Reddit OAuth configuration");
      return NextResponse.redirect(buildErrorRedirect(req, "missing_config"));
    }

    const { clientId, clientSecret } = getRedditClientCredentials();
    const redirectUri = getRedditRedirectUri();

    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_USER_AGENT,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("Failed to exchange Reddit code for tokens", {
        status: tokenResponse.status,
        body: errorBody,
      });
      return NextResponse.redirect(buildErrorRedirect(req, "token_exchange_failed"));
    }

    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token as string | undefined;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const tokenType = (tokenJson.token_type as string | undefined) ?? "bearer";
    const expiresIn = Number(tokenJson.expires_in) || 3600;
    const scopeString = (tokenJson.scope as string | undefined) ?? "";

    if (!accessToken) {
      console.error("Reddit token payload missing access_token", tokenJson);
      return NextResponse.redirect(buildErrorRedirect(req, "token_missing"));
    }

    const meResponse = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": REDDIT_USER_AGENT,
      },
    });

    if (!meResponse.ok) {
      const meBody = await meResponse.text();
      console.error("Failed to fetch Reddit identity", {
        status: meResponse.status,
        body: meBody,
      });
      return NextResponse.redirect(buildErrorRedirect(req, "identity_failed"));
    }

    const identity = await meResponse.json();
    const username =
      typeof identity?.name === "string" ? identity.name : null;
    const providerAccountId =
      typeof identity?.id === "string"
        ? identity.id
        : username;
    const profileUrl = username
      ? `https://www.reddit.com/user/${username}`
      : null;

    const scopes = scopeString
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const accessTokenExpiresAt = new Date(now + expiresIn * 1000).toISOString();

    const accessTokenEncrypted = encryptSecret(accessToken);
    const refreshTokenEncrypted = refreshToken
      ? encryptSecret(refreshToken)
      : null;

    const { data: existingAccount } = await supabase
      .from("persona_social_accounts")
      .select("*")
      .eq("persona_id", oauthState.persona_id)
      .eq("platform_id", "reddit")
      .maybeSingle();

    const upsertPayload: Record<string, unknown> = {
      id: existingAccount?.id,
      persona_id: oauthState.persona_id,
      platform_id: "reddit",
      platform_account_id:
        providerAccountId ?? existingAccount?.platform_account_id ?? null,
      display_name: username ?? existingAccount?.display_name ?? null,
      account_handle: username ? `u/${username}` : existingAccount?.account_handle ?? null,
      profile_url: profileUrl ?? existingAccount?.profile_url ?? null,
      avatar_url: existingAccount?.avatar_url ?? null,
      token_type: tokenType,
      access_token_expires_at: accessTokenExpiresAt,
      refresh_token_expires_at: null,
      scopes: scopes.length > 0 ? scopes : existingAccount?.scopes ?? [],
      status: "connected",
      last_token_refresh_at: nowIso,
      last_token_error: null,
      metadata: existingAccount?.metadata ?? {},
      last_synced_at: existingAccount?.last_synced_at ?? null,
      last_engagement_sync_at:
        existingAccount?.last_engagement_sync_at ?? null,
      revoked_at: null,
      provider_account_id:
        providerAccountId ?? existingAccount?.provider_account_id ?? null,
      provider_username: username ?? existingAccount?.provider_username ?? null,
      last_refreshed_at: nowIso,
      updated_at: nowIso,
    };

    if (accessTokenEncrypted) {
      upsertPayload["access_token_encrypted"] = accessTokenEncrypted;
    }
    if (refreshTokenEncrypted) {
      upsertPayload["refresh_token_encrypted"] = refreshTokenEncrypted;
    }

    const { error: upsertError } = await supabase
      .from("persona_social_accounts")
      .upsert(upsertPayload);

    if (upsertError) {
      console.error("Failed to upsert Reddit persona account", upsertError);
      return NextResponse.redirect(buildErrorRedirect(req, "account_upsert_failed"));
    }

    const { error: deleteError } = await supabase
      .from("oauth_states")
      .delete()
      .eq("id", oauthState.id);

    if (deleteError) {
      console.error("Failed to delete oauth_state", deleteError);
    }

    const successRedirect = buildSuccessRedirect(
      req,
      oauthState.persona_id,
      oauthState.redirect_to
    );

    return NextResponse.redirect(successRedirect);
  } catch (error) {
    console.error("Unexpected Reddit OAuth callback error:", error);
    return NextResponse.redirect(
      buildErrorRedirect(req, "unexpected_error")
    );
  }
}






