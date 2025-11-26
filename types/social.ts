export type SocialPlatformId = "facebook" | "x" | "linkedin" | "reddit";

export interface SocialPlatform {
  id: SocialPlatformId | string; // allow extension
  display_name: string;
  status: "active" | "beta" | "planned" | "deprecated" | string;
  supports_text: boolean;
  supports_images: boolean;
  supports_comments: boolean;
  supports_dms: boolean;
  oauth_authorize_url: string | null;
  oauth_token_url: string | null;
  oauth_revoke_url: string | null;
  default_scopes: string[];
  docs_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonaSocialAccount {
  id: string;
  persona_id: string;
  platform_id: SocialPlatformId | string;
  platform_account_id: string | null;
  display_name: string | null;
  account_handle: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  token_type: string | null;
  provider_account_id: string | null;
  provider_username: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  scopes: string[] | null;
  status: "connected" | "expired" | "revoked" | string;
  last_refreshed_at: string | null;
  last_token_refresh_at: string | null;
  last_token_error: string | null;
  metadata: Record<string, unknown>;
  last_synced_at: string | null;
  last_engagement_sync_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OAuthState {
  id: string;
  user_id: string;
  persona_id: string;
  platform_id: SocialPlatformId | string;
  state: string;
  redirect_to: string | null;
  created_at: string;
  expires_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  persona_id: string;
  name: string;
  goal: string | null;
  notes: string | null;
  status: "draft" | "active" | "paused" | "completed" | "archived" | string;
  objective: string | null;
  start_date: string | null;
  end_date: string | null;
  timezone: string | null;
  metrics: Record<string, unknown>;
  budget_cents: number | null;
  budget_currency: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPostContent {
  text: string;
  image_url?: string;
  prompt_metadata?: Record<string, any>;
}

export interface CampaignPost {
  id: string;
  campaign_id: string;
  persona_id: string;
  persona_social_account_id: string;
  platform_id: SocialPlatformId | string;
  status: "draft" | "scheduled" | "published" | "failed" | string;
  scheduled_for: string | null;
  posted_at: string | null;
  post_external_id: string | null;
  content_json: CampaignPostContent;
  media_assets: Record<string, unknown>[];
  platform_options: Record<string, unknown>;
  created_by: "user" | "ai" | string;
  error_message: string | null;
  retry_count: number;
  last_attempt_at: string | null;
  workflow_state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EngagementItem {
  id: string;
  persona_social_account_id: string;
  platform_id: SocialPlatformId | string;
  campaign_post_id: string | null;
  source_type: "incoming_comment" | "incoming_dm" | "external_post" | string;
  platform_object_id: string;
  parent_post_id: string | null;
  parent_engagement_item_id: string | null;
  thread_root_id: string | null;
  author_handle: string | null;
  content_text: string | null;
  raw_payload: Record<string, unknown>;
  platform_context: Record<string, unknown>;
  status: "unreviewed" | "suggested_reply_ready" | "replied" | "skipped" | string;
  ai_suggested_reply: string | null;
  final_reply: string | null;
  reply_mode: "ai_auto" | "ai_suggested" | "manual" | string | null;
  received_at: string;
  ingested_at: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

