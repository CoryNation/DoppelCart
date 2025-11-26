export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived"
  | string;

export type CampaignContentStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "failed"
  | string;

export interface Campaign {
  id: string;
  user_id: string;
  persona_id: string;
  name: string;
  goal: string | null;
  notes: string | null;
  description: string | null;
  status: CampaignStatus;
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
  target_platforms: string[];
}

export interface ContentPayload {
  title: string;
  text: string;
  image_prompt?: string;
  recommended_platforms?: string[];
  prompt_metadata?: Record<string, unknown>;
}

export interface CampaignContent {
  id: string;
  campaign_id: string;
  persona_id: string;
  persona_social_account_id: string | null;
  platform_id: string | null;
  status: CampaignContentStatus;
  scheduled_for: string | null;
  posted_at: string | null;
  post_external_id: string | null;
  post_url: string | null;
  content_json: ContentPayload;
  media_assets: Record<string, unknown>[];
  platform_options: Record<string, unknown>;
  created_by: "user" | "ai" | string;
  error_message: string | null;
  retry_count: number;
  last_attempt_at: string | null;
  last_error: string | null;
  workflow_state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignGenerationJob {
  id: string;
  campaign_id: string;
  input_prompt: string;
  status: "running" | "completed" | "failed";
  error_message: string | null;
  result_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithContent extends Campaign {
  content_items: CampaignContent[];
  latest_generation_job?: CampaignGenerationJob | null;
}


