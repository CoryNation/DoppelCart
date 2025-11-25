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
  created_at timestamptz default now()
);

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
  display_name text,
  profile_url text,

  -- OAuth-related fields (will be used later when we hook up real flows)
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],

  status text not null default 'connected', -- 'connected' | 'expired' | 'revoked'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (persona_id, platform_id)
);

alter table public.persona_social_accounts enable row level security;

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

-- 3. Create public.campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  name text not null,
  goal text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.campaigns enable row level security;

create policy "Users can manage their own campaigns"
on public.campaigns
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4. Create public.campaign_posts
create table if not exists public.campaign_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),

  status text not null default 'draft', -- 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for timestamptz,
  posted_at timestamptz,
  post_external_id text, -- platform-specific post/tweet id

  content_json jsonb not null, -- { text: string; image_url?: string; prompt_metadata?: {...} }
  created_by text not null default 'user', -- 'user' | 'ai'

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.campaign_posts enable row level security;

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

-- 5. Create public.engagement_items
create table if not exists public.engagement_items (
  id uuid primary key default gen_random_uuid(),
  persona_social_account_id uuid not null references public.persona_social_accounts(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),

  source_type text not null, -- 'incoming_comment' | 'incoming_dm' | 'external_post'
  platform_object_id text not null, -- e.g. comment id, dm thread id, external post id
  parent_post_id text, -- optional reference to the original post id
  author_handle text,
  content_text text,

  status text not null default 'unreviewed', -- 'unreviewed' | 'suggested_reply_ready' | 'replied' | 'skipped'
  ai_suggested_reply text,
  final_reply text,
  reply_mode text, -- 'ai_auto' | 'ai_suggested' | 'manual'

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.engagement_items enable row level security;

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

