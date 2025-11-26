-- Create personas table
-- This is a critical missing table referenced by many foreign keys

create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_image_url text,
  avatar_prompt text,
  stats jsonb,
  goals text[],
  demographics jsonb,
  personality jsonb,
  biography text,
  raw_definition jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add agent_id column if it doesn't exist (for optional reference to agents table)
alter table public.personas
  add column if not exists agent_id uuid;

-- Note: If agents table exists, you may want to add:
-- alter table public.personas 
--   add constraint personas_agent_id_fkey 
--   foreign key (agent_id) references public.agents(id) on delete set null;

-- Enable Row Level Security
alter table public.personas enable row level security;

-- Create policy: Users can view their own personas
create policy "Users can view their own personas"
  on public.personas
  for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own personas
create policy "Users can insert their own personas"
  on public.personas
  for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can update their own personas
create policy "Users can update their own personas"
  on public.personas
  for update
  using (auth.uid() = user_id);

-- Create policy: Users can delete their own personas
create policy "Users can delete their own personas"
  on public.personas
  for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists personas_user_id_idx
  on public.personas (user_id);

-- Create partial index on agent_id (only if column exists)
-- This index is optional and only created if agent_id column exists
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'personas' 
    and column_name = 'agent_id'
  ) then
    create index if not exists personas_agent_id_idx
      on public.personas (agent_id)
      where agent_id is not null;
  end if;
end $$;

-- Add trigger to update updated_at timestamp
create trigger set_personas_updated_at
  before update on public.personas
  for each row
  execute function public.handle_updated_at();

