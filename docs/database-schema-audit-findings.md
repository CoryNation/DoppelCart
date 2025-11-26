# Database Schema Audit - Critical Findings
**Date:** 2025-01-28  
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## 🔴 Critical Issue #1: Missing `personas` Table

### Problem
The `personas` table is **referenced by foreign keys in multiple migrations** but **does not exist** in any migration file.

### Evidence
Foreign key references found in:
- `persona_social_accounts.persona_id` → `personas.id`
- `campaigns.persona_id` → `personas.id`
- `resonance_research_personas.persona_id` → `personas.id`
- `social_oauth_sessions.persona_id` → `personas.id`
- `oauth_states.persona_id` → `personas.id`

Code references in 20+ files:
- `app/api/personas/route.ts`
- `app/api/campaigns/route.ts`
- `app/agents/new/actions.ts`
- And many more...

### Impact
- **Database migrations will fail** when trying to create foreign keys
- **Application will crash** on any persona-related operation
- **Core functionality is broken**

### Solution
✅ **Created:** `supabase/migrations/202511290000_create_personas_table.sql`

This migration creates the `personas` table with:
- Required fields based on code usage
- Proper RLS policies
- Indexes for performance
- Updated_at trigger

**Action Required:** Run this migration in your Supabase instance.

---

## 🟡 Issue #2: `agents` Table Referenced But Not Found

### Problem
Code references an `agents` table that doesn't exist in migrations.

### Evidence
Found in:
- `app/agents/[id]/channels/actions.ts`
- `app/agents/new/actions.ts`
- `app/agents/[id]/channels/page.tsx`

### Analysis
Looking at `app/agents/new/actions.ts`, it appears:
1. An `agents` record is created first
2. Then a `personas` record is created with `agent_id` reference
3. This suggests `agents` is a container/wrapper for `personas`

### Possible Solutions

**Option A:** `agents` is legacy/planned but not yet implemented
- Create `agents` table migration
- Or refactor code to remove `agents` dependency

**Option B:** `agents` should be merged into `personas`
- Update code to remove `agents` references
- Use `personas` directly

**Option C:** `agents` is a separate entity
- Create proper `agents` table migration
- Document relationship with `personas`

### Recommendation
Based on the code structure, it looks like `agents` might be a higher-level concept. However, since:
- The domain model only mentions `personas`
- Most code uses `personas` directly
- Foreign keys reference `personas`, not `agents`

**Recommended Action:** Create `agents` table if it's needed, or refactor code to remove it.

---

## 🟡 Issue #3: `channels` and `agent_channels` Tables

### Problem
Code references `channels` and `agent_channels` tables that don't exist.

### Evidence
- `app/agents/[id]/channels/page.tsx` queries `channels` and `agent_channels`
- `app/agents/[id]/channels/actions.ts` upserts to `agent_channels`

### Analysis
Looking at the existing schema:
- `social_platforms` table exists (e.g., 'reddit', 'facebook')
- `persona_social_accounts` links personas to platforms

### Possible Solutions

**Option A:** `channels` = `social_platforms`, `agent_channels` = `persona_social_accounts`
- Update code to use existing tables
- Map `agent_id` to `persona_id`

**Option B:** These are separate concepts
- Create `channels` and `agent_channels` migrations
- Document relationship with existing tables

**Option C:** Legacy code
- Remove references
- Use `social_platforms` and `persona_social_accounts` directly

### Recommendation
**Most Likely:** These should map to existing `social_platforms` and `persona_social_accounts` tables. The code may need refactoring to use the correct table names.

---

## 📊 Schema Comparison Summary

### Tables in Migrations ✅
- `profiles`
- `social_platforms`
- `persona_social_accounts`
- `campaigns`
- `campaign_posts`
- `campaign_generation_jobs`
- `engagement_items`
- `social_oauth_sessions`
- `oauth_states`
- `resonance_research`
- `resonance_research_personas`
- `research_tasks`

### Tables Referenced in Code But Missing ❌
- `personas` - **CRITICAL** (now has migration created)
- `agents` - **MEDIUM** (needs decision)
- `channels` - **MEDIUM** (likely maps to `social_platforms`)
- `agent_channels` - **MEDIUM** (likely maps to `persona_social_accounts`)

### Tables in Domain Model But Not Found ⚠️
- `content_plans` - May be represented by `campaigns`
- `content_items` - May be represented by `campaign_posts`
- `assets` - Not implemented yet
- `scheduled_posts` - Scheduling is in `campaign_posts`
- `analytics_snapshots` - Not implemented yet

---

## ✅ Immediate Actions Required

### 1. Apply `personas` Table Migration (CRITICAL)
```bash
# In Supabase dashboard or CLI
# Apply: supabase/migrations/202511290000_create_personas_table.sql
```

### 2. Verify Foreign Keys
After applying the migration, verify all foreign key constraints work:
- `persona_social_accounts.persona_id`
- `campaigns.persona_id`
- `resonance_research_personas.persona_id`
- `social_oauth_sessions.persona_id`
- `oauth_states.persona_id`

### 3. Decide on `agents` Table
- Option A: Create `agents` table migration
- Option B: Refactor code to remove `agents` references

### 4. Resolve `channels`/`agent_channels`
- Map to existing tables OR
- Create new migrations OR
- Refactor code

---

## 🔍 Verification Steps

After applying fixes:

1. **Test Foreign Keys:**
   ```sql
   -- Should not error
   SELECT * FROM persona_social_accounts 
   WHERE persona_id IN (SELECT id FROM personas LIMIT 1);
   ```

2. **Test RLS Policies:**
   ```sql
   -- As authenticated user, should only see own personas
   SELECT * FROM personas;
   ```

3. **Test Code Paths:**
   - Create a persona
   - Link persona to campaign
   - Link persona to social account
   - Link persona to research

---

## 📝 Notes

- All existing tables have RLS enabled ✅
- All foreign keys reference `personas` (which was missing) ✅
- The `personas` migration has been created and is ready to apply ✅
- Need to resolve `agents`/`channels` ambiguity

---

**Next Steps:**
1. Review this audit
2. Apply `personas` migration
3. Test foreign key relationships
4. Decide on `agents`/`channels` approach
5. Update domain model documentation

