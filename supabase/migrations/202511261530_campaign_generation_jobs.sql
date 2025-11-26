-- Campaign content generation + scheduling enhancements (Phase 3)

-- 1. Allow campaign_posts to exist before a social account and platform are assigned.
alter table public.campaign_posts
  alter column persona_social_account_id drop not null,
  alter column platform_id drop not null;

-- 2. Track AI generation jobs for campaigns.
create table if not exists public.campaign_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  input_prompt text not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  error_message text,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_generation_jobs_campaign_idx
  on public.campaign_generation_jobs (campaign_id);

create index if not exists campaign_generation_jobs_status_idx
  on public.campaign_generation_jobs (status);

alter table public.campaign_generation_jobs enable row level security;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_generation_jobs'
      and policyname = 'Users manage campaign generation jobs'
  ) then
    create policy "Users manage campaign generation jobs"
      on public.campaign_generation_jobs
      for all
      using (
        exists (
          select 1 from public.campaigns c
          where c.id = campaign_generation_jobs.campaign_id
            and c.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.campaigns c
          where c.id = campaign_generation_jobs.campaign_id
            and c.user_id = auth.uid()
        )
      );
  end if;
end
$policy$;

-- 3. Keep updated_at fresh.
create trigger set_campaign_generation_jobs_updated_at
  before update on public.campaign_generation_jobs
  for each row
  execute function public.handle_updated_at();


