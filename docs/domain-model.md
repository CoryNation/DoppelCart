# DoppelCart – Domain Model

This document describes DoppelCart’s domain entities, their purpose, and how they relate to each other. AI agents and automated tools should refer to this model when generating database queries, server actions, or business logic.

---

## Core Concepts

### Persona
A persona is a synthetic influencer with:
- Identity (name, handle, niche, voice, style)
- Personality & bio
- Aesthetic preferences
- Platform strategy

Personas belong to **one user** and serve as the anchor for all content, plans, and analytics.

### Content Plan
A content plan defines a *date range* and *frequency goal* for a given persona.
AI uses this structure to generate content ideas.

### Content Item
A single content unit for a persona. Could be:
- Idea
- Draft
- Ready
- Scheduled
- Posted
- Failed

Includes:
- Caption
- Optional AI-generated image
- Platform
- Scheduled/published timestamps

### Asset
Any AI-generated or uploaded media stored in Supabase Storage.

### Channel Integration
Represents a connected social account (e.g., Instagram).
Contains:
- Access tokens
- Platform identifiers
- Expiry / refresh info

### Scheduled Post
A job to publish a content item at a specific time.

### Analytics Snapshot
Historical metrics pulled from social platforms to track performance.

---

## Entity Relationship Overview
User 1---N Persona 1---N ContentPlan 1---N ContentItem 1---1 Asset
--------------------------N AnalyticsSnapshot
Persona 1---N ChannelIntegration
ContentItem 1---N ScheduledPost

---

## Table Descriptions

### profiles
Metadata for each Supabase user.

### personas
User-owned synthetic influencers.  
**Business meaning:** Represents a creator identity with a consistent style.

### content_plans
Planning containers.  
**Business meaning:** “This persona will publish X posts between dates A and B.”

### content_items
Generated or manually created posts.  
**Business meaning:** “This is an actual piece of content ready to publish.”

### assets
Stored images or videos.  
**Business meaning:** “This is what will appear visually in the content.”

### channel_integrations
OAuth connections per persona or user.

### scheduled_posts
Pending publishing jobs.

### analytics_snapshots
Stores engagement history for modeling performance & recommendations.

---

All domain logic in the app should respect these meanings.
