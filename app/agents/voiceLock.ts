/**
 * Voice Lock (Tone Consistency Model)
 * 
 * Ensures content maintains consistent tone and voice across all generated content.
 * This is critical for maintaining brand identity and persona consistency.
 * 
 * Features:
 * - Tone validation against target tone
 * - Voice consistency scoring
 * - Persona voice profile matching
 * - Historical voice pattern analysis
 * 
 * To extend Voice Lock:
 * 1. Integrate with OpenAI for advanced tone classification
 * 2. Build persona voice profiles from historical content
 * 3. Add machine learning models for voice similarity scoring
 * 4. Create voice templates for different industries
 * 5. Implement voice drift detection over time
 */

import { Tone, WorkflowContext } from './types';
import { callChatModel } from '@/lib/openai';

/**
 * Result of voice consistency validation.
 */
export interface VoiceConsistencyResult {
  /** Whether the content matches the target tone */
  consistent: boolean;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Reason for inconsistency if detected */
  reason?: string;
  /** Detected tone if different from target */
  detectedTone?: Tone;
  /** Suggestions for improving consistency */
  suggestions?: string[];
}

/**
 * Validate that content matches the target tone/voice.
 * 
 * @param content - Content text to validate
 * @param targetTone - Expected tone
 * @param context - Workflow context for persona-specific validation
 * @returns Promise resolving to voice consistency result
 */
export async function validateVoiceConsistency(
  content: string,
  targetTone: Tone,
  context?: WorkflowContext
): Promise<VoiceConsistencyResult> {
  if (!content || content.trim().length === 0) {
    return {
      consistent: false,
      reason: 'Content is empty',
    };
  }

  // Extract text if content is an object
  const text = typeof content === 'string' ? content : extractTextFromContent(content);
  
  if (!text) {
    return {
      consistent: false,
      reason: 'Could not extract text from content',
    };
  }

  // Use AI to analyze tone consistency
  // TODO: Cache persona voice profiles for faster validation
  const analysis = await analyzeToneWithAI(text, targetTone, context);

  return analysis;
}

/**
 * Analyze tone using AI (OpenAI).
 * This provides more accurate tone detection than simple keyword matching.
 */
