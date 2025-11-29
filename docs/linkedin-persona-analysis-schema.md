# LinkedIn Persona Analysis - Database Schema

## Overview
This document describes the database schema changes made to support LinkedIn Persona Analysis functionality.

## Migration: `202511300100_create_linkedin_persona_analysis.sql`

### New Tables

#### `linkedin_persona_analysis`
Stores LinkedIn persona analysis results generated from CSV data.

**Columns:**
- `id` (uuid, PK) - Primary key
- `user_id` (uuid, FK → auth.users) - Owner of the analysis
- `title` (text) - User-provided title for the analysis
- `description` (text, nullable) - Optional description of analysis purpose
- `analysis_result` (jsonb) - The complete analysis output including:
  - `core_drivers` (intrinsic/extrinsic motivators)
  - `cultivated_persona`
  - `definition_of_success`
  - `guiding_values`
  - `interests_and_growth`
- `csv_metadata` (jsonb, nullable) - Metadata about the source CSV:
  - `original_filename`
  - `row_count`
  - `content_length`
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS Policies:**
- Users can view, insert, update, and delete their own analyses

**Indexes:**
- `linkedin_persona_analysis_user_id_idx` - For filtering by user
- `linkedin_persona_analysis_created_at_idx` - For sorting by date (desc)

#### `linkedin_persona_analysis_personas`
Junction table linking analyses to personas when a persona is created from an analysis.

**Columns:**
- `analysis_id` (uuid, FK → linkedin_persona_analysis)
- `persona_id` (uuid, FK → personas)
- `created_at` (timestamptz)
- Primary key: (`analysis_id`, `persona_id`)

**RLS Policies:**
- Users can view, insert, and delete persona links for their own analyses

### Type Updates

#### `PersonaOriginType`
Added new origin type:
- `"linkedin_analysis"` - Persona created from LinkedIn persona analysis

#### `PersonaSourceType`
Added new source type:
- `"linkedin_csv"` - CSV data from LinkedIn Persona Miner extension

## Usage

### Storing Analysis Results
When a user runs a LinkedIn persona analysis, the results are automatically saved to `linkedin_persona_analysis` table via the API endpoint.

### Creating Personas from Analysis
When a persona is created from a LinkedIn analysis:
1. Create the persona with `origin_type = "linkedin_analysis"`
2. Store the analysis ID in `origin_metadata`
3. Create a link in `linkedin_persona_analysis_personas` junction table
4. Optionally create a `persona_source` record with `source_type = "linkedin_csv"`

## Related Files
- Migration: `supabase/migrations/202511300100_create_linkedin_persona_analysis.sql`
- Types: `types/linkedin-analysis.ts`
- API: `app/api/linkedin-persona-analysis/route.ts`

