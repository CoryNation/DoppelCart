-- Create linkedin_persona_analysis table to store analysis results
create table if not exists public.linkedin_persona_analysis (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  analysis_result jsonb not null,
  csv_metadata jsonb, -- stores original_filename, row_count, content_length, etc.
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint linkedin_persona_analysis_pkey primary key (id)
);

-- Enable RLS
alter table public.linkedin_persona_analysis enable row level security;

-- Policies for linkedin_persona_analysis
create policy "Users can view their own linkedin persona analysis"
  on public.linkedin_persona_analysis for select
  using (auth.uid() = user_id);

create policy "Users can insert their own linkedin persona analysis"
  on public.linkedin_persona_analysis for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own linkedin persona analysis"
  on public.linkedin_persona_analysis for update
  using (auth.uid() = user_id);

create policy "Users can delete their own linkedin persona analysis"
  on public.linkedin_persona_analysis for delete
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists linkedin_persona_analysis_user_id_idx
  on public.linkedin_persona_analysis (user_id);

create index if not exists linkedin_persona_analysis_created_at_idx
  on public.linkedin_persona_analysis (created_at desc);

-- Add trigger to update updated_at timestamp
create trigger set_linkedin_persona_analysis_updated_at
  before update on public.linkedin_persona_analysis
  for each row
  execute function public.handle_updated_at();

-- Create junction table to link analyses to personas (when a persona is created from an analysis)
create table if not exists public.linkedin_persona_analysis_personas (
  analysis_id uuid not null references public.linkedin_persona_analysis(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint linkedin_persona_analysis_personas_pkey primary key (analysis_id, persona_id)
);

-- Enable RLS
alter table public.linkedin_persona_analysis_personas enable row level security;

-- Policies for linkedin_persona_analysis_personas
-- Allow access if the user owns the linked analysis
create policy "Users can view persona links for their linkedin analysis"
  on public.linkedin_persona_analysis_personas for select
  using (
    exists (
      select 1 from public.linkedin_persona_analysis
      where id = linkedin_persona_analysis_personas.analysis_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert persona links for their linkedin analysis"
  on public.linkedin_persona_analysis_personas for insert
  with check (
    exists (
      select 1 from public.linkedin_persona_analysis
      where id = linkedin_persona_analysis_personas.analysis_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete persona links for their linkedin analysis"
  on public.linkedin_persona_analysis_personas for delete
  using (
    exists (
      select 1 from public.linkedin_persona_analysis
      where id = linkedin_persona_analysis_personas.analysis_id
      and user_id = auth.uid()
    )
  );

-- Update persona_sources to support linkedin_csv source type
-- Note: This is a comment since we can't alter a check constraint easily
-- The source_type column is text, so it will accept 'linkedin_csv' without migration
-- But we should update the TypeScript type to include it

