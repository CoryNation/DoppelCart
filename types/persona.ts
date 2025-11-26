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
  [key: string]: any;
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




