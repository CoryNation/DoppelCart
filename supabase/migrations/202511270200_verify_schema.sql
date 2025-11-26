-- Verification script to check campaign_posts schema
-- Run this to see the current state of the table

-- Check all columns exist
select 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
from information_schema.columns
where table_schema = 'public'
  and table_name = 'campaign_posts'
order by ordinal_position;

-- Check indexes
select 
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'campaign_posts'
order by indexname;

-- Check RLS status
select 
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename = 'campaign_posts';

-- Check RLS policies
select 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'campaign_posts';

-- Check foreign key constraints
select
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
from information_schema.table_constraints AS tc
join information_schema.key_column_usage AS kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage AS ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_name = 'campaign_posts'
order by tc.constraint_name;

