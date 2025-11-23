# Cursor Project Rules – DoppleCart

You are helping build **DoppleCart**, an AI influencer management SaaS.

## Context

- Backend: Supabase (Postgres + Auth + Storage)
- Frontend: Next.js App Router with TypeScript and Tailwind, deployed on Vercel
- All DB access must go through Supabase clients and respect RLS.
- Architecture, domain, and principles are defined in:
  - docs/product-vision.md
  - docs/architecture.md
  - docs/domain-model.md
  - docs/dev-principles.md

## General Rules

- Use strict, idiomatic TypeScript.
- Prefer server components + server actions; avoid unnecessary client components.
- Keep AI calls in `lib/ai/*`, not inside React components.
- Do not broadly refactor or rename files unless explicitly asked.
- Keep changes tightly scoped to the current task.

## Expected Behavior for Each Task

When I ask for a feature or change:

1. Restate the task in your own words.
2. List the files you plan to create/update.
3. Propose the implementation approach.
4. Only after I confirm, generate or modify the code.
