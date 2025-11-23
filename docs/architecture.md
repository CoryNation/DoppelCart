# DoppleCart – System Architecture

DoppleCart uses a simple, scalable architecture optimized for:
- Fast iteration
- Strong type safety
- Seamless AI integration
- Low operating cost
- Excellent compatibility with Cursor and other AI code-generation tools

---

## High-Level Architecture

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Rendering Model:** Server Components by default
- **Deployment:** Vercel

### Backend
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (email magic link initially)
- **Storage:** Supabase Storage for images & assets
- **Background Jobs:** Supabase cron + edge functions
- **Row Level Security (RLS):** Enforced on all tables

### AI / ML Layer
All AI calls go through a **centralized service layer** in `lib/ai/`:

- `lib/ai/content.ts`  
- `lib/ai/persona.ts`  
- `lib/ai/images.ts`

Each function:
- Accepts structured inputs (persona fields, content context)
- Builds prompts programmatically
- Calls configured LLM / image models
- Returns normalized outputs (caption, hashtags, bio, etc.)

This prevents scattered hardcoded prompts and ensures consistent persona behaviors.

### Folder Structure
/app
/app/(authenticated)/...
/login
/lib
/supabase
- client.ts
- server.ts
/ai
- persona.ts
- content.ts
- images.ts
/utils
/docs
product-vision.md
architecture.md
domain-model.md
dev-principles.md
/supabase
/migrations

### Server Actions & API Strategy

- Use **Next.js Server Actions** for database mutations.
- Use **Route Handlers** only when external API integration is required.
- Prefer server components for all data fetching.

---

## Database Schema Summary

Supabase schema includes:
- `profiles`
- `personas`
- `content_plans`
- `content_items`
- `assets`
- `scheduled_posts`
- `channel_integrations`
- `analytics_snapshots`

See `/docs/domain-model.md` for full explanations.

RLS ensures users can only access records tied to their own personas.

---

## Deployment

- **Vercel** handles all frontend + serverless functions.
- **Supabase** handles persistence and scheduled jobs.
- No additional backend servers needed for MVP.

