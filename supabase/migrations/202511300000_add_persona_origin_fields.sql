-- Add origin tracking columns to personas table
alter table public.personas
  add column if not exists origin_type text,
  add column if not exists origin_metadata jsonb;

-- Create persona_sources table to track source files/data
create table if not exists public.persona_sources (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  source_type text not null, -- 'csv_post_history' | 'ai_history_text'
  storage_path text,         -- Supabase Storage path if we store CSV
  original_filename text,
  source_summary text,
  created_at timestamptz default now()
);

-- Enable Row Level Security on persona_sources
alter table public.persona_sources enable row level security;

-- Create policy: Users can view persona_sources for their own personas
-- Drop policies if they exist (for idempotent migrations)
drop policy if exists "Users can view their own persona_sources" on public.persona_sources;
drop policy if exists "Users can insert their own persona_sources" on public.persona_sources;
drop policy if exists "Users can update their own persona_sources" on public.persona_sources;
drop policy if exists "Users can delete their own persona_sources" on public.persona_sources;

create policy "Users can view their own persona_sources"
  on public.persona_sources
  for select
  using (
    exists (
      select 1 from public.personas
      where personas.id = persona_sources.persona_id
      and personas.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert persona_sources for their own personas
create policy "Users can insert their own persona_sources"
  on public.persona_sources
  for insert
  with check (
    exists (
      select 1 from public.personas
      where personas.id = persona_sources.persona_id
      and personas.user_id = auth.uid()
    )
  );

-- Create policy: Users can update persona_sources for their own personas
create policy "Users can update their own persona_sources"
  on public.persona_sources
  for update
  using (
    exists (
      select 1 from public.personas
      where personas.id = persona_sources.persona_id
      and personas.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete persona_sources for their own personas
create policy "Users can delete their own persona_sources"
  on public.persona_sources
  for delete
  using (
    exists (
      select 1 from public.personas
      where personas.id = persona_sources.persona_id
      and personas.user_id = auth.uid()
    )
  );

-- Create indexes for performance
create index if not exists persona_sources_persona_id_idx
  on public.persona_sources (persona_id);

create index if not exists persona_sources_source_type_idx
  on public.persona_sources (source_type);

create index if not exists personas_origin_type_idx
  on public.personas (origin_type)
  where origin_type is not null;

