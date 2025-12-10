/**
 * Guardrails System
 * 
 * Implements brand safety rules, content validation, and approval workflows.
 * This module ensures all content meets safety, quality, and brand standards
 * before being published.
 * 
 * Features:
 * - Forbidden phrase detection
 * - Topic whitelist/blacklist
 * - Tone boundary enforcement
 * - Content length validation
 * - Approval requirement checks
 * 
 * To extend guardrails:
 * 1. Add new violation types in GuardrailViolation
 * 2. Implement custom validation functions
 * 3. Add integration with external content moderation APIs
 * 4. Create guardrail presets for different industries/niches
 */

import {
  WorkflowGuardrails,
  GuardrailCheckResult,
  GuardrailViolation,
  WorkflowContext,
  Tone,
} from './types';
import { validateVoiceConsistency } from './voiceLock';

/**
 * Check content against all configured guardrails.
 * 
 * @param content - Content to check (can be string or object with text fields)
 * @param guardrails - Guardrail configuration
 * @param context - Workflow context for additional validation
 * @returns Promise resolving to guardrail check result
 */
export async function checkGuardrails(
  content: unknown,
  guardrails: WorkflowGuardrails,
  context?: WorkflowContext
): Promise<GuardrailCheckResult> {
  const violations: GuardrailViolation[] = [];
  const suggestions: string[] = [];

  // Extract text from content (handle different content formats)
  const text = extractTextFromContent(content);
  
  if (!text) {
    return {
      passed: false,
      violations: [{
        type: 'length',
        message: 'Content is empty or could not be extracted',
        severity: 'error',
      }],
    };
  }

  // Check forbidden phrases
  if (guardrails.forbiddenPhrases && guardrails.forbiddenPhrases.length > 0) {
    const phraseViolations = checkForbiddenPhrases(text, guardrails.forbiddenPhrases);
    violations.push(...phraseViolations);
  }

  // Check forbidden topics
  if (guardrails.forbiddenTopics && guardrails.forbiddenTopics.length > 0) {
    const topicViolations = checkForbiddenTopics(text, guardrails.forbiddenTopics);
    violations.push(...topicViolations);
  }

  // Check allowed topics (whitelist)
  if (guardrails.allowedTopics && guardrails.allowedTopics.length > 0) {
    const whitelistViolations = checkAllowedTopics(text, guardrails.allowedTopics);
    violations.push(...whitelistViolations);
  }

  // Check tone boundaries
  if (guardrails.toneBoundaries && guardrails.toneBoundaries.length > 0) {
    const toneViolations = await checkToneBoundaries(
      text,
      guardrails.toneBoundaries,
      guardrails.tone,
      context
    );
    violations.push(...toneViolations);
  }

  // Check content length
  if (guardrails.minLength !== undefined || guardrails.maxLength !== undefined) {
    const lengthViolations = checkContentLength(text, guardrails.minLength, guardrails.maxLength);
    violations.push(...lengthViolations);
  }

  // Generate suggestions for violations
  if (violations.length > 0) {
    suggestions.push(...generateSuggestions(violations, guardrails));
  }

  return {
    passed: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Extract text content from various content formats.
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    
    // Try common text fields
    const textFields = ['caption', 'text', 'content', 'title', 'body', 'message'];
    for (const field of textFields) {
      if (typeof obj[field] === 'string') {
        return obj[field] as string;
      }
    }

    // If it's an array, try to extract text from items
    if (Array.isArray(obj.content)) {
      return obj.content.map(item => extractTextFromContent(item)).join(' ');
    }
  }

  return '';
}

/**
 * Check for forbidden phrases in content.
 */
function checkForbiddenPhrases(
  text: string,
  forbiddenPhrases: string[]
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const lowerText = text.toLowerCase();

  for (const phrase of forbiddenPhrases) {
    const lowerPhrase = phrase.toLowerCase();
    const index = lowerText.indexOf(lowerPhrase);
    
    if (index !== -1) {
      violations.push({
        type: 'forbidden_phrase',
        message: `Forbidden phrase detected: "${phrase}"`,
        severity: 'error',
        location: {
          start: index,
          end: index + phrase.length,
        },
      });
    }
  }

  return violations;
}

/**
 * Check for forbidden topics in content.
 * Uses simple keyword matching - can be enhanced with NLP.
 */
