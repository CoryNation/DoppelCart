export type SocialPlatformId = "facebook" | "x" | "linkedin" | "reddit";

export interface SocialPlatform {
  id: SocialPlatformId | string; // allow extension
  display_name: string;
  status: "active" | "beta" | "planned" | "deprecated" | string;
  supports_text: boolean;
  supports_images: boolean;
  supports_comments: boolean;
  supports_dms: boolean;
  created_at: string;
}

export interface PersonaSocialAccount {
  id: string;
  persona_id: string;
  platform_id: SocialPlatformId | string;
  display_name: string | null;
  profile_url: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[] | null;
  status: "connected" | "expired" | "revoked" | string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  persona_id: string;
  name: string;
  goal: string | null;
  notes: string | null;
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
  platform_id: SocialPlatformId | string;
  status: "draft" | "scheduled" | "published" | "failed" | string;
  scheduled_for: string | null;
  posted_at: string | null;
  post_external_id: string | null;
  content_json: CampaignPostContent;
  created_by: "user" | "ai" | string;
  created_at: string;
  updated_at: string;
}

export interface EngagementItem {
  id: string;
  persona_social_account_id: string;
  platform_id: SocialPlatformId | string;
  source_type: "incoming_comment" | "incoming_dm" | "external_post" | string;
  platform_object_id: string;
  parent_post_id: string | null;
  author_handle: string | null;
  content_text: string | null;
  status: "unreviewed" | "suggested_reply_ready" | "replied" | "skipped" | string;
  ai_suggested_reply: string | null;
  final_reply: string | null;
  reply_mode: "ai_auto" | "ai_suggested" | "manual" | string | null;
  created_at: string;
  updated_at: string;
}

