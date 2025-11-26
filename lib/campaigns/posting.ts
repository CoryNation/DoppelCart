import { createSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { submitRedditTextPost } from "@/lib/social/redditClient";
import { mapCampaignContentRow } from "@/lib/campaigns/mappers";
import type { CampaignContent } from "@/types/campaign";
import type { PersonaSocialAccount } from "@/types/social";

/**
 * Validates and sanitizes a subreddit name.
 * Removes "r/" prefix if present and validates format.
 */
export function sanitizeSubreddit(subreddit: string | null | undefined): string | null {
  if (!subreddit) {
    return null;
  }

  // Remove "r/" prefix if present
  let sanitized = subreddit.trim().replace(/^r\//i, "");

  // Remove any leading/trailing slashes
  sanitized = sanitized.replace(/^\/+|\/+$/g, "");

  // Basic validation: alphanumeric, underscores, hyphens, 3-21 chars
  if (!/^[a-zA-Z0-9_-]{3,21}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validates Reddit post content length.
 * Reddit limits: title max 300 chars, text max 40,000 chars.
 */
export function validateRedditContent(
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

/**
 * Finds the appropriate Reddit account for a campaign post.
 * Prefers persona_social_account_id if set, otherwise finds by persona_id.
 * Verifies user ownership through campaign relationship.
 */
async function findRedditAccountForPost(
  post: CampaignContent,
  userId?: string
): Promise<{ id: string; account: PersonaSocialAccount } | null> {
  const supabase = createSupabaseServiceClient();

  // If persona_social_account_id is set, use that directly
  if (post.persona_social_account_id) {
    const { data: account, error } = await supabase
      .from("persona_social_accounts")
      .select(
        `
        *,
        personas!inner (
          user_id
        )
      `
      )
      .eq("id", post.persona_social_account_id)
      .eq("platform_id", "reddit")
      .eq("status", "connected")
      .single();

    if (error || !account) {
      return null;
    }

    // Verify user ownership if userId provided
    if (userId && (account.personas as { user_id: string } | null)?.user_id !== userId) {
      return null;
    }

    // Extract account without the join
    const { personas: _personas, ...accountData } = account;
    void _personas; // Explicitly mark as intentionally unused
    return { id: account.id, account: accountData as PersonaSocialAccount };
  }

  // Otherwise, find by persona_id and verify ownership
  let query = supabase
    .from("persona_social_accounts")
    .select(
      `
      *,
      personas!inner (
        user_id,
        id
      )
    `
    )
    .eq("persona_id", post.persona_id)
    .eq("platform_id", "reddit")
    .eq("status", "connected");

  // If userId provided, verify ownership through persona
  if (userId) {
    query = query.eq("personas.user_id", userId);
  }

  const { data: accounts, error } = await query;

  if (error || !accounts || accounts.length === 0) {
    return null;
  }

  // If multiple accounts, prefer the most recently used one
  const sortedAccounts = accounts.sort((a, b) => {
    const aTime = (a.last_token_refresh_at as string | null) || (a.created_at as string);
    const bTime = (b.last_token_refresh_at as string | null) || (b.created_at as string);
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  // Extract account without the join
  const { personas: _personas, ...accountData } = sortedAccounts[0];
  void _personas; // Explicitly mark as intentionally unused
  return { id: sortedAccounts[0].id, account: accountData as PersonaSocialAccount };
}

/**
 * Posts a campaign content item to Reddit immediately.
 * Handles all validation, account lookup, token refresh, and posting.
 *
 * @param contentId - The campaign post ID
 * @param userId - Optional user ID for ownership verification (required for API routes)
 * @returns Updated campaign content on success
 * @throws Error with descriptive message on failure
 */
export async function postCampaignContentToReddit(
  contentId: string,
  userId?: string
): Promise<CampaignContent> {
  const supabase = createSupabaseServiceClient();
  const nowIso = new Date().toISOString();

  // Fetch the campaign post with campaign join for ownership verification
  let query = supabase
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
    .eq("id", contentId);

  // If userId provided, verify ownership through the join
  if (userId) {
    query = query.eq("campaigns.user_id", userId);
  }

  const { data: postRow, error: postError } = await query.single();

  if (postError || !postRow) {
    throw new Error("Campaign post not found or access denied");
  }

  // Verify platform is Reddit
  if (postRow.platform_id !== "reddit") {
    throw new Error("This post is not configured for Reddit");
  }

  // Verify status allows posting
  if (postRow.status !== "draft" && postRow.status !== "scheduled") {
    throw new Error(
      `Cannot post content with status "${postRow.status}". Only draft or scheduled posts can be posted.`
    );
  }

  // Find the Reddit account
  const post = mapCampaignContentRow(postRow);
  const accountResult = await findRedditAccountForPost(post, userId);

  if (!accountResult) {
    // Update post with error
    await supabase
      .from("campaign_posts")
      .update({
        status: "failed",
        last_attempt_at: nowIso,
        last_error: "No connected Reddit account found for persona",
      })
      .eq("id", contentId);

    throw new Error("No connected Reddit account found for persona");
  }

  // Extract and validate subreddit
  const platformOptions = post.platform_options || {};
  const contentJson = post.content_json;
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
      .eq("id", contentId);

    throw new Error("Subreddit not specified or invalid in platform_options");
  }

  // Extract and validate content
  const title = (contentJson.title as string) || "";
  const text = (contentJson.text as string) || "";

  const contentValidation = validateRedditContent(title, text);
  if (!contentValidation.valid) {
    await supabase
      .from("campaign_posts")
      .update({
        status: "failed",
        last_attempt_at: nowIso,
        last_error: contentValidation.error || "Invalid content",
      })
      .eq("id", contentId);

    throw new Error(contentValidation.error || "Invalid content");
  }

  // Update last_attempt_at before posting
  await supabase
    .from("campaign_posts")
    .update({
      last_attempt_at: nowIso,
    })
    .eq("id", contentId);

  try {
    // Post to Reddit
    const result = await submitRedditTextPost({
      personaSocialAccount: accountResult.account,
      subreddit,
      title,
      text,
    });

    // Update post on success
    const { data: updatedPost, error: updateError } = await supabase
      .from("campaign_posts")
      .update({
        status: "published",
        posted_at: nowIso,
        last_attempt_at: nowIso,
        last_error: null,
        post_external_id: result.externalId,
        post_url: result.url,
      })
      .eq("id", contentId)
      .select("*")
      .single();

    if (updateError || !updatedPost) {
      console.error("Failed to update post after successful Reddit submission:", updateError);
      // Don't throw - the post was successful, just DB update failed
      return mapCampaignContentRow(postRow);
    }

    return mapCampaignContentRow(updatedPost);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message.substring(0, 500)
        : "Unknown error posting to Reddit";

    await supabase
      .from("campaign_posts")
      .update({
        status: "failed",
        last_attempt_at: nowIso,
        last_error: errorMessage,
      })
      .eq("id", contentId);

    throw error;
  }
}

