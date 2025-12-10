/**
 * Guardrails Layer
 * 
 * Provides validation, filtering, and safety checks for agent executions.
 * Compatible with batch inference and workflow engine.
 */

import { AgentExecutionContext } from "./agentRegistry";

/**
 * Guardrails configuration
 */
export interface GuardrailsConfig {
  /** Maximum prompt length */
  maxPromptLength: number;
  /** Minimum prompt length */
  minPromptLength: number;
  /** Blocked keywords or patterns */
  blockedPatterns?: RegExp[];
  /** Rate limiting configuration */
  rateLimit?: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  /** Enable content filtering */
  enableContentFilter: boolean;
}

/**
 * Default guardrails configuration
 */
export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
  maxPromptLength: 100000,
  minPromptLength: 1,
  blockedPatterns: [],
  enableContentFilter: true,
};

/**
 * Guardrails validation result
 */
export interface GuardrailsValidationResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Reason for allowance or rejection */
  reason?: string;
  /** List of violations found */
  violations?: string[];
  /** Sanitized prompt (if modifications were made) */
  sanitizedPrompt?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Guardrails service class
 */
export class GuardrailsService {
  private config: GuardrailsConfig;
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  constructor(config: Partial<GuardrailsConfig> = {}) {
    this.config = { ...DEFAULT_GUARDRAILS_CONFIG, ...config };
  }

  /**
   * Validate a prompt and context
   */
  async validate(
    prompt: string,
    context: AgentExecutionContext
  ): Promise<GuardrailsValidationResult> {
    const violations: string[] = [];

    // Check prompt length
    if (prompt.length > this.config.maxPromptLength) {
      violations.push(`Prompt exceeds maximum length of ${this.config.maxPromptLength}`);
    }

    if (prompt.trim().length < this.config.minPromptLength) {
      violations.push(`Prompt is too short (minimum ${this.config.minPromptLength} characters)`);
    }

    // Check blocked patterns
    if (this.config.blockedPatterns) {
      for (const pattern of this.config.blockedPatterns) {
        if (pattern.test(prompt)) {
          violations.push(`Prompt contains blocked pattern: ${pattern}`);
        }
      }
    }

    // Rate limiting
    if (this.config.rateLimit && context.userId) {
      const rateLimitResult = this.checkRateLimit(context.userId);
      if (!rateLimitResult.allowed) {
        violations.push(rateLimitResult.reason || "Rate limit exceeded");
      }
    }

    // Content filtering
    if (this.config.enableContentFilter) {
      const filterResult = await this.filterContent(prompt);
      if (filterResult.violations) {
        violations.push(...filterResult.violations);
      }
    }

    // If there are violations, return rejection
    if (violations.length > 0) {
      return {
        allowed: false,
        reason: "Guardrails validation failed",
        violations,
      };
    }

    // Sanitize prompt
    const sanitizedPrompt = this.sanitizePrompt(prompt);

    return {
      allowed: true,
      sanitizedPrompt,
      metadata: {
        validatedAt: new Date().toISOString(),
        promptLength: prompt.length,
        sanitizedLength: sanitizedPrompt.length,
      },
    };
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(userId: string): { allowed: boolean; reason?: string } {
    if (!this.config.rateLimit) {
      return { allowed: true };
    }

    const now = Date.now();
    const userLimit = this.rateLimitCache.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize
      this.rateLimitCache.set(userId, {
        count: 1,
        resetTime: now + 60000, // 1 minute window
      });
      return { allowed: true };
    }

    if (userLimit.count >= this.config.rateLimit.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${this.config.rateLimit.maxRequestsPerMinute} requests per minute`,
      };
    }

    // Increment count
    userLimit.count++;
    return { allowed: true };
  }

  /**
   * Filter content (placeholder implementation)
   */
  private async filterContent(prompt: string): Promise<{
    violations?: string[];
    sanitizedPrompt?: string;
  }> {
    // Placeholder implementation - can be extended with actual content filtering
    // Examples: toxicity detection, PII detection, etc.
    return {};
  }

  /**
   * Sanitize prompt
   */
  private sanitizePrompt(prompt: string): string {
    // Basic sanitization
    return prompt.trim().replace(/\0/g, ""); // Remove null bytes
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GuardrailsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear rate limit cache
   */
  clearRateLimitCache(): void {
    this.rateLimitCache.clear();
  }
}

// Global guardrails service instance
let globalGuardrailsService: GuardrailsService | null = null;

/**
 * Get or create the global guardrails service
 */
export function getGuardrailsService(config?: Partial<GuardrailsConfig>): GuardrailsService {
  if (!globalGuardrailsService) {
    globalGuardrailsService = new GuardrailsService(config);
  }
  return globalGuardrailsService;
}

/**
 * Validate with guardrails (convenience function)
 */
export async function validateGuardrails(
  prompt: string,
  context: AgentExecutionContext,
  config?: Partial<GuardrailsConfig>
): Promise<GuardrailsValidationResult> {
  const service = getGuardrailsService(config);
  return service.validate(prompt, context);
}


