import type { Campaign, CampaignContent } from "@/types/campaign";

type DbCampaignRow = {
  id: string;
  user_id: string;
  persona_id: string;
  name: string;
  goal?: string | null;
  notes?: string | null;
  description?: string | null;
  status: string;
  objective?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
  metrics?: Record<string, unknown> | null;
  budget_cents?: number | null;
  budget_currency?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
} & Record<string, unknown>;

type DbCampaignContentRow = {
  id: string;
  campaign_id: string;
  persona_id: string;
  persona_social_account_id?: string | null;
  platform_id?: string | null;
  status: string;
  scheduled_for?: string | null;
  posted_at?: string | null;
  post_external_id?: string | null;
  post_url?: string | null;
  content_json?: CampaignContent["content_json"];
  media_assets?: Record<string, unknown>[] | null;
  platform_options?: Record<string, unknown> | null;
  created_by?: string;
  error_message?: string | null;
  retry_count?: number | null;
  last_attempt_at?: string | null;
  last_error?: string | null;
  workflow_state?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
} & Record<string, unknown>;

export function mapCampaignRow(row: DbCampaignRow): Campaign {
  const metrics = (row.metrics ?? {}) as Record<string, unknown>;
  const targetPlatforms = Array.isArray(metrics.target_platforms)
    ? (metrics.target_platforms as string[])
    : [];

  return {
    id: row.id,
    user_id: row.user_id,
    persona_id: row.persona_id,
    name: row.name,
    goal: row.goal ?? null,
    notes: row.notes ?? null,
    description: row.objective ?? row.description ?? null,
    status: row.status,
    objective: row.objective ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    timezone: row.timezone ?? null,
    metrics,
    budget_cents: row.budget_cents ?? null,
    budget_currency: row.budget_currency ?? null,
    archived_at: row.archived_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    target_platforms: targetPlatforms,
  };
}

export function mapCampaignContentRow(
  row: DbCampaignContentRow
): CampaignContent {
  const content =
    (row.content_json ?? {}) as CampaignContent["content_json"];
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    persona_id: row.persona_id,
    persona_social_account_id: row.persona_social_account_id ?? null,
    platform_id: row.platform_id ?? null,
    status: row.status,
    scheduled_for: row.scheduled_for ?? null,
    posted_at: row.posted_at ?? null,
    post_external_id: row.post_external_id ?? null,
    post_url: row.post_url ?? null,
    content_json: content,
    media_assets: Array.isArray(row.media_assets) ? row.media_assets : [],
    platform_options: (row.platform_options as Record<string, unknown>) ?? {},
    created_by: row.created_by ?? "user",
    error_message: row.error_message ?? null,
    retry_count: row.retry_count ?? 0,
    last_attempt_at: row.last_attempt_at ?? null,
    last_error: row.last_error ?? null,
    workflow_state: (row.workflow_state as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type { DbCampaignRow, DbCampaignContentRow };

export function upsertTargetPlatforms(
  metrics: Record<string, unknown> | null | undefined,
  targetPlatforms: string[]
): Record<string, unknown> {
  return {
    ...(metrics ?? {}),
    target_platforms: targetPlatforms,
  };
}


