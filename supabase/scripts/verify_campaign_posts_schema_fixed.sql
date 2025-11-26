-- Comprehensive verification script for campaign_posts schema
-- Run this in Supabase SQL Editor to check your database state
-- This version is compatible with Supabase SQL Editor (no psql commands)

-- ============================================================================
-- 1. COLUMN VERIFICATION
-- ============================================================================
SELECT 
  '1. All Columns' as check_section,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('last_error', 'post_url') THEN 'Phase 4'
    WHEN column_name IN ('persona_social_account_id', 'platform_id') THEN 'Phase 3 (nullable)'
    ELSE 'Base'
  END as migration_phase
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_posts'
ORDER BY 
  CASE 
    WHEN column_name IN ('last_error', 'post_url') THEN 3
    WHEN column_name IN ('persona_social_account_id', 'platform_id') THEN 2
    ELSE 1
  END,
  ordinal_position;

-- ============================================================================
-- 2. PHASE 4 COLUMNS CHECK
-- ============================================================================
SELECT 
  '2. Phase 4 Columns' as check_section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'campaign_posts' 
        AND column_name = 'last_error'
    ) THEN '✓ last_error exists'
    ELSE '✗ last_error MISSING'
  END as last_error_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'campaign_posts' 
        AND column_name = 'post_url'
    ) THEN '✓ post_url exists'
    ELSE '✗ post_url MISSING'
  END as post_url_status;

-- ============================================================================
-- 3. NULLABLE COLUMNS CHECK (Phase 3)
-- ============================================================================
SELECT 
  '3. Nullable Columns' as check_section,
  column_name,
  is_nullable,
  CASE 
    WHEN column_name = 'persona_social_account_id' AND is_nullable = 'YES' THEN '✓ Correct (nullable)'
    WHEN column_name = 'persona_social_account_id' AND is_nullable = 'NO' THEN '✗ Should be nullable'
    WHEN column_name = 'platform_id' AND is_nullable = 'YES' THEN '✓ Correct (nullable)'
    WHEN column_name = 'platform_id' AND is_nullable = 'NO' THEN '✗ Should be nullable'
    ELSE 'N/A'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_posts'
  AND column_name IN ('persona_social_account_id', 'platform_id');

-- ============================================================================
-- 4. INDEXES VERIFICATION
-- ============================================================================
SELECT 
  '4. Indexes' as check_section,
  indexname,
  CASE 
    WHEN indexname = 'campaign_posts_campaign_idx' THEN '✓ Required'
    WHEN indexname = 'campaign_posts_persona_account_idx' THEN '✓ Required'
    WHEN indexname = 'campaign_posts_status_idx' THEN '✓ Required'
    WHEN indexname = 'campaign_posts_platform_idx' THEN '✓ Recommended'
    WHEN indexname = 'campaign_posts_scheduled_for_idx' THEN '✓ Recommended'
    ELSE '?'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campaign_posts'
ORDER BY indexname;

-- ============================================================================
-- 5. RLS STATUS
-- ============================================================================
SELECT 
  '5. RLS Status' as check_section,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'campaign_posts';

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================
SELECT 
  '6. RLS Policies' as check_section,
  policyname,
  CASE 
    WHEN policyname = 'Users can manage posts for their own campaigns' THEN '✓ Required policy exists'
    ELSE '?'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'campaign_posts';

-- ============================================================================
-- 7. FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT
  '7. Foreign Keys' as check_section,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN tc.constraint_name LIKE '%campaign_id%' THEN '✓'
    WHEN tc.constraint_name LIKE '%persona_id%' THEN '✓'
    WHEN tc.constraint_name LIKE '%persona_social_account_id%' THEN '✓'
    WHEN tc.constraint_name LIKE '%platform_id%' THEN '✓'
    ELSE '?'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'campaign_posts'
ORDER BY tc.constraint_name;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================
SELECT 
  '8. Triggers' as check_section,
  tgname as trigger_name,
  CASE 
    WHEN tgname = 'set_campaign_posts_updated_at' THEN '✓ Required trigger exists'
    ELSE '?'
  END as status
FROM pg_trigger
WHERE tgrelid = 'public.campaign_posts'::regclass
  AND tgisinternal = false;

-- ============================================================================
-- 9. SUMMARY REPORT
-- ============================================================================
DO $$
DECLARE
  col_count integer;
  phase4_cols integer;
  nullable_correct integer;
  idx_count integer;
  rls_enabled boolean;
  policy_count integer;
  trigger_count integer;
  issues text[] := ARRAY[]::text[];
BEGIN
  -- Count total columns
  SELECT count(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'campaign_posts';

  -- Count Phase 4 columns
  SELECT count(*) INTO phase4_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'campaign_posts'
    AND column_name IN ('last_error', 'post_url');

  -- Check nullable columns
  SELECT count(*) INTO nullable_correct
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'campaign_posts'
    AND column_name IN ('persona_social_account_id', 'platform_id')
    AND is_nullable = 'YES';

  -- Count indexes
  SELECT count(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'campaign_posts';

  -- Check RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'campaign_posts';

  -- Count policies
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_posts';

  -- Count triggers
  SELECT count(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'public.campaign_posts'::regclass
    AND tgisinternal = false;

  -- Build issues list
  IF phase4_cols < 2 THEN
    issues := array_append(issues, 'Missing Phase 4 columns (last_error, post_url)');
  END IF;

  IF nullable_correct < 2 THEN
    issues := array_append(issues, 'persona_social_account_id or platform_id not nullable');
  END IF;

  IF NOT rls_enabled THEN
    issues := array_append(issues, 'RLS not enabled');
  END IF;

  IF policy_count = 0 THEN
    issues := array_append(issues, 'No RLS policies found');
  END IF;

  IF idx_count < 3 THEN
    issues := array_append(issues, 'Missing required indexes');
  END IF;

  -- Print summary as a result set
  RAISE NOTICE '========================================';
  RAISE NOTICE 'campaign_posts Schema Verification Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Columns: %', col_count;
  RAISE NOTICE 'Phase 4 Columns: %/2', phase4_cols;
  RAISE NOTICE 'Nullable Columns Correct: %/2', nullable_correct;
  RAISE NOTICE 'Indexes: %', idx_count;
  RAISE NOTICE 'RLS Enabled: %', rls_enabled;
  RAISE NOTICE 'RLS Policies: %', policy_count;
  RAISE NOTICE 'Triggers: %', trigger_count;
  RAISE NOTICE '';
  
  IF array_length(issues, 1) IS NULL THEN
    RAISE NOTICE '✓ SCHEMA IS VALID - All checks passed!';
  ELSE
    RAISE NOTICE '✗ ISSUES FOUND:';
    FOR i IN 1..array_length(issues, 1) LOOP
      RAISE NOTICE '  - %', issues[i];
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'Run supabase/scripts/sync_schema.sql to fix issues.';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- Final summary as query result
SELECT 
  '9. Summary' as check_section,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaign_posts') as total_columns,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaign_posts' AND column_name IN ('last_error', 'post_url')) as phase4_columns,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaign_posts' AND column_name IN ('persona_social_account_id', 'platform_id') AND is_nullable = 'YES') as nullable_correct,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'campaign_posts') as indexes,
  (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_posts') as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaign_posts') as policies,
  (SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.campaign_posts'::regclass AND tgisinternal = false) as triggers;

