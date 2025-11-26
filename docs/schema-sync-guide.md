# Database Schema Sync Guide

## Overview

This guide helps you sync your Supabase database structure with the expected schema from all migrations, particularly for Phase 4 Reddit posting features.

## Quick Sync

Run the comprehensive sync script:

```bash
# Using Supabase CLI
supabase db reset  # Resets to latest migrations (recommended for dev)

# Or apply specific sync migration
supabase migration up
```

## Manual Sync

If you need to manually sync without resetting:

1. **Run the sync script**:
   ```sql
   -- Execute supabase/scripts/sync_schema.sql
   ```

2. **Verify the schema**:
   ```sql
   -- Execute supabase/migrations/202511270200_verify_schema.sql
   ```

## Expected Schema for `campaign_posts`

### Required Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `campaign_id` | uuid | NO | - | Foreign key to campaigns |
| `persona_id` | uuid | NO | - | Foreign key to personas |
| `persona_social_account_id` | uuid | YES | - | Foreign key to persona_social_accounts (nullable) |
| `platform_id` | text | YES | - | Platform identifier (nullable) |
| `status` | text | NO | 'draft' | Post status |
| `scheduled_for` | timestamptz | YES | - | Scheduled posting time |
| `posted_at` | timestamptz | YES | - | Actual posting time |
| `post_external_id` | text | YES | - | Platform-specific post ID |
| `post_url` | text | YES | - | URL to the posted content (Phase 4) |
| `content_json` | jsonb | NO | - | Post content (title, text, etc.) |
| `media_assets` | jsonb | NO | '[]' | Media attachments |
| `platform_options` | jsonb | NO | '{}' | Platform-specific options (subreddit, etc.) |
| `created_by` | text | NO | 'user' | Creator type |
| `error_message` | text | YES | - | Error message (legacy) |
| `last_error` | text | YES | - | Last posting error (Phase 4) |
| `retry_count` | integer | NO | 0 | Number of retry attempts |
| `last_attempt_at` | timestamptz | YES | - | Last posting attempt time |
| `workflow_state` | jsonb | NO | '{}' | Workflow metadata |
| `created_at` | timestamptz | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | NO | now() | Update timestamp |

### Required Indexes

- `campaign_posts_campaign_idx` on `campaign_id`
- `campaign_posts_persona_account_idx` on `persona_social_account_id` (partial, where not null)
- `campaign_posts_status_idx` on `status`
- `campaign_posts_platform_idx` on `platform_id` (partial, where not null)
- `campaign_posts_scheduled_for_idx` on `scheduled_for` (partial, where scheduled)

### Required RLS

- **Enabled**: Yes
- **Policy**: "Users can manage posts for their own campaigns"
  - Users can only access posts for campaigns they own
  - Verified through `campaigns.user_id = auth.uid()`

### Required Triggers

- `set_campaign_posts_updated_at` - Updates `updated_at` on row update

## Verification Queries

### Check Column Existence

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_posts'
ORDER BY ordinal_position;
```

### Check Phase 4 Columns Specifically

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_posts'
  AND column_name IN ('last_error', 'post_url')
ORDER BY column_name;
```

### Check Nullable Constraints

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_posts'
  AND column_name IN ('persona_social_account_id', 'platform_id');
```

Expected: Both should be `YES` (nullable).

### Check Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campaign_posts'
ORDER BY indexname;
```

### Check RLS

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'campaign_posts';
```

Expected: `rowsecurity = true`

## Common Issues

### Issue: Columns Missing

**Solution**: Run `supabase/scripts/sync_schema.sql`

### Issue: Columns Not Nullable When They Should Be

**Solution**: The sync script handles this automatically. If manual fix needed:
```sql
ALTER TABLE public.campaign_posts
  ALTER COLUMN persona_social_account_id DROP NOT NULL,
  ALTER COLUMN platform_id DROP NOT NULL;
```

### Issue: RLS Policy Missing

**Solution**: The sync script creates it. If manual fix needed, see the policy creation in `sync_schema.sql`

### Issue: Indexes Missing

**Solution**: The sync script creates all required indexes with `CREATE INDEX IF NOT EXISTS`

## Migration Order

Migrations should be applied in this order:

1. `001_create_profiles_table.sql`
2. `202511251400_social_integration.sql` (creates campaign_posts)
3. `202511251530_oauth_support.sql`
4. `202511261530_campaign_generation_jobs.sql` (makes columns nullable)
5. `202511270000_campaign_posts_posting_metadata.sql` (adds Phase 4 columns)
6. `202511270100_sync_campaign_posts_schema.sql` (sync/verify)

## Production Deployment

For production, always:

1. **Test migrations locally first**
2. **Backup database before applying**
3. **Apply migrations in order**
4. **Verify schema after deployment**
5. **Monitor for errors**

```bash
# Production deployment checklist
supabase db dump > backup.sql  # Backup
supabase migration up          # Apply migrations
# Run verification queries
# Monitor application logs
```

## Troubleshooting

If sync script fails:

1. Check Supabase logs for specific errors
2. Verify you have necessary permissions
3. Ensure all prerequisite tables exist (campaigns, personas, etc.)
4. Check for conflicting constraints
5. Review migration history: `supabase migration list`

For detailed error investigation, run the verification script and compare output with expected schema above.

