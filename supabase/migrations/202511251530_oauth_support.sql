-- Phase 2 OAuth enhancements for Reddit integration

-- 1. Extend persona_social_accounts for richer OAuth metadata
alter table public.persona_social_accounts
  add column if not exists provider_account_id text,
  add column if not exists provider_username text,
  add column if not exists token_type text,
  add column if not exists last_refreshed_at timestamptz;

-- 2. Track in-flight OAuth flows
create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  platform_id text not null references public.social_platforms(id),
  state text not null unique,
  redirect_to text,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

alter table public.oauth_states enable row level security;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'oauth_states'
      and policyname = 'Users can manage their own oauth states'
  ) then
    create policy "Users can manage their own oauth states"
    on public.oauth_states
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$policy$;

