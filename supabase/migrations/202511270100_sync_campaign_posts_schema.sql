-- Sync campaign_posts table schema to match Phase 4 requirements
-- This migration ensures all columns exist and have correct constraints

-- 1. Ensure persona_social_account_id and platform_id are nullable (Phase 3)
--    (These may have been made nullable already, but ensure it's the case)
do $$
begin
  -- Check if persona_social_account_id is NOT NULL and make it nullable
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaign_posts'
      and column_name = 'persona_social_account_id'
      and is_nullable = 'NO'
  ) then
    alter table public.campaign_posts
      alter column persona_social_account_id drop not null;
  end if;

  -- Check if platform_id is NOT NULL and make it nullable
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaign_posts'
      and column_name = 'platform_id'
      and is_nullable = 'NO'
  ) then
    alter table public.campaign_posts
      alter column platform_id drop not null;
  end if;
end $$;

-- 2. Add Phase 4 columns if they don't exist
alter table public.campaign_posts
  add column if not exists last_error text,
  add column if not exists post_url text;

-- 3. Ensure all required columns from previous migrations exist
alter table public.campaign_posts
  add column if not exists post_external_id text,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists error_message text,
  add column if not exists retry_count integer not null default 0,
  add column if not exists workflow_state jsonb not null default '{}'::jsonb,
  add column if not exists media_assets jsonb not null default '[]'::jsonb,
  add column if not exists platform_options jsonb not null default '{}'::jsonb,
  add column if not exists created_by text not null default 'user',
  add column if not exists scheduled_for timestamptz,
  add column if not exists posted_at timestamptz;

-- 4. Ensure indexes exist
create index if not exists campaign_posts_campaign_idx
  on public.campaign_posts (campaign_id);

create index if not exists campaign_posts_persona_account_idx
  on public.campaign_posts (persona_social_account_id)
  where persona_social_account_id is not null;

create index if not exists campaign_posts_status_idx
  on public.campaign_posts (status);

create index if not exists campaign_posts_platform_idx
  on public.campaign_posts (platform_id)
  where platform_id is not null;

create index if not exists campaign_posts_scheduled_for_idx
  on public.campaign_posts (scheduled_for)
  where scheduled_for is not null;

-- 5. Ensure RLS is enabled
alter table public.campaign_posts enable row level security;

-- 6. Ensure RLS policy exists
do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_posts'
      and policyname = 'Users can manage posts for their own campaigns'
  ) then
    create policy "Users can manage posts for their own campaigns"
    on public.campaign_posts
    for all
    using (
      exists (
        select 1 from public.campaigns c
        where c.id = campaign_posts.campaign_id
          and c.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.campaigns c
        where c.id = campaign_posts.campaign_id
          and c.user_id = auth.uid()
      )
    );
  end if;
end
$policy$;

-- 7. Ensure updated_at trigger exists
do $trigger$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_campaign_posts_updated_at'
  ) then
    create trigger set_campaign_posts_updated_at
      before update on public.campaign_posts
      for each row
      execute function public.handle_updated_at();
  end if;
end
$trigger$;

-- 8. Verify schema (commented out - uncomment to see current state)
/*
select 
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'campaign_posts'
order by ordinal_position;
*/

