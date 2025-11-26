-- Create social integration tables

-- 1. Create reference table public.social_platforms
create table if not exists public.social_platforms (
  id text primary key, -- e.g. 'facebook', 'x', 'linkedin', 'reddit'
  display_name text not null,
  status text not null default 'active', -- 'active' | 'beta' | 'planned' | 'deprecated'
  supports_text boolean not null default true,
  supports_images boolean not null default true,
  supports_comments boolean not null default true,
  supports_dms boolean not null default false,
  oauth_authorize_url text,
  oauth_token_url text,
  oauth_revoke_url text,
  default_scopes text[] not null default '{}'::text[],
  docs_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.social_platforms
  add column if not exists oauth_authorize_url text,
  add column if not exists oauth_token_url text,
  add column if not exists oauth_revoke_url text,
  add column if not exists default_scopes text[] not null default '{}'::text[],
  add column if not exists docs_url text,
  add column if not exists updated_at timestamptz default now();

-- Seed data for social_platforms
insert into public.social_platforms (id, display_name, status, supports_text, supports_images, supports_comments, supports_dms)
values
  ('facebook', 'Facebook', 'planned', true, true, true, true),
  ('x', 'X (Twitter)', 'planned', true, true, true, true),
  ('linkedin', 'LinkedIn', 'planned', true, false, true, false),
  ('reddit', 'Reddit', 'planned', true, false, true, false)
on conflict (id) do update
set display_name = excluded.display_name,
    status = excluded.status,
    supports_text = excluded.supports_text,
    supports_images = excluded.supports_images,
    supports_comments = excluded.supports_comments,
    supports_dms = excluded.supports_dms;

-- 2. Create public.persona_social_accounts
create table if not exists public.persona_social_accounts (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),
  platform_account_id text,
  display_name text,
  account_handle text,
  profile_url text,
  avatar_url text,
  -- OAuth secret material is stored encrypted and never exposed to clients
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  token_type text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scopes text[],
  status text not null default 'connected', -- 'connected' | 'expired' | 'revoked'
  last_token_refresh_at timestamptz,
  last_token_error text,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_engagement_sync_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backfill newly added columns for existing deployments (create table won't add them if the table already exists)
alter table public.persona_social_accounts
  add column if not exists platform_account_id text,
  add column if not exists account_handle text,
  add column if not exists avatar_url text,
  add column if not exists access_token_encrypted bytea,
  add column if not exists refresh_token_encrypted bytea,
  add column if not exists token_type text,
  add column if not exists access_token_expires_at timestamptz,
  add column if not exists refresh_token_expires_at timestamptz,
  add column if not exists last_token_refresh_at timestamptz,
  add column if not exists last_token_error text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz,
  add column if not exists last_engagement_sync_at timestamptz,
  add column if not exists revoked_at timestamptz;

alter table public.persona_social_accounts enable row level security;

create index if not exists persona_social_accounts_persona_idx
  on public.persona_social_accounts (persona_id);

create index if not exists persona_social_accounts_platform_idx
  on public.persona_social_accounts (platform_id);

create unique index if not exists persona_social_accounts_platform_account_idx
  on public.persona_social_accounts (platform_id, platform_account_id)
  where platform_account_id is not null;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'persona_social_accounts'
      and policyname = 'Users can manage social accounts for their own personas'
  ) then
    create policy "Users can manage social accounts for their own personas"
    on public.persona_social_accounts
    for all
    using (
      exists (
        select 1 from public.personas p
        where p.id = persona_social_accounts.persona_id
          and p.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.personas p
        where p.id = persona_social_accounts.persona_id
          and p.user_id = auth.uid()
      )
    );
  end if;
end
$policy$;

-- 3. Create public.campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  name text not null,
  goal text,
  notes text,
  status text not null default 'draft', -- 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  objective text,
  start_date date,
  end_date date,
  timezone text,
  metrics jsonb not null default '{}'::jsonb,
  budget_cents integer,
  budget_currency text,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.campaigns
  add column if not exists status text not null default 'draft',
  add column if not exists objective text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists timezone text,
  add column if not exists metrics jsonb not null default '{}'::jsonb,
  add column if not exists budget_cents integer,
  add column if not exists budget_currency text,
  add column if not exists archived_at timestamptz;

alter table public.campaigns enable row level security;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'Users can manage their own campaigns'
  ) then
    create policy "Users can manage their own campaigns"
    on public.campaigns
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$policy$;

create index if not exists campaigns_user_idx
  on public.campaigns (user_id);

create index if not exists campaigns_persona_idx
  on public.campaigns (persona_id);

