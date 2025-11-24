# DoppleCart – Developer Principles
These principles guide development for DoppleCart, whether the code is written by a human or an AI assistant (Cursor, Antigravity, etc.). They exist to keep the system consistent, maintainable, and scalable.

# General Coding Philosophy
-	Use TypeScript in strict mode; avoid any.
-	Prefer Next.js App Router server components for data fetching.
-	Use server actions for mutations instead of client-side calls where possible.
-	Keep components small and focused.
-	Use Tailwind CSS for styling; avoid large custom CSS unless necessary.
-	Optimize for clarity over cleverness.

# Data & Supabase Rules
-	All data access must:
  -	Use the Supabase client (@supabase/supabase-js or auth helpers).
  -	Respect Row Level Security (RLS).
  -	Avoid raw SQL in React components.
-	Never access or expose data that belongs to another user.
-	All schema changes must go through /supabase/migrations.
-	Keep queries:
  -	Explicit (no magic)
  -	Typed (use generated types where possible)
  -	Close to the domain model defined in docs/domain-model.md
- Example (conceptual):
  // Good: typed Supabase query in a server utility
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId);

# AI Layer Principles
-	All AI usage must live in lib/ai/ and never be called directly from React components.
-	AI modules should be split by responsibility, e.g.:
  -	lib/ai/persona.ts – personas, bios, tone shaping
  -	lib/ai/content.ts – content ideas, captions, content plans
  -	lib/ai/images.ts – image prompts and style handling
-	Prompts must:
  -	Be constructed programmatically from structured inputs.
  -	Include persona/context data where appropriate.
  -	Return structured outputs (objects with named fields) instead of long free-text paragraphs whenever possible.
-	Avoid duplicating prompts in many places; centralize shared logic in lib/ai.

# Security Guidelines
-	Never store secrets (API keys, tokens) in client-side code or NEXT_PUBLIC_* env vars.
-	OAuth / platform access tokens:
  -	Must be stored securely (encrypted at rest or using Supabase vault mechanisms).
  -	Must only be used from server-side code.
-	Store the minimum necessary data for posting and analytics.
-	Handle errors from external APIs gracefully:
  -	Expired tokens
  -	Rate limits
  -	Network errors
-	Error logs must not contain secrets or highly sensitive data.

# Architectural Guardrails
-	No large/global refactors unless explicitly requested in the task.
-	Avoid adding new top-level folders that conflict with:
  -	/app
  -	/lib
  -	/supabase
  -	/docs
-	Use API route handlers (app/api/*) only for:
  -	Webhooks
  -	OAuth callbacks
  -	External API bridges
All internal CRUD and mutation flows should use server actions instead.

# Folder Structure Conventions
- Baseline structure:
  /app
    (authenticated routes under /app/app/)
    (public/unauth routes under /app/login or /app/(public))

  /lib
    /ai        ← all AI logic and model calls
    /supabase  ← Supabase clients and helpers
    /utils     ← general-purpose utilities

  /supabase
    /migrations  ← database migrations

  /docs
    product-vision.md
    architecture.md
    domain-model.md
    dev-principles.md
-	Keep related logic close together.
-	Avoid overly deep nesting and circular dependencies between modules.

# Testing & Reliability
-	After significant AI-generated changes, run:
  -	npm run lint (if configured)
  -	npm run build
  -	Any test commands once tests exist
-	Keep the main branch deployable at all times.
-	Use feature branches for non-trivial changes.
-	Break large changes into smaller tasks:
  -	One feature / refactor per prompt or per branch where feasible.
-	If a change affects many files:
  -	Require a high-level plan first (list of files and responsibilities).

# Using Cursor (or other AI dev tools) on this Repo
  When implementing a new feature with Cursor or another AI assistant, use this pattern:
  - Task:
    -	Clear, single-scope description of what to build or change.
  - Context:
    -	“Read docs/product-vision.md, docs/architecture.md, and docs/domain-model.md.”
    -	“Follow the guidelines in docs/dev-principles.md.”

- Requirements (example):
  -	Implement route /app/personas as an authenticated page.
  -	Fetch the current user and their personas via Supabase.
  -	Render a table of personas plus a form to create a new one.
  -	Use a server action for insertion and refresh data after submit.
- Output format:
  -	List the files you will create/update.
  -	Show full contents for each changed file.
  -	Note any new env vars, config, or migrations required.

# MCP Usage Guidelines
- Supabase MCP:
  - Use it to introspect schema, RLS, and generate strongly typed queries.
  - Do NOT run destructive migrations without proposing them in plain SQL for review.
  - Treat the existing `/supabase/migrations` as the source of truth.

- GitHub MCP:
  - Use it for PR review, diff analysis, and summarization.
  - Do NOT auto-merge based solely on AI judgment; human approval is required.

- Terminal / Shell tools:
  - Prefer building and testing (`npm run build`, `npm run lint`) after non-trivial codegen.
  - If commands fail, suggest minimal fixes scoped to the error.

- Environment:
  - Do NOT change env var naming conventions.
  - Do NOT add new env vars for Supabase; use the existing ones.

This structure keeps AI contributions consistent, reviewable, and aligned with DoppleCart’s architecture.