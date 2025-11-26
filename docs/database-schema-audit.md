# Database Schema Audit Report
**Date:** 2025-01-28  
**Purpose:** Verify database schema matches expected architecture and recent code changes

---

## Executive Summary

This audit compares:
1. **Expected Schema** (from `docs/domain-model.md` and `docs/architecture.md`)
2. **Actual Migrations** (from `supabase/migrations/`)
3. **Code Usage** (from grep/search of `.from()` calls)

**Status:** ⚠️ **Issues Found** - Several mismatches between code and schema

---

## Tables Found in Migrations

### ✅ Core Tables (Exist in Migrations)

| Table | Migration | Status |
|-------|-----------|--------|
| `profiles` | `001_create_profiles_table.sql` | ✅ Exists |
| `personas` | ❌ **NOT FOUND** | ⚠️ **MISSING** |
| `social_platforms` | `202511251400_social_integration.sql` | ✅ Exists |
| `persona_social_accounts` | `202511251400_social_integration.sql` | ✅ Exists |
| `campaigns` | `202511251400_social_integration.sql` | ✅ Exists |
| `campaign_posts` | `202511251400_social_integration.sql` | ✅ Exists |
| `campaign_generation_jobs` | `202511261530_campaign_generation_jobs.sql` | ✅ Exists |
| `engagement_items` | `202511251400_social_integration.sql` | ✅ Exists |
| `social_oauth_sessions` | `202511251400_social_integration.sql` | ✅ Exists |
| `oauth_states` | `202511251530_oauth_support.sql` | ✅ Exists |
| `resonance_research` | `202511270300_create_resonance_research.sql` | ✅ Exists |
| `resonance_research_personas` | `202511270300_create_resonance_research.sql` | ✅ Exists |
| `research_tasks` | `202511280000_create_research_tasks.sql` | ✅ Exists |

---

## ⚠️ Critical Issues

### 1. **MISSING: `personas` Table**
**Severity:** 🔴 **CRITICAL**

**Evidence:**
- Referenced in domain model as core entity
- Used extensively in code (20+ references)
- Referenced by foreign keys in:
  - `persona_social_accounts.persona_id`
  - `campaigns.persona_id`
  - `resonance_research_personas.persona_id`
  - `social_oauth_sessions.persona_id`
  - `oauth_states.persona_id`

**Code References:**
- `app/api/personas/route.ts`
- `app/api/campaigns/route.ts`
- `app/api/resonance/link-persona/route.ts`
- `app/agents/new/actions.ts`
- `app/agents/[id]/page.tsx`
- And many more...

**Impact:** 
- Application will fail on any persona-related operations
- Foreign key constraints will fail
- Core functionality broken

**Action Required:** Create `personas` table migration

---

### 2. **MISMATCH: `agents` Table Referenced But Not Found**
**Severity:** 🟡 **MEDIUM**

**Evidence:**
- Code references `agents` table in:
  - `app/agents/[id]/channels/actions.ts` (line 25)
  - `app/agents/new/actions.ts` (line 20, 54)
  - `app/agents/[id]/channels/page.tsx` (line 27)

**Possible Explanations:**
1. `agents` is an alias/legacy name for `personas`
2. Missing migration for `agents` table
3. Code needs to be updated to use `personas`

**Action Required:** Clarify relationship between `agents` and `personas`

---

### 3. **MISMATCH: `channels` and `agent_channels` Tables**
**Severity:** 🟡 **MEDIUM**

**Evidence:**
- Code references:
  - `channels` table in `app/agents/[id]/channels/page.tsx` (line 44)
  - `agent_channels` table in:
    - `app/agents/[id]/channels/actions.ts` (line 38, 48)
    - `app/agents/[id]/channels/page.tsx` (line 54)

**Possible Explanations:**
1. These should map to `social_platforms` and `persona_social_accounts`
2. Missing migrations for these tables
3. Legacy code that needs refactoring

**Action Required:** Determine if these are legacy tables or need to be created

