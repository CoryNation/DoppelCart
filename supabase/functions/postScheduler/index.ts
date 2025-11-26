import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const redditClientId = Deno.env.get("SOCIAL_REDDIT_CLIENT_ID");
const redditClientSecret = Deno.env.get("SOCIAL_REDDIT_CLIENT_SECRET");
const encryptionKey = Deno.env.get("SOCIAL_OAUTH_ENCRYPTION_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment configuration.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

// Encryption/decryption helpers for Deno
function byteaToBuffer(value: string | null): Uint8Array | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("\\x")) {
    const hex = value.slice(2);
    return new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
  }

  // Base64 decode
  const binaryString = atob(value);
  return new Uint8Array(
    binaryString.split("").map((char) => char.charCodeAt(0))
  );
}

/**
 * Encrypts a secret using AES-256-GCM.
 * Format: [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext]
 */
async function encryptSecret(plaintext: string): Promise<Uint8Array | null> {
  if (!plaintext || !encryptionKey) {
    return null;
  }

  const keyBytes = Uint8Array.from(atob(encryptionKey), (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) {
    throw new Error("Invalid encryption key length");
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    },
    key,
    plaintextBytes
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);

  // Format: [IV (12)][AuthTag (16)][Ciphertext]
  const result = new Uint8Array(12 + 16 + ciphertext.length);
  result.set(iv, 0);
  result.set(authTag, 12);
  result.set(ciphertext, 28);

  return result;
}

/**
 * Decrypts a secret using AES-256-GCM.
 * Format: [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext]
 */