function checkForbiddenTopics(
  text: string,
  forbiddenTopics: string[]
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const lowerText = text.toLowerCase();

  for (const topic of forbiddenTopics) {
    const lowerTopic = topic.toLowerCase();
    
    // Check if topic appears as a word (not just substring)
    const regex = new RegExp(`\\b${lowerTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      const index = lowerText.indexOf(lowerTopic);
      violations.push({
        type: 'forbidden_topic',
        message: `Forbidden topic detected: "${topic}"`,
        severity: 'error',
        location: index !== -1 ? {
          start: index,
          end: index + topic.length,
        } : undefined,
      });
    }
  }

  return violations;
}

/**
 * Check if content only contains allowed topics (whitelist).
 * If whitelist is provided, content must mention at least one allowed topic.
 */
function checkAllowedTopics(
  text: string,
  allowedTopics: string[]
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const lowerText = text.toLowerCase();
  
  // Check if any allowed topic is mentioned
  const hasAllowedTopic = allowedTopics.some(topic => {
    const lowerTopic = topic.toLowerCase();
    const regex = new RegExp(`\\b${lowerTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });

  if (!hasAllowedTopic) {
    violations.push({
      type: 'forbidden_topic',
      message: `Content does not contain any allowed topics. Allowed: ${allowedTopics.join(', ')}`,
      severity: 'warning',
    });
  }

  return violations;
}

/**
 * Check if content tone matches allowed tone boundaries.
 */
async function checkToneBoundaries(
  text: string,
  allowedTones: Tone[],
  targetTone?: Tone,
  context?: WorkflowContext
): Promise<GuardrailViolation[]> {
  const violations: GuardrailViolation[] = [];

  // Use voice lock to validate tone consistency
  if (targetTone && context) {
    const voiceCheck = await validateVoiceConsistency(text, targetTone, context);
    
    if (!voiceCheck.consistent) {
      violations.push({
        type: 'tone_mismatch',
        message: `Tone mismatch: Expected "${targetTone}" but detected different tone. ${voiceCheck.reason || ''}`,
        severity: 'warning',
      });
    }
  }

  // Additional tone boundary checks can be added here
  // For example, using sentiment analysis or tone classification APIs

  return violations;
}

/**
 * Check content length constraints.
 */
function checkContentLength(
  text: string,
  minLength?: number,
  maxLength?: number
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const length = text.length;

  if (minLength !== undefined && length < minLength) {
    violations.push({
      type: 'length',
      message: `Content is too short: ${length} characters (minimum: ${minLength})`,
      severity: 'error',
    });
  }

  if (maxLength !== undefined && length > maxLength) {
    violations.push({
      type: 'length',
      message: `Content is too long: ${length} characters (maximum: ${maxLength})`,
      severity: 'error',
    });
  }

  return violations;
}

/**
 * Generate suggestions for fixing guardrail violations.
 */
function generateSuggestions(
  violations: GuardrailViolation[],
  guardrails: WorkflowGuardrails
): string[] {
  const suggestions: string[] = [];

  const forbiddenPhraseViolations = violations.filter(v => v.type === 'forbidden_phrase');
  if (forbiddenPhraseViolations.length > 0) {
    suggestions.push('Remove or replace forbidden phrases detected in content');
  }

  const forbiddenTopicViolations = violations.filter(v => v.type === 'forbidden_topic');
  if (forbiddenTopicViolations.length > 0) {
    suggestions.push('Remove references to forbidden topics or switch to allowed topics');
  }

  const toneViolations = violations.filter(v => v.type === 'tone_mismatch');
  if (toneViolations.length > 0 && guardrails.tone) {
    suggestions.push(`Adjust tone to match "${guardrails.tone}" style guidelines`);
  }

  const lengthViolations = violations.filter(v => v.type === 'length');
  if (lengthViolations.length > 0) {
    const tooShort = lengthViolations.some(v => v.message.includes('too short'));
    const tooLong = lengthViolations.some(v => v.message.includes('too long'));
    
    if (tooShort) {
      suggestions.push('Expand content to meet minimum length requirements');
    }
    if (tooLong) {
      suggestions.push('Condense content to meet maximum length requirements');
    }
  }

  return suggestions;
}

/**
 * Create a guardrail preset for professional/business content.
 */
export function createProfessionalGuardrails(): WorkflowGuardrails {
  return {
    tone: 'professional',
    requireApproval: true,
    forbiddenPhrases: [
      'guaranteed results',
      'make money fast',
      'click here now',
    ],
    forbiddenTopics: [
      'get rich quick',
      'pyramid scheme',
    ],
    toneBoundaries: ['professional', 'authoritative', 'educational'],
    minLength: 100,
    maxLength: 3000,
  };
}

/**
 * Create a guardrail preset for casual/social content.
 */
export function createCasualGuardrails(): WorkflowGuardrails {
  return {
    tone: 'casual',
    requireApproval: false,
    forbiddenPhrases: [
      'spam',
      'scam',
    ],
    toneBoundaries: ['casual', 'friendly', 'humorous'],
    minLength: 50,
    maxLength: 2000,
  };
}