---

## Tables Expected But Not Found

### From Domain Model:
- ❌ `content_plans` - Not found in migrations
- ❌ `content_items` - Not found in migrations  
- ❌ `assets` - Not found in migrations
- ❌ `scheduled_posts` - Not found in migrations (but `campaign_posts` has scheduling)
- ❌ `analytics_snapshots` - Not found in migrations

**Note:** These may be:
1. Planned but not yet implemented
2. Represented by other tables (e.g., `campaign_posts` might be `content_items`)
3. Need to be created

---

## Tables in Migrations But Not in Domain Model

### Additional Tables Found:
- ✅ `engagement_items` - Not in domain model but exists
- ✅ `social_oauth_sessions` - OAuth flow management
- ✅ `oauth_states` - OAuth state tracking
- ✅ `resonance_research` - Research feature
- ✅ `resonance_research_personas` - Research-persona linking
- ✅ `research_tasks` - Research task tracking
- ✅ `campaign_generation_jobs` - AI generation jobs

**Status:** These appear to be newer features not yet documented in domain model

---

## Foreign Key Relationships

### Verified Relationships:
✅ `persona_social_accounts.persona_id` → `personas.id` (but personas table missing!)
✅ `campaigns.persona_id` → `personas.id` (but personas table missing!)
✅ `campaigns.user_id` → `auth.users.id`
✅ `campaign_posts.campaign_id` → `campaigns.id`
✅ `campaign_posts.persona_social_account_id` → `persona_social_accounts.id`
✅ `resonance_research_personas.persona_id` → `personas.id` (but personas table missing!)
✅ `resonance_research_personas.research_id` → `resonance_research.id`
✅ `research_tasks.user_id` → `auth.users.id`

### Missing Relationships:
❌ `personas.user_id` → `auth.users.id` (table doesn't exist)

---

## Row Level Security (RLS) Status

### ✅ Tables with RLS Enabled:
- `profiles`
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

**Status:** ✅ All existing tables have RLS enabled

---

## Recommendations

### 🔴 Immediate Actions (Critical)

1. **Create `personas` Table Migration**
   - This is blocking core functionality
   - Required by multiple foreign keys
   - Used extensively throughout codebase

2. **Verify `agents` vs `personas` Relationship**
   - Determine if `agents` is legacy code
   - Update code to use `personas` if needed
   - Or create `agents` table if it's a separate entity

### 🟡 Short-term Actions (Important)

3. **Clarify `channels` and `agent_channels`**
   - Map to existing tables or create migrations
   - Update code references

4. **Update Domain Model Documentation**
   - Add new tables (research, engagement, etc.)
   - Remove or clarify missing tables (content_plans, etc.)
   - Document actual schema vs. planned schema

### 🟢 Long-term Actions (Nice to Have)

5. **Schema Documentation**
   - Create comprehensive schema diagram
   - Document all relationships
   - Keep domain model in sync with migrations

6. **Migration Audit Script**
   - Create script to verify all code references match schema
   - Run as part of CI/CD

---

## Proposed `personas` Table Schema

Based on code usage and foreign key requirements:

```sql
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  -- Add other persona fields as needed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.personas enable row level security;

create policy "Users can manage their own personas"
  on public.personas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists personas_user_id_idx
  on public.personas (user_id);
```

---

## Next Steps

1. ✅ Review this audit with team
2. ⏳ Create missing `personas` table migration
3. ⏳ Resolve `agents`/`channels`/`agent_channels` references
4. ⏳ Update domain model documentation
5. ⏳ Test all foreign key relationships
6. ⏳ Verify RLS policies work correctly

---

## Files Analyzed

- `docs/domain-model.md` - Expected schema
- `docs/architecture.md` - Architecture overview
- `supabase/migrations/*.sql` - All migration files
- Codebase grep for `.from()` calls - Actual usage

---

**Report Generated:** 2025-01-28  
**Next Review:** After implementing fixes

