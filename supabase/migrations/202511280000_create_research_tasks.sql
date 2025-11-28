-- Create research_tasks table for storing research task state
-- This replaces the in-memory Map storage that doesn't persist in serverless environments

create table if not exists public.research_tasks (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  clarified_scope text,
  parameters jsonb,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'queued'::text,
  progress integer not null default 0,
  result_summary text,
  result_details jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint research_tasks_pkey primary key (id),
  constraint research_tasks_status_check check (status = any (array['queued'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  constraint research_tasks_progress_check check (progress >= 0 and progress <= 100)
);

-- Create index for faster lookups
create index if not exists research_tasks_user_id_idx on public.research_tasks(user_id);
create index if not exists research_tasks_status_idx on public.research_tasks(status);
create index if not exists research_tasks_created_at_idx on public.research_tasks(created_at desc);

-- Enable RLS
alter table public.research_tasks enable row level security;

-- Policies for research_tasks
create policy "Users can view their own research tasks"
  on public.research_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own research tasks"
  on public.research_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own research tasks"
  on public.research_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own research tasks"
  on public.research_tasks for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
create trigger set_research_tasks_updated_at
  before update on public.research_tasks
  for each row
  execute function public.handle_updated_at();