async function decryptSecret(payload: Uint8Array | null): Promise<string | null> {
  if (!payload || !encryptionKey) {
    return null;
  }

  if (payload.length < 12 + 16) {
    throw new Error("Invalid encrypted payload");
  }

  const keyBytes = Uint8Array.from(atob(encryptionKey), (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) {
    throw new Error("Invalid encryption key length");
  }

  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Combine ciphertext and auth tag for decryption
  const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
  encryptedData.set(ciphertext, 0);
  encryptedData.set(authTag, ciphertext.length);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
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

/**
 * Sanitizes a subreddit name (removes r/ prefix, validates format).
 */
function sanitizeSubreddit(subreddit: string | null | undefined): string | null {
  if (!subreddit) {
    return null;
  }

  let sanitized = subreddit.trim().replace(/^r\//i, "");
  sanitized = sanitized.replace(/^\/+|\/+$/g, "");

  if (!/^[a-zA-Z0-9_-]{3,21}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validates Reddit content length.
 */
function validateRedditContent(
  title: string,
  text: string
): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }
  if (title.length > 300) {
    return {
      valid: false,
      error: `Title exceeds 300 character limit (${title.length} chars)`,
    };
  }
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Text content is required" };
  }
  if (text.length > 40000) {
    return {
      valid: false,
      error: `Text exceeds 40,000 character limit (${text.length} chars)`,
    };
  }
  return { valid: true };
}

async function refreshRedditToken(
  account: any
): Promise<{ accessToken: string; expiresAt: string | null; newRefreshToken?: string } | null> {
  if (!isTokenExpired(account.access_token_expires_at)) {
    const accessToken = await decryptSecret(
      byteaToBuffer(account.access_token_encrypted as unknown as string)
    );
    if (accessToken) {
      return { accessToken, expiresAt: account.access_token_expires_at };
    }
  }

  if (!account.refresh_token_encrypted) {
    return null;
  }

  const refreshToken = await decryptSecret(
    byteaToBuffer(account.refresh_token_encrypted as unknown as string)
  );

  if (!refreshToken || !redditClientId || !redditClientSecret) {
    return null;
  }

  const credentials = btoa(`${redditClientId}:${redditClientSecret}`);

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    console.error("Reddit token refresh failed:", response.status, payload);
    return null;
  }

  const json = await response.json();
  const accessToken = json.access_token as string | undefined;
  const expiresIn = json.expires_in as number | undefined;
  const newRefreshToken =
    (json.refresh_token as string | undefined) || refreshToken;

  if (!accessToken) {
    return null;
  }

  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  // Encrypt and persist tokens
  const accessTokenEncrypted = await encryptSecret(accessToken);
  const refreshTokenEncrypted = await encryptSecret(newRefreshToken);

  if (!accessTokenEncrypted || !refreshTokenEncrypted) {
    console.error("Failed to encrypt tokens after refresh");
    return null;
  }

  // Convert Uint8Array to format Supabase expects (hex string with \x prefix)
  const accessTokenHex = "\\x" + Array.from(accessTokenEncrypted)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const refreshTokenHex = "\\x" + Array.from(refreshTokenEncrypted)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Update the account in database with encrypted tokens
  const { error: updateError } = await supabase
    .from("persona_social_accounts")
    .update({
      access_token_encrypted: accessTokenHex,
      refresh_token_encrypted: refreshTokenHex,
      access_token_expires_at: expiresAt,
      last_token_refresh_at: new Date().toISOString(),
      last_token_error: null,
    })
    .eq("id", account.id);

  if (updateError) {
    console.error("Failed to update account after token refresh:", updateError);
    return null;
  }

  return { accessToken, expiresAt, newRefreshToken };
}

async function submitRedditPost(
  accessToken: string,
  subreddit: string,
  title: string,
  text: string
): Promise<{ externalId: string; url: string }> {
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
      error: errorText.substring(0, 200),
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

/**
 * Finds the appropriate Reddit account for a campaign post.
 * Prefers persona_social_account_id if set, otherwise finds by persona_id.
 */
async function findRedditAccountForPost(post: any): Promise<any | null> {
  // If persona_social_account_id is set, use that directly
  if (post.persona_social_account_id) {
    const { data: account, error } = await supabase
      .from("persona_social_accounts")
      .select("*")
      .eq("id", post.persona_social_account_id)
      .eq("platform_id", "reddit")
      .eq("status", "connected")
      .single();

    if (error || !account) {
      return null;
    }

    return account;
  }

  // Otherwise, find by persona_id
  const { data: accounts, error } = await supabase
    .from("persona_social_accounts")
    .select("*")
    .eq("persona_id", post.persona_id)
    .eq("platform_id", "reddit")
    .eq("status", "connected");

  if (error || !accounts || accounts.length === 0) {
    return null;
  }

  // If multiple accounts, prefer the most recently used one
  const sortedAccounts = accounts.sort((a, b) => {
    const aTime = a.last_token_refresh_at || a.created_at;
    const bTime = b.last_token_refresh_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return sortedAccounts[0];
}

Deno.serve(async () => {
  const nowIso = new Date().toISOString();

  try {
    // Fetch scheduled posts with explicit user ownership verification via join
    const { data: scheduledPosts, error } = await supabase
      .from("campaign_posts")
      .select(
        `
        *,
        campaigns!inner (
          id,
          user_id
        )
      `
      )
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .not("campaigns.user_id", "is", null);

    if (error) {
      console.error("Failed to fetch scheduled posts", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch scheduled posts" }),
        { status: 500 }
      );
    }

    const processed: string[] = [];
    const failed: string[] = [];

    for (const post of scheduledPosts ?? []) {
      try {
        // Only attempt real posting for Reddit
        if (post.platform_id === "reddit") {
          // Find the Reddit account using improved logic
          const account = await findRedditAccountForPost(post);

          if (!account) {
            await supabase
              .from("campaign_posts")
              .update({
                status: "failed",
                last_attempt_at: nowIso,
                last_error: "No connected Reddit account for persona",
              })
              .eq("id", post.id);

            failed.push(post.id);
            console.log(
              `No Reddit account found for post ${post.id}, marking as failed`
            );
            continue;
          }

          // Refresh token if needed and get access token
          const tokenResult = await refreshRedditToken(account);
          if (!tokenResult) {
            await supabase
              .from("campaign_posts")
              .update({
                status: "failed",
                last_attempt_at: nowIso,
                last_error: "Failed to obtain valid Reddit access token",
              })
              .eq("id", post.id);

            failed.push(post.id);
            console.error(
              `Failed to get Reddit token for post ${post.id}`
            );
            continue;
          }

          // Extract and sanitize subreddit
          const platformOptions = (post.platform_options as Record<string, unknown>) || {};
          const contentJson = (post.content_json as Record<string, unknown>) || {};
          const subredditRaw =
            (platformOptions.subreddit as string) ||
            (platformOptions.sr as string) ||
            (contentJson.subreddit as string) ||
            null;

          const subreddit = sanitizeSubreddit(subredditRaw);

          if (!subreddit) {
            await supabase
              .from("campaign_posts")
              .update({
                status: "failed",
                last_attempt_at: nowIso,
                last_error: "Subreddit not specified or invalid in platform_options",
              })
              .eq("id", post.id);

            failed.push(post.id);
            console.error(`No valid subreddit specified for post ${post.id}`);
            continue;
          }

          const title = (contentJson.title as string) || "";
          const text = (contentJson.text as string) || "";

          // Validate content length
          const contentValidation = validateRedditContent(title, text);
          if (!contentValidation.valid) {
            await supabase
              .from("campaign_posts")
              .update({
                status: "failed",
                last_attempt_at: nowIso,
                last_error: contentValidation.error || "Invalid content",
              })
              .eq("id", post.id);

            failed.push(post.id);
            console.error(`Post ${post.id} content validation failed: ${contentValidation.error}`);
            continue;
          }

          // Submit to Reddit
          try {
            const result = await submitRedditPost(
              tokenResult.accessToken,
              subreddit,
              title,
              text
            );

            // Update post on success
            await supabase
              .from("campaign_posts")
              .update({
                status: "published",
                posted_at: nowIso,
                last_attempt_at: nowIso,
                last_error: null,
                post_external_id: result.externalId,
                post_url: result.url,
              })
              .eq("id", post.id);

            processed.push(post.id);
            console.log(
              `Successfully posted Reddit post ${post.id} to r/${subreddit}`
            );
          } catch (postError) {
            const errorMessage =
              postError instanceof Error
                ? postError.message.substring(0, 500)
                : "Unknown error posting to Reddit";

            await supabase
              .from("campaign_posts")
              .update({
                status: "failed",
                last_attempt_at: nowIso,
                last_error: errorMessage,
              })
              .eq("id", post.id);

            failed.push(post.id);
            console.error(`Failed to post ${post.id} to Reddit:`, errorMessage);
          }
        } else {
          // For non-Reddit platforms, keep simulated behavior
          const workflowState = {
            ...(post.workflow_state ?? {}),
            scheduler: {
              ...(post.workflow_state?.scheduler ?? {}),
              lastSimulatedRun: nowIso,
            },
          };

          const { error: updateError } = await supabase
            .from("campaign_posts")
            .update({
              status: "published",
              posted_at: nowIso,
              workflow_state: workflowState,
            })
            .eq("id", post.id);

          if (updateError) {
            console.error("Failed to update scheduled post", {
              id: post.id,
              error: updateError,
            });
            failed.push(post.id);
            continue;
          }

          processed.push(post.id);
          console.log(
            `Simulated postScheduler publish for campaign_post ${post.id} targeting platform ${post.platform_id} (only Reddit is implemented)`
          );
        }
      } catch (error) {
        // Catch any unexpected errors for this post and continue
        const errorMessage =
          error instanceof Error ? error.message.substring(0, 500) : "Unknown error";

        await supabase
          .from("campaign_posts")
          .update({
            status: "failed",
            last_attempt_at: nowIso,
            last_error: errorMessage,
          })
          .eq("id", post.id);

        failed.push(post.id);
        console.error(`Unexpected error processing post ${post.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        processed,
        failed,
        count: processed.length,
        failedCount: failed.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("postScheduler failed", error);
    return new Response(JSON.stringify({ error: "Scheduler failure" }), {
      status: 500,
    });
  }
});
