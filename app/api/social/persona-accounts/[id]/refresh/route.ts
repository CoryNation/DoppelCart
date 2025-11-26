import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  resolvePlatformClientId,
  resolvePlatformClientSecret,
} from "@/lib/social/oauth";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

interface RouteContext {
  params: { id: string };
}

function byteaToBuffer(value: string | null): Buffer | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("\\x")) {
    return Buffer.from(value, "base64");
  }

  return Buffer.from(value.slice(2), "hex");
}

export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = context.params.id;

    const { data: account, error: accountError } = await supabase
      .from("persona_social_accounts")
      .select(
        `
        *,
        personas!inner (
          user_id
        )
      `
      )
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    if (account.personas.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!account.refresh_token_encrypted) {
      return NextResponse.json(
        { error: "Account does not have a refresh token" },
        { status: 422 }
      );
    }

    const refreshToken = decryptSecret(
      byteaToBuffer(account.refresh_token_encrypted)
    );

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Unable to decrypt refresh token" },
        { status: 500 }
      );
    }

    const { data: platformRecord, error: platformError } = await supabase
      .from("social_platforms")
      .select("*")
      .eq("id", account.platform_id)
      .single();

    if (platformError || !platformRecord) {
      return NextResponse.json(
        { error: "Platform not found" },
        { status: 404 }
      );
    }

    if (!platformRecord.oauth_token_url) {
      return NextResponse.json(
        { error: "Platform does not support OAuth token refresh" },
        { status: 422 }
      );
    }

    let clientId: string;
    let clientSecret: string;
    try {
      ({ clientId } = resolvePlatformClientId(account.platform_id));
      ({ clientSecret } = resolvePlatformClientSecret(account.platform_id));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Missing OAuth credentials" },
        { status: 500 }
      );
    }

    const response = await fetch(platformRecord.oauth_token_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      console.error(
        "Refresh token request failed:",
        response.status,
        payload
      );

      await supabase
        .from("persona_social_accounts")
        .update({
          last_token_error: `refresh_failed:${response.status}`,
        })
        .eq("id", accountId);

      return NextResponse.json(
        { error: "Failed to refresh access token" },
        { status: 502 }
      );
    }

    const json = await response.json();
    const now = Date.now();
    const accessToken = json.access_token as string | undefined;
    const expiresIn = json.expires_in as number | undefined;
    const newRefreshToken =
      (json.refresh_token as string | undefined) || refreshToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Provider response missing access token" },
        { status: 502 }
      );
    }

    const accessTokenEncrypted = encryptSecret(accessToken);
    const refreshTokenEncrypted = encryptSecret(newRefreshToken);

    const updatePayload = {
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      access_token_expires_at: expiresIn
        ? new Date(now + expiresIn * 1000).toISOString()
        : account.access_token_expires_at,
      last_token_refresh_at: new Date(now).toISOString(),
      last_token_error: null,
    };

    const { data: updatedAccount, error: updateError } = await supabase
      .from("persona_social_accounts")
      .update(updatePayload)
      .eq("id", accountId)
      .select("*")
      .single();

    if (updateError || !updatedAccount) {
      console.error("Failed to update social account after refresh:", updateError);
      return NextResponse.json(
        { error: "Failed to store refreshed tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedAccount.id,
      status: updatedAccount.status,
      access_token_expires_at: updatedAccount.access_token_expires_at,
      last_token_refresh_at: updatedAccount.last_token_refresh_at,
    });
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/social/persona-accounts/[id]/refresh:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

