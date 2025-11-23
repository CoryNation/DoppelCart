DoppleCart – Developer Principles
These principles guide development for DoppleCart, whether the code is written by a human or an AI assistant (Cursor, Antigravity, etc.). They exist to keep the system consistent, maintainable, and scalable.

1. General Coding Philosophy
1.	Use TypeScript in strict mode; avoid any.
2.	Prefer Next.js App Router server components for data fetching.
3.	Use server actions for mutations instead of client-side calls where possible.
4.	Keep components small and focused.
5.	Use Tailwind CSS for styling; avoid large custom CSS unless necessary.
6.	Optimize for clarity over cleverness.

2. Data & Supabase Rules
1.	All data access must:
1.1.	Use the Supabase client (@supabase/supabase-js or auth helpers).
1.2.	Respect Row Level Security (RLS).
1.3.	Avoid raw SQL in React components.
2.	Never access or expose data that belongs to another user.
3.	All schema changes must go through /supabase/migrations.
4.	Keep queries:
4.1.	Explicit (no magic)
4.2.	Typed (use generated types where possible)
4.3.	Close to the domain model defined in docs/domain-model.md
Example (conceptual):
// Good: typed Supabase query in a server utility
const { data: personas } = await supabase
  .from('personas')
  .select('*')
  .eq('user_id', userId);

3. AI Layer Principles
1.	All AI usage must live in lib/ai/ and never be called directly from React components.
2.	AI modules should be split by responsibility, e.g.:
2.1.	lib/ai/persona.ts – personas, bios, tone shaping
2.2.	lib/ai/content.ts – content ideas, captions, content plans
2.3.	lib/ai/images.ts – image prompts and style handling
3.	Prompts must:
3.1.	Be constructed programmatically from structured inputs.
3.2.	Include persona/context data where appropriate.
3.3.	Return structured outputs (objects with named fields) instead of long free-text paragraphs whenever possible.
4.	Avoid duplicating prompts in many places; centralize shared logic in lib/ai.

4. Security Guidelines
1.	Never store secrets (API keys, tokens) in client-side code or NEXT_PUBLIC_* env vars.
2.	OAuth / platform access tokens:
2.1.	Must be stored securely (encrypted at rest or using Supabase vault mechanisms).
2.2.	Must only be used from server-side code.
3.	Store the minimum necessary data for posting and analytics.
4.	Handle errors from external APIs gracefully:
4.1.	Expired tokens
4.2.	Rate limits
4.3.	Network errors
5.	Error logs must not contain secrets or highly sensitive data.

5. Architectural Guardrails
1.	No large/global refactors unless explicitly requested in the task.
2.	Avoid adding new top-level folders that conflict with:
2.1.	/app
2.2.	/lib
2.3.	/supabase
2.4.	/docs
3.	Use API route handlers (app/api/*) only for:
3.1.	Webhooks
3.2.	OAuth callbacks
3.3.	External API bridges
All internal CRUD and mutation flows should use server actions instead.

6. Folder Structure Conventions
Baseline structure:
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
•	Keep related logic close together.
•	Avoid overly deep nesting and circular dependencies between modules.

7. Testing & Reliability
1.	After significant AI-generated changes, run:
1.1.	npm run lint (if configured)
1.2.	npm run build
1.3.	Any test commands once tests exist
2.	Keep the main branch deployable at all times.
3.	Use feature branches for non-trivial changes.
4.	Break large changes into smaller tasks:
4.1.	One feature / refactor per prompt or per branch where feasible.
5.	If a change affects many files:
5.1.	Require a high-level plan first (list of files and responsibilities).

8. Using Cursor (or other AI dev tools) on this Repo
When implementing a new feature with Cursor or another AI assistant, use this pattern:
Task:
1.	Clear, single-scope description of what to build or change.
Context:
1.	“Read docs/product-vision.md, docs/architecture.md, and docs/domain-model.md.”
2.	“Follow the guidelines in docs/dev-principles.md.”
Requirements (example):
1.	Implement route /app/personas as an authenticated page.
2.	Fetch the current user and their personas via Supabase.
3.	Render a table of personas plus a form to create a new one.
4.	Use a server action for insertion and refresh data after submit.
Output format:
1.	List the files you will create/update.
2.	Show full contents for each changed file.
3.	Note any new env vars, config, or migrations required.

This structure keeps AI contributions consistent, reviewable, and aligned with DoppleCart’s architecture.

