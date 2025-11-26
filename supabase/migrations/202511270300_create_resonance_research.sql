create table if not exists public.resonance_research (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  initial_prompt text not null,
  input_context jsonb,
  result jsonb,
  status text not null default 'running'::text,
  error_message text,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint resonance_research_pkey primary key (id),
  constraint resonance_research_status_check check (status = any (array['running'::text, 'completed'::text, 'failed'::text]))
);

create table if not exists public.resonance_research_personas (
  research_id uuid not null references public.resonance_research(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  constraint resonance_research_personas_pkey primary key (research_id, persona_id)
);

-- Enable RLS
alter table public.resonance_research enable row level security;
alter table public.resonance_research_personas enable row level security;

-- Policies for resonance_research
create policy "Users can view their own resonance research"
  on public.resonance_research for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resonance research"
  on public.resonance_research for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resonance research"
  on public.resonance_research for update
  using (auth.uid() = user_id);

create policy "Users can delete their own resonance research"
  on public.resonance_research for delete
  using (auth.uid() = user_id);

-- Policies for resonance_research_personas
-- Allow access if the user owns the linked research study
create policy "Users can view persona links for their research"
  on public.resonance_research_personas for select
  using (
    exists (
      select 1 from public.resonance_research
      where id = resonance_research_personas.research_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert persona links for their research"
  on public.resonance_research_personas for insert
  with check (
    exists (
      select 1 from public.resonance_research
      where id = resonance_research_personas.research_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete persona links for their research"
  on public.resonance_research_personas for delete
  using (
    exists (
      select 1 from public.resonance_research
      where id = resonance_research_personas.research_id
      and user_id = auth.uid()
    )
  );

