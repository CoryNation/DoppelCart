# Model Selection Logic Audit
**Date:** 2025-01-28  
**Purpose:** Verify all AI operations use the correct models based on environment variables

---

## Environment Variables Set

```
OPENAI_MODEL_PERSONA="gpt-4.1-mini"
OPENAI_MODEL_DEFAULT="gpt-4o-mini"
RESEARCH_CLARIFY_MODEL="gpt-4o-mini"
RESEARCH_REASONING_MODEL="gpt-4o"
OPENAI_CAMPAIGN_MODEL="gpt-4o-mini"
```

---

## Model Selection Analysis

### ✅ Research Clarify (`/api/research/clarify`)
**File:** `app/api/research/clarify/route.ts`
**Model Selection:**
```typescript
model: getClarifyModel()
// Which returns: process.env.RESEARCH_CLARIFY_MODEL || "gpt-4o-mini"
```
**Result:** ✅ Uses `RESEARCH_CLARIFY_MODEL="gpt-4o-mini"` ✓

---

### ✅ Research Clarify Continue (`/api/research/clarify/continue`)
**File:** `app/api/research/clarify/continue/route.ts`
**Model Selection:**
```typescript
model: getClarifyModel()
// Which returns: process.env.RESEARCH_CLARIFY_MODEL || "gpt-4o-mini"
```
**Result:** ✅ Uses `RESEARCH_CLARIFY_MODEL="gpt-4o-mini"` ✓

---

### ⚠️ Research Plan (`/api/research/plan`)
**File:** `app/api/research/plan/route.ts`
**Model Selection:**
```typescript
callChatModel({ ... }) // No model specified
// Falls back to: process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini"
```
**Result:** ✅ Uses `OPENAI_MODEL_DEFAULT="gpt-4o-mini"` ✓
**Note:** This is a planning operation, could potentially use a reasoning model, but current setup is fine.

---

### ⚠️ Research Analyze (`/api/research/analyze`)
**File:** `app/api/research/analyze/route.ts`
**Model Selection:**
```typescript
callChatModel({ ... }) // No model specified
// Falls back to: process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini"
```
**Result:** ✅ Uses `OPENAI_MODEL_DEFAULT="gpt-4o-mini"` ✓
**Note:** This is pattern analysis, could potentially use reasoning model, but current setup is fine.

---

### ✅ Research Synthesize (`/api/research/synthesize`)
**File:** `app/api/research/synthesize/route.ts`
**Model Selection:**
```typescript
const model = process.env.RESEARCH_REASONING_MODEL || 
              process.env.OPENAI_MODEL_DEFAULT || 
              "gpt-4o-mini"
```
**Result:** ✅ Uses `RESEARCH_REASONING_MODEL="gpt-4o"` ✓

---

### ❌ Persona from Research (`/api/personas/from-research`)
**File:** `app/api/personas/from-research/route.ts`
**Model Selection:**
```typescript
const personaModel = process.env.PERSONA_MODEL ||
                     process.env.RESEARCH_REASONING_MODEL ||
                     "gpt-5.1-thinking"
```
**Issue:** 
- Code checks for `PERSONA_MODEL` (not set)
- Falls back to `RESEARCH_REASONING_MODEL="gpt-4o"` (not intended for persona generation)
- Should check `OPENAI_MODEL_PERSONA="gpt-4.1-mini"` instead

**Result:** ❌ Will use `gpt-4o` instead of `gpt-4.1-mini`

---

### ✅ Persona Builder (`/api/persona-builder`)
**File:** `app/api/persona-builder/route.ts`
**Model Selection:**
```typescript
callPersonaBuilderModel(messages)
// Which uses: process.env.OPENAI_MODEL_PERSONA || "gpt-4o-mini"
```
**Result:** ✅ Uses `OPENAI_MODEL_PERSONA="gpt-4.1-mini"` ✓

---

### ✅ Campaign Generation (`/api/campaigns/[id]/generate`)
**File:** `src/lib/openaiCampaign.ts`
**Model Selection:**
```typescript
const model = process.env.OPENAI_CAMPAIGN_MODEL ||
              process.env.OPENAI_MODEL_DEFAULT ||
              "gpt-4o-mini"
```
**Result:** ✅ Uses `OPENAI_CAMPAIGN_MODEL="gpt-4o-mini"` ✓

---

### ✅ Resonance Research (`/api/resonance`)
**File:** `lib/openai.ts` → `runResonanceResearch()`
**Model Selection:**
```typescript
callChatModel({ ... }) // No model specified
// Falls back to: process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini"
```
**Result:** ✅ Uses `OPENAI_MODEL_DEFAULT="gpt-4o-mini"` ✓

---

## Issues Found

### 🔴 Critical: Persona from Research Route

**Problem:** The `/api/personas/from-research` route doesn't check `OPENAI_MODEL_PERSONA`.

**Current Logic:**
```typescript
PERSONA_MODEL → RESEARCH_REASONING_MODEL → "gpt-5.1-thinking"
```

**Expected Logic:**
```typescript
OPENAI_MODEL_PERSONA → RESEARCH_REASONING_MODEL → "gpt-4o-mini"
```

**Impact:** 
- Will use `gpt-4o` instead of `gpt-4.1-mini` for persona generation
- More expensive than intended
- Different model than persona builder route

**Fix Required:** Update `app/api/personas/from-research/route.ts` to check `OPENAI_MODEL_PERSONA` first.

---

## Summary

| Operation | Current Model | Expected Model | Status |
|-----------|--------------|----------------|--------|
| Research Clarify | `gpt-4o-mini` | `gpt-4o-mini` | ✅ |
| Research Plan | `gpt-4o-mini` | `gpt-4o-mini` | ✅ |
| Research Analyze | `gpt-4o-mini` | `gpt-4o-mini` | ✅ |
| Research Synthesize | `gpt-4o` | `gpt-4o` | ✅ |
| Persona from Research | `gpt-4o` ❌ | `gpt-4.1-mini` | ❌ **FIX NEEDED** |
| Persona Builder | `gpt-4.1-mini` | `gpt-4.1-mini` | ✅ |
| Campaign Generation | `gpt-4o-mini` | `gpt-4o-mini` | ✅ |
| Resonance Research | `gpt-4o-mini` | `gpt-4o-mini` | ✅ |

---

## Recommendations

1. **Fix Persona from Research route** - Update to use `OPENAI_MODEL_PERSONA`
2. **Consider Research Plan/Analyze** - Could potentially use reasoning model, but current setup is fine for cost optimization
3. **Document model selection** - Add comments explaining why each operation uses its specific model





