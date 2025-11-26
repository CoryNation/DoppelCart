-- Add posting metadata and error tracking columns to campaign_posts (Phase 4)

alter table public.campaign_posts
  add column if not exists last_error text,
  add column if not exists post_url text;

-- Note: post_external_id and last_attempt_at already exist from previous migrations