-- 4. Create public.campaign_posts
create table if not exists public.campaign_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  persona_social_account_id uuid not null references public.persona_social_accounts(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),

  status text not null default 'draft', -- 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for timestamptz,
  posted_at timestamptz,
  post_external_id text, -- platform-specific post/tweet id

  content_json jsonb not null, -- { text: string; image_url?: string; prompt_metadata?: {...} }
  media_assets jsonb not null default '[]'::jsonb,
  platform_options jsonb not null default '{}'::jsonb,
  created_by text not null default 'user', -- 'user' | 'ai'
  error_message text,
  retry_count integer not null default 0,
  last_attempt_at timestamptz,
  workflow_state jsonb not null default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.campaign_posts
  add column if not exists persona_social_account_id uuid references public.persona_social_accounts(id) on delete cascade,
  add column if not exists media_assets jsonb not null default '[]'::jsonb,
  add column if not exists platform_options jsonb not null default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists retry_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists workflow_state jsonb not null default '{}'::jsonb;

alter table public.campaign_posts enable row level security;

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

create index if not exists campaign_posts_campaign_idx
  on public.campaign_posts (campaign_id);

create index if not exists campaign_posts_persona_account_idx
  on public.campaign_posts (persona_social_account_id);

create index if not exists campaign_posts_status_idx
  on public.campaign_posts (status);

-- 5. Create public.engagement_items
create table if not exists public.engagement_items (
  id uuid primary key default gen_random_uuid(),
  persona_social_account_id uuid not null references public.persona_social_accounts(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),
  campaign_post_id uuid references public.campaign_posts(id) on delete set null,

  source_type text not null, -- 'incoming_comment' | 'incoming_dm' | 'external_post'
  platform_object_id text not null, -- e.g. comment id, dm thread id, external post id
  parent_post_id text, -- optional reference to the original post id for cross-platform lookups
  parent_engagement_item_id uuid references public.engagement_items(id) on delete cascade,
  thread_root_id uuid references public.engagement_items(id) on delete set null,
  author_handle text,
  content_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  platform_context jsonb not null default '{}'::jsonb,

  status text not null default 'unreviewed', -- 'unreviewed' | 'suggested_reply_ready' | 'replied' | 'skipped'
  ai_suggested_reply text,
  final_reply text,
  reply_mode text, -- 'ai_auto' | 'ai_suggested' | 'manual'
  received_at timestamptz default now(),
  ingested_at timestamptz default now(),
  priority integer not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (persona_social_account_id, platform_object_id)
);

alter table public.engagement_items
  add column if not exists campaign_post_id uuid references public.campaign_posts(id) on delete set null,
  add column if not exists parent_engagement_item_id uuid references public.engagement_items(id) on delete cascade,
  add column if not exists thread_root_id uuid references public.engagement_items(id) on delete set null,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists platform_context jsonb not null default '{}'::jsonb,
  add column if not exists received_at timestamptz default now(),
  add column if not exists ingested_at timestamptz default now(),
  add column if not exists priority integer not null default 0;

alter table public.engagement_items enable row level security;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'engagement_items'
      and policyname = 'Users can manage engagement items for their own personas'
  ) then
    create policy "Users can manage engagement items for their own personas"
    on public.engagement_items
    for all
    using (
      exists (
        select 1
        from public.persona_social_accounts psa
        join public.personas p on p.id = psa.persona_id
        where psa.id = engagement_items.persona_social_account_id
          and p.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.persona_social_accounts psa
        join public.personas p on p.id = psa.persona_id
        where psa.id = engagement_items.persona_social_account_id
          and p.user_id = auth.uid()
      )
    );
  end if;
end
$policy$;

create index if not exists engagement_items_persona_account_idx
  on public.engagement_items (persona_social_account_id);

create index if not exists engagement_items_campaign_post_idx
  on public.engagement_items (campaign_post_id);

create index if not exists engagement_items_thread_root_idx
  on public.engagement_items (thread_root_id);

-- 6. Create public.social_oauth_sessions
create table if not exists public.social_oauth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),
  persona_social_account_id uuid references public.persona_social_accounts(id) on delete set null,
  redirect_uri text not null,
  state text not null unique,
  code_verifier text not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  scopes text[] not null default '{}'::text[],
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  authorization_code text,
  error text,
  raw_callback jsonb,
  processed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.social_oauth_sessions enable row level security;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'social_oauth_sessions'
      and policyname = 'Users manage their own social oauth sessions'
  ) then
    create policy "Users manage their own social oauth sessions"
    on public.social_oauth_sessions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$policy$;

create index if not exists social_oauth_sessions_user_idx
  on public.social_oauth_sessions (user_id);

create index if not exists social_oauth_sessions_state_idx
  on public.social_oauth_sessions (state);

