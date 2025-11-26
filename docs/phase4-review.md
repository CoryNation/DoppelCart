# Phase 4 Reddit Posting - Security & Correctness Review

## Critical Issues

### 1. **Scheduler Uses Service Role (Bypasses RLS) - Expected but Needs Verification**
   - **Location**: `supabase/functions/postScheduler/index.ts`
   - **Issue**: Uses `serviceRoleKey` which bypasses RLS. This is intentional for cron jobs, but we must ensure:
     - Only posts with `status = 'scheduled'` AND `scheduled_for <= now()` are processed
     - No way for users to manipulate scheduled_for to trigger immediate posts
   - **Status**: ✅ Currently safe - only processes `status = 'scheduled'` with time check
   - **Recommendation**: Add explicit validation that `scheduled_for` is not in the future

### 2. **Incorrect Encryption Implementation in Scheduler**
   - **Location**: `supabase/functions/postScheduler/index.ts:39-84`
   - **Issue**: The `decryptSecret` function has incorrect AES-GCM decryption:
     - Auth tag is extracted but then concatenated with ciphertext incorrectly
     - Should use separate `tag` parameter in decrypt options, not concatenate
   - **Impact**: Token decryption will fail, preventing posting
   - **Fix Required**: Update to match `lib/security/encryption.ts` pattern or use shared encryption utility

### 3. **Account Matching Logic - Potential Wrong Account Risk**
   - **Location**: `supabase/functions/postScheduler/index.ts:251-257`
   - **Issue**: Queries by `persona_id` + `platform_id` only, but doesn't verify:
     - The account belongs to the same user as the campaign
     - The account matches `post.persona_social_account_id` if it exists
   - **Risk**: If a persona has multiple Reddit accounts, could post to wrong one
   - **Fix**: Prefer `post.persona_social_account_id` if set, otherwise find by persona_id + verify user ownership

### 4. **Token Refresh Doesn't Persist Encrypted Tokens in Scheduler**
   - **Location**: `supabase/functions/postScheduler/index.ts:154-161`
   - **Issue**: Updates `access_token_expires_at` but doesn't update `access_token_encrypted` or `refresh_token_encrypted`
   - **Impact**: Next refresh will use old token, causing failures
   - **Fix**: Must encrypt and store new tokens after refresh

### 5. **redditClient.ts Has Redundant Token Fetch**
   - **Location**: `lib/social/redditClient.ts:166-184`
   - **Issue**: After refreshing token, we fetch the account again to decrypt. The `refreshRedditTokenIfNeeded` already returns updated account with tokens.
   - **Impact**: Unnecessary database query, but not a security issue
   - **Fix**: Use tokens from `updatedAccount` directly if available

### 6. **Missing Validation: Subreddit Format**
   - **Location**: Both `redditClient.ts` and `postScheduler/index.ts`
   - **Issue**: No validation that subreddit name is valid (e.g., no leading/trailing slashes, no special chars)
   - **Risk**: Could submit to invalid subreddit or cause API errors
   - **Fix**: Add subreddit sanitization (strip "r/" prefix, validate format)

## Recommended Improvements

### 1. **Add Explicit User Ownership Verification in Scheduler**
   - Even though RLS is bypassed, add explicit join to verify:
     ```sql
     SELECT cp.* FROM campaign_posts cp
     INNER JOIN campaigns c ON c.id = cp.campaign_id
     INNER JOIN personas p ON p.id = cp.persona_id
     WHERE cp.status = 'scheduled' AND c.user_id IS NOT NULL
     ```
   - This adds defense-in-depth

### 2. **Use persona_social_account_id When Available**
   - **Location**: `postScheduler/index.ts:251`
   - **Current**: Always queries by persona_id + platform_id
   - **Better**: If `post.persona_social_account_id` is set, use that directly
   - **Fallback**: Only query by persona_id if account_id is null

### 3. **Add Retry Logic with Exponential Backoff**
   - **Location**: Both posting functions
   - **Current**: Single attempt, then mark as failed
   - **Better**: Retry up to 3 times with exponential backoff for transient errors (rate limits, network issues)
   - **Update**: Increment `retry_count` field

