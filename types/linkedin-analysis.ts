export interface LinkedInPersonaAnalysis {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  analysis_result: LinkedInAnalysisResult;
  csv_metadata: LinkedInCSVMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInAnalysisResult {
  core_drivers: {
    intrinsic: string[];
    extrinsic: string[];
  };
  cultivated_persona: string;
  definition_of_success: string;
  guiding_values: string[];
  interests_and_growth: {
    key_interests: string[];
    passions: string[];
    growth_areas: string[];
  };
}

export interface LinkedInCSVMetadata {
  original_filename?: string | null;
  row_count?: number;
  content_length?: number;
}

