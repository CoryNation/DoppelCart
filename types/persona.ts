export interface PersonaStats {
  charisma?: number;
  logic?: number;
  humor?: number;
  warmth?: number;
  edge?: number;
  creativity?: number;
}

export interface PersonaDemographics {
  age?: number;
  location?: string;
  occupation?: string;
  industry?: string;
  income_level?: string;
  language?: string;
  time_zone?: string;
}

export interface PersonaPersonality {
  tone: string;
  bigFive: {
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
  };
}

export interface PersonaState {
  display_name?: string;
  avatar_image_url?: string;
  avatar_prompt?: string;
  stats: PersonaStats;
  goals: string[];
  demographics: PersonaDemographics;
  personality: PersonaPersonality;
  biography: string;
  [key: string]: unknown;
}

export type PersonaStage = 
  | "initial" 
  | "goals" 
  | "demographics" 
  | "personality" 
  | "biography" 
  | "final_review";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ResearchPersona {
  name: string;
  label: string;
  summary: string;
  demographics: {
    roleOrProfession: string;
    experienceLevel: string;
    organizationContext: string;
    geography: string;
    other: string;
  };
  goals: string[];
  painPoints: string[];
  motivators: string[];
  objections: string[];
  preferredChannels: string[];
  contentPreferences: {
    formats: string[];
    tones: string[];
    anglesThatResonate: string[];
    anglesToAvoid: string[];
  };
  languageAndVoice: {
    samplePhrases: string[];
    doSay: string[];
    dontSay: string[];
  };
  exampleHooks: string[];
  callToActionStyles: string[];
}

export type PersonaOriginType =
  | "ai_chat"
  | "digital_twin_csv"
  | "ai_history_import"
  | "resonance_research"
  | "linkedin_analysis";

export interface Persona {
  id: string;
  user_id: string;
  display_name: string;
  avatar_image_url?: string | null;
  avatar_prompt?: string | null;
  stats?: PersonaStats | null;
  goals?: string[] | null;
  demographics?: PersonaDemographics | null;
  personality?: PersonaPersonality | null;
  biography?: string | null;
  raw_definition?: Record<string, unknown> | null;
  origin_type?: PersonaOriginType | null;
  origin_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type PersonaSourceType = "csv_post_history" | "ai_history_text" | "linkedin_csv";

export interface PersonaSource {
  id: string;
  persona_id: string;
  source_type: PersonaSourceType;
  storage_path: string | null;
  original_filename: string | null;
  source_summary: string | null;
  created_at: string;
}