### 4. **Better Error Messages for Users**
   - **Location**: `redditClient.ts`, scheduler
   - **Current**: Generic "Failed to submit post to Reddit"
   - **Better**: Parse Reddit API errors and provide actionable messages:
     - "Subreddit not found" → "Check subreddit name"
     - "Rate limit exceeded" → "Please wait before posting again"
     - "Forbidden" → "Account may need re-authentication"

### 5. **Add Posting Audit Log**
   - **Location**: New table or `workflow_state` field
   - **Purpose**: Track who/what triggered each post (scheduler vs manual)
   - **Fields**: `triggered_by` (scheduler/user_id), `triggered_at`, `ip_address` (for manual posts)

### 6. **Validate Content Before Posting**
   - **Location**: `redditClient.ts:submitRedditTextPost`
   - **Current**: No validation of title/text length
   - **Reddit Limits**: Title max 300 chars, text max 40,000 chars
   - **Fix**: Validate and truncate with warning

### 7. **Handle Multiple Reddit Accounts Per Persona**
   - **Location**: Scheduler and future post-now route
   - **Current**: `.single()` assumes one account
   - **Better**: If multiple accounts exist, prefer the one matching `persona_social_account_id`, or most recently used

## Optional Refactors

### 1. **Extract Shared Posting Logic**
   - **Current**: Duplicate logic in scheduler and (future) post-now route
   - **Proposal**: Create `lib/campaigns/posting.ts` with:
     - `postCampaignContentToReddit(contentId: string, userId: string)`
     - Handles all validation, account lookup, token refresh, posting, DB updates
   - **Benefits**: Single source of truth, easier testing, consistent behavior

### 2. **Unify Encryption Helpers**
   - **Current**: Different implementations in Node.js (`lib/security/encryption.ts`) and Deno (scheduler)
   - **Proposal**: Create shared encryption utility that works in both environments, or use Supabase Vault for token storage

### 3. **Add Type Safety for Platform Options**
   - **Current**: `platform_options` is `Record<string, unknown>`
   - **Proposal**: Create typed interfaces:
     ```typescript
     interface RedditPlatformOptions {
       subreddit: string;
       flair?: string;
       nsfw?: boolean;
     }
     ```

### 4. **Improve Scheduler Error Recovery**
   - **Current**: If one post fails, others still process (good)
   - **Enhancement**: Add dead-letter queue for posts that fail repeatedly
   - **Track**: Posts that fail 3+ times should be marked for manual review

### 5. **Add Posting Status Webhooks/Notifications**
   - **Future**: Notify users when scheduled posts succeed/fail
   - **Implementation**: Add to `workflow_state` or separate notifications table

## Security Checklist

✅ **No secrets in client code** - All token operations server-side only  
✅ **Encrypted tokens at rest** - Using `access_token_encrypted` column  
✅ **RLS enforced** - User-facing routes use RLS, scheduler uses service role (intentional)  
⚠️ **Token refresh security** - Need to ensure refreshed tokens are properly encrypted before storage  
✅ **Error messages sanitized** - No tokens/secrets in error responses  
⚠️ **Account matching** - Need to verify correct account is used (see Critical Issue #3)  
✅ **Input validation** - Subreddit and content should be validated (see Recommended #6)  

## Missing Implementation

- ❌ `/api/campaigns/content/[contentId]/post-now` route (not yet created)
- ❌ UI "Post to Reddit now" button (not yet implemented)
- ❌ Shared posting helper function (recommended refactor)

## Summary

**Must Fix Before Production:**
1. Fix encryption implementation in scheduler
2. Fix token persistence after refresh in scheduler
3. Improve account matching logic
4. Add subreddit validation

**Should Fix Soon:**
1. Add user ownership verification in scheduler
2. Use persona_social_account_id when available
3. Better error messages
4. Content length validation

**Nice to Have:**
1. Shared posting logic
2. Retry logic
3. Audit logging
4. Type safety improvements

