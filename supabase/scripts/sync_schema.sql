-- Comprehensive schema sync script for campaign_posts
-- This script ensures the database matches the expected schema from all migrations
-- Run this if you need to sync your database structure

-- ============================================================================
-- PHASE 4 SCHEMA SYNC FOR campaign_posts
-- ============================================================================

-- Step 1: Make nullable columns nullable (Phase 3 requirement)
do $$
begin
  -- Make persona_social_account_id nullable
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
    raise notice 'Made persona_social_account_id nullable';
  end if;

  -- Make platform_id nullable
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
    raise notice 'Made platform_id nullable';
  end if;
end $$;

-- Step 2: Add all required columns with proper defaults
alter table public.campaign_posts
  -- Phase 4 columns
  add column if not exists last_error text,
  add column if not exists post_url text,
  -- Phase 3 columns (if missing)
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

-- Step 3: Ensure all indexes exist
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
  where scheduled_for is not null and status = 'scheduled';

-- Step 4: Ensure RLS is enabled
alter table public.campaign_posts enable row level security;

-- Step 5: Ensure RLS policy exists
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
    raise notice 'Created RLS policy for campaign_posts';
  end if;
end
$policy$;

-- Step 6: Ensure updated_at trigger exists (requires handle_updated_at function)
do $trigger$
begin
  -- First check if the function exists
  if exists (
    select 1
    from pg_proc
    where proname = 'handle_updated_at'
      and pronamespace = (select oid from pg_namespace where nspname = 'public')
  ) then
    -- Then check if trigger exists
    if not exists (
      select 1
      from pg_trigger
      where tgname = 'set_campaign_posts_updated_at'
    ) then
      create trigger set_campaign_posts_updated_at
        before update on public.campaign_posts
        for each row
        execute function public.handle_updated_at();
      raise notice 'Created updated_at trigger for campaign_posts';
    end if;
  else
    raise notice 'handle_updated_at function not found - skipping trigger creation';
  end if;
end
$trigger$;

-- Step 7: Summary report
do $$
declare
  col_count integer;
  idx_count integer;
  rls_enabled boolean;
  policy_count integer;
begin
  -- Count columns
  select count(*) into col_count
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'campaign_posts';

  -- Count indexes
  select count(*) into idx_count
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'campaign_posts';

  -- Check RLS
  select rowsecurity into rls_enabled
  from pg_tables
  where schemaname = 'public'
    and tablename = 'campaign_posts';

  -- Count policies
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'campaign_posts';

  raise notice '========================================';
  raise notice 'campaign_posts Schema Sync Summary';
  raise notice '========================================';
  raise notice 'Columns: %', col_count;
  raise notice 'Indexes: %', idx_count;
  raise notice 'RLS Enabled: %', rls_enabled;
  raise notice 'Policies: %', policy_count;
  raise notice '========================================';
end $$;

