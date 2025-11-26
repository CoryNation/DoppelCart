export interface ResonanceResearchResult {
  summary: string;
  audience_profile: {
    description: string;
    key_segments: string[];
    pains: string[];
    desires: string[];
  };
  winning_persona_archetypes: {
    name: string;
    description: string;
    tone: string;
    strengths: string[];
    pitfalls: string[];
  }[];
  platforms: {
    name: string;
    role: string;
    content_formats: string[];
    posting_cadence: string;
  }[];
  content_themes: {
    theme: string;
    why_it_resonates: string;
    example_hooks: string[];
  }[];
  style_guide: {
    voice: string;
    do: string[];
    dont: string[];
    taboo_topics: string[];
  };
  persona_blueprint: {
    working_name: string;
    tagline: string;
    core_traits: string[];
    default_tone: string;
    signature_content_types: string[];
  };
}

export interface ResonanceResearch {
  id: string;
  user_id: string;
  title: string;
  initial_prompt: string;
  input_context: Record<string, unknown> | null;
  result: ResonanceResearchResult | null;
  status: "running" | "completed" | "failed";
  error_message: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResonanceResearchListItem extends ResonanceResearch {
  persona_count: number;
}
