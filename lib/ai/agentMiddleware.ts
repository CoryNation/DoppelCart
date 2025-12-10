/**
 * Agent Middleware
 * 
 * Middleware layer that intercepts agent execution requests and applies
 * batch inference by default unless explicitly overridden.
 * 
 * This middleware ensures all agent executions go through the batch inference
 * system for cost optimization, while maintaining compatibility with the
 * guardrails layer and workflowEngine.
 */

import { AgentExecutionContext, AgentExecutionOptions } from "./agentRegistry";
import { queuePrompt } from "../batchInference";
import { callChatModel } from "../openai";

/**
 * Middleware context passed through the middleware chain
 */
export interface MiddlewareContext extends AgentExecutionContext {
  /** Whether to use batch inference */
  useBatch: boolean;
  /** Override execution mode */
  executionModeOverride?: "batch" | "immediate";
  /** Guardrails validation result */
  guardrailsResult?: GuardrailsResult;
  /** Workflow engine context */
  workflowContext?: WorkflowContext;
}

/**
 * Guardrails validation result
 */
export interface GuardrailsResult {
  allowed: boolean;
  reason?: string;
  violations?: string[];
  sanitizedPrompt?: string;
}

/**
 * Workflow engine context
 */
export interface WorkflowContext {
  workflowId?: string;
  stepId?: string;
  previousResults?: unknown[];
}

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
  prompt: string,
  context: MiddlewareContext,
  options?: AgentExecutionOptions,
  next?: MiddlewareFunction
) => Promise<string>;

/**
 * Default agent middleware that enables batch inference by default
 */
export async function agentMiddleware(
  prompt: string,
  context: AgentExecutionContext,
  options?: AgentExecutionOptions,
  agentSystemPrompt?: string,
  agentModel?: string,
  agentTemperature?: number
): Promise<string> {
  // Build middleware context
  const middlewareContext: MiddlewareContext = {
    ...context,
    useBatch: true, // Default to batch inference
    executionModeOverride: options?.executionMode as "batch" | "immediate" | undefined,
  };

  // Determine execution mode
  const executionMode = options?.executionMode || middlewareContext.executionModeOverride || "batch";

  // If immediate execution is explicitly requested, bypass batch
  if (executionMode === "immediate") {
    middlewareContext.useBatch = false;
  }

  // Build tags for batch inference
  const tags = [
    `agent:${context.agentId}`,
    ...(context.userId ? [`user:${context.userId}`] : []),
    ...(context.sessionId ? [`session:${context.sessionId}`] : []),
    ...(middlewareContext.workflowContext?.workflowId
      ? [`workflow:${middlewareContext.workflowContext.workflowId}`]
      : []),
  ];

  // Execute based on mode
  if (middlewareContext.useBatch && executionMode !== "immediate") {
    // Use batch inference
    return queuePrompt(
      prompt,
      tags,
      {
        systemPrompt: agentSystemPrompt,
        model: options?.model || agentModel,
        temperature: options?.temperature ?? agentTemperature,
        metadata: {
          ...context.metadata,
          ...options?.metadata,
          middlewareContext: middlewareContext.guardrailsResult,
        },
      }
    );
  } else {
    // Immediate execution
    const messages = agentSystemPrompt
      ? [
          { role: "system" as const, content: agentSystemPrompt },
          { role: "user" as const, content: prompt },
        ]
      : [{ role: "user" as const, content: prompt }];

    return callChatModel({
      messages,
      model: options?.model || agentModel,
      temperature: options?.temperature ?? agentTemperature,
    });
  }
}

/**
 * Apply guardrails middleware
 */
export async function guardrailsMiddleware(
  prompt: string,
  context: MiddlewareContext,
  options?: AgentExecutionOptions,
  next?: MiddlewareFunction
): Promise<string> {
  // Apply guardrails validation
  const guardrailsResult = await validateGuardrails(prompt, context);

  if (!guardrailsResult.allowed) {
    throw new Error(
      `Guardrails validation failed: ${guardrailsResult.reason || "Request blocked"}`
    );
  }

  // Update context with guardrails result
  context.guardrailsResult = guardrailsResult;
  context.metadata = {
    ...context.metadata,
    guardrailsValidated: true,
    guardrailsViolations: guardrailsResult.violations || [],
  };

  // Use sanitized prompt if provided
  const processedPrompt = guardrailsResult.sanitizedPrompt || prompt;

  // Continue to next middleware or execute
  if (next) {
    return next(processedPrompt, context, options);
  }

  // Fallback to default middleware
  return agentMiddleware(
    processedPrompt,
    context,
    options,
    undefined,
    undefined,
    undefined
  );
}

/**
 * Validate guardrails (placeholder implementation)
 */
async function validateGuardrails(
  prompt: string,
  context: MiddlewareContext
): Promise<GuardrailsResult> {
  // Placeholder implementation - can be extended with actual validation logic
  // Examples: content filtering, rate limiting, policy checks, etc.

  // Basic validation
  const violations: string[] = [];

  // Check prompt length
  if (prompt.length > 100000) {
    violations.push("Prompt too long");
    return {
      allowed: false,
      reason: "Prompt exceeds maximum length",
      violations,
    };
  }

  // Check for empty prompts
  if (prompt.trim().length === 0) {
    violations.push("Empty prompt");
    return {
      allowed: false,
      reason: "Prompt cannot be empty",
      violations,
    };
  }

  // Sanitize prompt (basic example)
  const sanitizedPrompt = prompt.trim();

  return {
    allowed: true,
    sanitizedPrompt,
    violations: violations.length > 0 ? violations : undefined,
  };
}

/**
 * Workflow engine middleware
 */
export async function workflowEngineMiddleware(
  prompt: string,
  context: MiddlewareContext,
  options?: AgentExecutionOptions,
  next?: MiddlewareFunction
): Promise<string> {
  // Add workflow context if present
  if (context.workflowContext) {
    // Log workflow step
    console.log(
      `Workflow step: ${context.workflowContext.stepId} in workflow ${context.workflowContext.workflowId}`
    );
  }

  // Continue to next middleware or execute
  if (next) {
    return next(prompt, context, options);
  }

  // Fallback to default middleware
  return agentMiddleware(
    prompt,
    context,
    options,
    undefined,
    undefined,
    undefined
  );
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(...middlewares: MiddlewareFunction[]): MiddlewareFunction {
  return async (
    prompt: string,
    context: MiddlewareContext,
    options?: AgentExecutionOptions
  ): Promise<string> => {
    let index = 0;

    const next: MiddlewareFunction = async (
      p: string,
      c: MiddlewareContext,
      o?: AgentExecutionOptions
    ): Promise<string> => {
      if (index >= middlewares.length) {
        // No more middleware, execute default
        return agentMiddleware(p, c, o);
      }

      const middleware = middlewares[index++];
      return middleware(p, c, o, next);
    };

    return next(prompt, context, options);
  };
}

/**
 * Default middleware stack with guardrails and workflow engine
 */
export const defaultAgentMiddleware = composeMiddleware(
  guardrailsMiddleware,
  workflowEngineMiddleware
);

/**
 * Export middleware utilities
 */
export {
  validateGuardrails,
  type GuardrailsResult,
  type WorkflowContext,
};

