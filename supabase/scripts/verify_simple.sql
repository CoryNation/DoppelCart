-- Simple verification query - easy to run in Supabase SQL Editor
-- This shows a quick status check

SELECT 
  'Schema Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'campaign_posts' 
        AND column_name = 'last_error'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'campaign_posts' 
        AND column_name = 'post_url'
    ) THEN '✓ Phase 4 columns exist'
    ELSE '✗ Missing Phase 4 columns'
  END as phase4_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'campaign_posts' 
        AND column_name = 'persona_social_account_id'
        AND is_nullable = 'YES'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'campaign_posts' 
        AND column_name = 'platform_id'
        AND is_nullable = 'YES'
    ) THEN '✓ Nullable columns correct'
    ELSE '✗ Nullable columns incorrect'
  END as nullable_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = 'campaign_posts'
        AND rowsecurity = true
    ) THEN '✓ RLS enabled'
    ELSE '✗ RLS not enabled'
  END as rls_status;

-- Show all columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('last_error', 'post_url') THEN 'Phase 4'
    WHEN column_name IN ('persona_social_account_id', 'platform_id') THEN 'Phase 3'
    ELSE 'Base'
  END as phase
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_posts'
ORDER BY 
  CASE phase
    WHEN 'Base' THEN 1
    WHEN 'Phase 3' THEN 2
    WHEN 'Phase 4' THEN 3
  END,
  ordinal_position;

