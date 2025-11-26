import { createSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import {
  resolvePlatformClientId,
  resolvePlatformClientSecret,
} from "@/lib/social/oauth";
import type { PersonaSocialAccount } from "@/types/social";

function byteaToBuffer(value: string | null): Buffer | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("\\x")) {
    return Buffer.from(value, "base64");
  }

  return Buffer.from(value.slice(2), "hex");
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return true;
  }

  const expires = new Date(expiresAt);
  const now = new Date();
  // Refresh if token expires within 5 minutes
  return expires.getTime() - now.getTime() < 5 * 60 * 1000;
}

export interface RedditPostInput {
  personaSocialAccount: PersonaSocialAccount;
  subreddit: string;
  title: string;
  text: string;
}

/**
 * Refreshes a Reddit access token if it's expired or about to expire.
 * Returns the updated account if a refresh occurred, null otherwise.
 */
export async function refreshRedditTokenIfNeeded(
  account: PersonaSocialAccount
): Promise<PersonaSocialAccount | null> {
  if (!isTokenExpired(account.access_token_expires_at)) {
    return null;
  }

  const supabase = createSupabaseServiceClient();

  // Fetch the full account record with encrypted tokens
  const { data: fullAccount, error: fetchError } = await supabase
    .from("persona_social_accounts")
    .select("*")
    .eq("id", account.id)
    .single();

  if (fetchError || !fullAccount) {
    throw new Error("Failed to fetch account for token refresh");
  }

  // Check if refresh token exists (encrypted fields are not in the public type)
  const refreshTokenEncrypted = (fullAccount as unknown as { refresh_token_encrypted: string | null }).refresh_token_encrypted;
  if (!refreshTokenEncrypted) {
    throw new Error("No refresh token available for Reddit account");
  }

  const refreshToken = decryptSecret(
    byteaToBuffer(refreshTokenEncrypted as unknown as string)
  );

  if (!refreshToken) {
    throw new Error("Unable to decrypt refresh token");
  }

  const { clientId } = resolvePlatformClientId("reddit");
  const { clientSecret } = resolvePlatformClientSecret("reddit");

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    console.error("Reddit token refresh failed:", response.status, payload);
    throw new Error("Failed to refresh Reddit access token");
  }

  const json = await response.json();
  const accessToken = json.access_token as string | undefined;
  const expiresIn = json.expires_in as number | undefined;
  const newRefreshToken =
    (json.refresh_token as string | undefined) || refreshToken;

  if (!accessToken) {
    throw new Error("Reddit refresh response missing access token");
  }

  const now = Date.now();
  const accessTokenEncrypted = encryptSecret(accessToken);
  const refreshTokenEncrypted = encryptSecret(newRefreshToken);

  const updatePayload = {
    access_token_encrypted: accessTokenEncrypted,
    refresh_token_encrypted: refreshTokenEncrypted,
    access_token_expires_at: expiresIn
      ? new Date(now + expiresIn * 1000).toISOString()
      : fullAccount.access_token_expires_at,
    last_token_refresh_at: new Date(now).toISOString(),
    last_token_error: null,
  };

  const { data: updatedAccount, error: updateError } = await supabase
    .from("persona_social_accounts")
    .update(updatePayload)
    .eq("id", account.id)
    .select("*")
    .single();

  if (updateError || !updatedAccount) {
    console.error("Failed to update account after token refresh:", updateError);
    throw new Error("Failed to store refreshed tokens");
  }

  return updatedAccount as PersonaSocialAccount;
}

/**
 * Submits a text post to Reddit.
 * Returns the external ID and URL of the created post.
 */
export async function submitRedditTextPost(
  input: RedditPostInput
): Promise<{
  externalId: string;
  url: string;
}> {
  const { personaSocialAccount, subreddit, title, text } = input;

  // Refresh token if needed (this already persists to DB)
  const updatedAccount = await refreshRedditTokenIfNeeded(personaSocialAccount);
  const account = updatedAccount || personaSocialAccount;

  // Get decrypted access token from the account we have
  // If we refreshed, use the updated account; otherwise fetch fresh
  const supabase = createSupabaseServiceClient();
  const { data: fullAccount, error: accountError } = await supabase
    .from("persona_social_accounts")
    .select("access_token_encrypted")
    .eq("id", account.id)
    .single();

  if (accountError || !fullAccount) {
    throw new Error("Failed to fetch account access token");
  }

  const accessToken = decryptSecret(
    byteaToBuffer(fullAccount.access_token_encrypted as unknown as string)
  );

  if (!accessToken) {
    throw new Error("Unable to decrypt access token");
  }

  // Submit post to Reddit
  const response = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "DoppelCart/1.0",
    },
    body: new URLSearchParams({
      kind: "self",
      sr: subreddit,
      title: title,
      text: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to submit post to Reddit";
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage = `Reddit API error: ${errorJson.error}`;
      }
    } catch {
      // If parsing fails, use generic message
    }
    console.error("Reddit post submission failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText.substring(0, 200), // Truncate for logging
    });
    throw new Error(errorMessage);
  }

  const json = await response.json();
  const postId = json?.json?.data?.id as string | undefined;
  const permalink = json?.json?.data?.permalink as string | undefined;

  if (!postId || !permalink) {
    console.error("Reddit response missing post data:", json);
    throw new Error("Reddit response missing post ID or permalink");
  }

  const postUrl = permalink.startsWith("http")
    ? permalink
    : `https://reddit.com${permalink}`;

  return {
    externalId: postId,
    url: postUrl,
  };
}