async function analyzeToneWithAI(
  text: string,
  targetTone: Tone,
  context?: WorkflowContext
): Promise<VoiceConsistencyResult> {
  // Build tone description
  const toneDescriptions: Record<Tone, string> = {
    professional: 'Formal, respectful, business-focused, uses industry terminology, avoids slang',
    casual: 'Relaxed, conversational, friendly, may use contractions and informal language',
    friendly: 'Warm, approachable, personable, uses inclusive language, positive tone',
    authoritative: 'Confident, expert, knowledgeable, uses data and facts, commanding presence',
    humorous: 'Light-hearted, witty, entertaining, uses jokes or clever wordplay appropriately',
    inspirational: 'Motivational, uplifting, aspirational, uses emotional language, calls to action',
    educational: 'Informative, clear, structured, uses examples and explanations, teaches concepts',
  };

  const targetDescription = toneDescriptions[targetTone] || targetTone;

  // Build system prompt
  let systemPrompt = `You are a tone and voice consistency analyzer. Your job is to determine if content matches a target tone.

Target tone: ${targetTone}
Tone characteristics: ${targetDescription}

Analyze the provided content and determine:
1. Does the content match the target tone? (yes/no)
2. What tone does it actually have? (if different)
3. Confidence score (0-1)
4. Specific reasons for any mismatch
5. Suggestions for improvement

Respond with a JSON object in this format:
{
  "consistent": boolean,
  "confidence": number (0-1),
  "detectedTone": "string" (if different from target),
  "reason": "string" (explanation),
  "suggestions": ["string"] (array of improvement suggestions)
}`;

  // Add persona context if available
  if (context?.personaId) {
    systemPrompt += `\n\nThis content is for persona ID: ${context.personaId}. Consider persona-specific voice requirements.`;
  }

  // Add historical context if available
  if (context?.data?.previousContent) {
    systemPrompt += `\n\nPrevious content samples are available for voice pattern matching.`;
  }

  try {
    const response = await callChatModel({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this content for tone consistency:\n\n${text}` },
      ],
      responseFormatType: 'json_object',
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const result = JSON.parse(response) as VoiceConsistencyResult;
    
    // Validate response structure
    if (typeof result.consistent !== 'boolean') {
      return {
        consistent: false,
        reason: 'AI analysis returned invalid response format',
      };
    }

    return result;
  } catch (error) {
    console.error('Error analyzing tone with AI:', error);
    
    // Fallback to simple keyword-based analysis
    return fallbackToneAnalysis(text, targetTone);
  }
}

/**
 * Fallback tone analysis using keyword matching.
 * Used when AI analysis fails or is unavailable.
 */
function fallbackToneAnalysis(
  text: string,
  targetTone: Tone
): VoiceConsistencyResult {
  const lowerText = text.toLowerCase();

  // Simple keyword-based tone indicators
  const toneIndicators: Record<Tone, { positive: string[]; negative: string[] }> = {
    professional: {
      positive: ['please', 'thank you', 'regards', 'sincerely', 'according to', 'research shows'],
      negative: ['lol', 'omg', 'wtf', 'dude', 'bro'],
    },
    casual: {
      positive: ['hey', 'hi', 'thanks', 'cool', 'awesome', 'yeah'],
      negative: ['sincerely', 'respectfully', 'per your request', 'herein'],
    },
    friendly: {
      positive: ['we', 'us', 'together', 'community', 'share', 'help'],
      negative: ['you must', 'required', 'mandatory', 'failure to'],
    },
    authoritative: {
      positive: ['data shows', 'research indicates', 'studies prove', 'evidence suggests'],
      negative: ['maybe', 'perhaps', 'might', 'could be'],
    },
    humorous: {
      positive: ['lol', 'haha', 'funny', 'joke', 'pun'],
      negative: ['serious', 'critical', 'urgent', 'important notice'],
    },
    inspirational: {
      positive: ['achieve', 'dream', 'believe', 'success', 'journey', 'transform'],
      negative: ['cannot', 'impossible', 'failure', 'give up'],
    },
    educational: {
      positive: ['learn', 'understand', 'explain', 'example', 'step', 'guide'],
      negative: ['assume', 'obvious', 'everyone knows'],
    },
  };

  const indicators = toneIndicators[targetTone];
  if (!indicators) {
    return {
      consistent: true,
      confidence: 0.5,
      reason: 'Tone indicators not available for this tone type',
    };
  }

  // Count positive and negative indicators
  const positiveMatches = indicators.positive.filter(word => lowerText.includes(word)).length;
  const negativeMatches = indicators.negative.filter(word => lowerText.includes(word)).length;

  // Simple scoring
  const score = (positiveMatches * 0.1) - (negativeMatches * 0.2);
  const consistent = score >= 0 && negativeMatches === 0;

  return {
    consistent,
    confidence: Math.min(0.9, 0.5 + Math.abs(score)),
    reason: consistent
      ? undefined
      : `Detected ${negativeMatches} negative tone indicators and ${positiveMatches} positive indicators for ${targetTone} tone`,
    suggestions: !consistent
      ? [
          `Remove or replace negative tone indicators`,
          `Add more positive tone indicators for ${targetTone}`,
        ]
      : undefined,
  };
}

/**
 * Extract text from various content formats.
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    const textFields = ['caption', 'text', 'content', 'title', 'body', 'message'];
    
    for (const field of textFields) {
      if (typeof obj[field] === 'string') {
        return obj[field] as string;
      }
    }
  }

  return '';
}

/**
 * Build a voice profile from historical content.
 * This can be used to maintain consistency across multiple content pieces.
 * 
 * @param contentSamples - Array of previous content samples
 * @returns Voice profile object
 */
export interface VoiceProfile {
  /** Primary tone */
  primaryTone: Tone;
  /** Tone distribution across samples */
  toneDistribution: Record<Tone, number>;
  /** Common phrases and patterns */
  commonPhrases: string[];
  /** Average content length */
  averageLength: number;
  /** Vocabulary characteristics */
  vocabularyLevel: 'simple' | 'moderate' | 'advanced';
}

export async function buildVoiceProfile(
  contentSamples: string[]
): Promise<VoiceProfile> {
  if (contentSamples.length === 0) {
    throw new Error('Cannot build voice profile from empty content samples');
  }

  // Analyze each sample
  const toneCounts: Record<string, number> = {};
  const allText = contentSamples.join(' ');
  const totalLength = contentSamples.reduce((sum, sample) => sum + sample.length, 0);
  const averageLength = totalLength / contentSamples.length;

  // Simple tone detection for each sample
  // In production, use AI to analyze each sample
  for (const sample of contentSamples) {
    // This is a simplified version - in production, use AI analysis
    const tones: Tone[] = ['professional', 'casual', 'friendly'];
    for (const tone of tones) {
      const result = fallbackToneAnalysis(sample, tone);
      if (result.consistent && (result.confidence || 0) > 0.6) {
        toneCounts[tone] = (toneCounts[tone] || 0) + 1;
      }
    }
  }

  // Determine primary tone
  const primaryTone = Object.entries(toneCounts).reduce(
    (max, [tone, count]) => (count > (toneCounts[max] || 0) ? tone : max),
    'professional'
  ) as Tone;

  // Build tone distribution
  const total = Object.values(toneCounts).reduce((sum, count) => sum + count, 0);
  const toneDistribution: Record<Tone, number> = {
    professional: 0,
    casual: 0,
    friendly: 0,
    authoritative: 0,
    humorous: 0,
    inspirational: 0,
    educational: 0,
  };

  for (const [tone, count] of Object.entries(toneCounts)) {
    toneDistribution[tone as Tone] = total > 0 ? count / total : 0;
  }

  // Extract common phrases (simplified - use NLP in production)
  const words = allText.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 4) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  const commonPhrases = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  // Determine vocabulary level (simplified)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const vocabularyLevel: 'simple' | 'moderate' | 'advanced' =
    avgWordLength < 4.5 ? 'simple' : avgWordLength < 5.5 ? 'moderate' : 'advanced';

  return {
    primaryTone,
    toneDistribution,
    commonPhrases,
    averageLength,
    vocabularyLevel,
  };
}

/**
 * Compare content against a voice profile.
 * Returns similarity score and recommendations.
 */
export async function compareToVoiceProfile(
  content: string,
  profile: VoiceProfile
): Promise<VoiceConsistencyResult> {
  const result = await validateVoiceConsistency(content, profile.primaryTone);
  
  // Enhance result with profile-specific insights
  if (result.consistent) {
    return {
      ...result,
      suggestions: [
        ...(result.suggestions || []),
        `Content matches voice profile (${profile.primaryTone} tone)`,
      ],
    };
  }

  return {
    ...result,
    suggestions: [
      ...(result.suggestions || []),
      `Adjust to match voice profile: ${profile.primaryTone} tone`,
      `Consider using vocabulary level: ${profile.vocabularyLevel}`,
    ],
  };
}


