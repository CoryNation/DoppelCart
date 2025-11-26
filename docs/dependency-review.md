# Dependency Review
**Date:** 2025-01-28

## Summary

Review of `package.json` dependencies to identify unused or potentially unnecessary packages.

---

## Dependencies Analysis

### ✅ Used Dependencies

| Package | Usage | Notes |
|---------|-------|-------|
| `@hookform/resolvers` | Form validation with react-hook-form | ✅ Used |
| `@radix-ui/react-progress` | Progress indicators | ✅ Used |
| `@radix-ui/react-slot` | Component composition | ✅ Used |
| `@radix-ui/react-switch` | Switch components | ✅ Used |
| `@supabase/ssr` | Supabase SSR support | ✅ Used |
| `@supabase/supabase-js` | Supabase client | ✅ Used |
| `class-variance-authority` | Component variant utilities | ✅ Used |
| `clsx` | Conditional class names | ✅ Used |
| `date-fns` | Date formatting (6 files) | ✅ Used |
| `lucide-react` | Icons | ✅ Used |
| `next` | Framework | ✅ Used |
| `openai` | OpenAI API client | ✅ Used |
| `react` | Framework | ✅ Used |
| `react-dom` | Framework | ✅ Used |
| `react-hook-form` | Form handling | ✅ Used |
| `zod` | Schema validation | ✅ Used |

---

### ⚠️ Potentially Unused Dependencies

| Package | Status | Recommendation |
|---------|--------|----------------|
| `@modelcontextprotocol/sdk` | ⚠️ Only in `github-mcp-js` | Remove if `github-mcp-js` is not needed |
| `node-fetch` | ⚠️ Only in `github-mcp-js` | Remove if `github-mcp-js` is not needed (Next.js 15 has native fetch) |

---

## Findings

### 1. `@modelcontextprotocol/sdk` (v1.22.0)
- **Found in:** `github-mcp-js` file only
- **Status:** Appears to be a test/example file
- **Recommendation:** 
  - If `github-mcp-js` is not part of the production app, remove both the file and the dependency
  - If it's needed, document its purpose

### 2. `node-fetch` (v3.3.2)
- **Found in:** `github-mcp-js` file only
- **Status:** Next.js 15 has native `fetch` support, so this is likely unnecessary
- **Recommendation:**
  - Remove if `github-mcp-js` is not needed
  - If needed, consider using native `fetch` instead

### 3. `github-mcp-js` File
- **Location:** Root directory
- **Status:** Appears to be a standalone test/example file
- **Recommendation:**
  - Review if this file is needed for production
  - If not, remove it along with its dependencies

---

## Action Items

1. **Review `github-mcp-js` file:**
   - Determine if it's needed for production
   - If not, remove it

2. **Remove unused dependencies (if `github-mcp-js` is not needed):**
   ```bash
   npm uninstall @modelcontextprotocol/sdk node-fetch
   ```

3. **Alternative (if `github-mcp-js` is needed):**
   - Move `github-mcp-js` to a `scripts/` or `examples/` directory
   - Document its purpose
   - Consider using native `fetch` instead of `node-fetch`

---

## Notes

- All other dependencies are actively used in the codebase
- `date-fns` is used in 6 different files for date formatting
- No other obvious unused dependencies found
- All Radix UI components are used in the UI component library

---

## Estimated Impact

**If removing unused dependencies:**
- Bundle size reduction: ~500KB (estimated)
- Faster install times
- Cleaner dependency tree

**Risk:** Low - These dependencies are only used in a single test file.

