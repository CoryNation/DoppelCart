/**
 * Agent Registry
 * 
 * Central registry for managing AI agents and their execution modes.
 * Supports both batch and immediate inference modes for cost optimization.
 */

import { queuePrompt } from "../batchInference";
import { callChatModel } from "../openai";

/**
 * Agent execution mode
 */
export type AgentExecutionMode = "batch" | "immediate" | "auto";

/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  executionMode: AgentExecutionMode;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  agentId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent execution options
 */
export interface AgentExecutionOptions {
  /** Override execution mode for this request */
  executionMode?: AgentExecutionMode;
  /** Override model for this request */
  model?: string;
  /** Override temperature for this request */
  temperature?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Agent interface that all agents must implement
 */
export interface Agent {
  /** Unique identifier for the agent */
  id: string;
  /** Human-readable name */
  name: string;
  /** Agent description */
  description?: string;
  /** Tags for categorization */
  tags: string[];
  /** Default execution mode */
  executionMode: AgentExecutionMode;
  /** Default system prompt */
  systemPrompt?: string;
  /** Default model */
  model?: string;
  /** Default temperature */
  temperature?: number;

  /**
   * Execute the agent with a given prompt
   */
  execute(
    prompt: string,
    context: AgentExecutionContext,
    options?: AgentExecutionOptions
  ): Promise<string>;
}

/**
 * Agent Registry class
 */
class AgentRegistryImpl {
  private agents = new Map<string, Agent>();

  /**
   * Register an agent
   */
  register(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent ${agent.id} is already registered. Overwriting.`);
    }
    this.agents.set(agent.id, agent);
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  /**
   * Get an agent by ID
   */
  get(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by tag
   */
  getByTag(tag: string): Agent[] {
    return this.getAll().filter((agent) => agent.tags.includes(tag));
  }

  /**
   * Execute an agent
   */
  async execute(
    agentId: string,
    prompt: string,
    context: AgentExecutionContext,
    options?: AgentExecutionOptions
  ): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent.execute(prompt, context, options);
  }
}

// Global registry instance
const agentRegistry = new AgentRegistryImpl();

/**
 * Base Agent implementation with batch inference support
 */
export abstract class BaseAgent implements Agent {
  abstract id: string;
  abstract name: string;
  abstract description?: string;
  abstract tags: string[];
  abstract executionMode: AgentExecutionMode;
  abstract systemPrompt?: string;
  abstract model?: string;
  abstract temperature?: number;

  /**
   * Execute the agent with support for batch inference
   */
  async execute(
    prompt: string,
    context: AgentExecutionContext,
    options?: AgentExecutionOptions
  ): Promise<string> {
    // Determine execution mode
    const mode = options?.executionMode || this.executionMode || "auto";
    
    // Determine model and temperature
    const model = options?.model || this.model;
    const temperature = options?.temperature ?? this.temperature;

    // Build tags for batch inference
    const tags = [
      ...this.tags,
      `agent:${this.id}`,
      ...(context.userId ? [`user:${context.userId}`] : []),
      ...(context.sessionId ? [`session:${context.sessionId}`] : []),
    ];

    // Execute based on mode
    if (mode === "immediate" || (mode === "auto" && shouldUseImmediate(prompt, context))) {
      return this.executeImmediate(prompt, model, temperature);
    } else {
      return queuePrompt(
        prompt,
        tags,
        {
          systemPrompt: this.systemPrompt,
          model,
          temperature,
          metadata: {
            ...context.metadata,
            ...options?.metadata,
            agentId: this.id,
          },
        }
      );
    }
  }

  /**
   * Execute immediately without batching
   */
  private async executeImmediate(
    prompt: string,
    model?: string,
    temperature?: number
  ): Promise<string> {
    const messages = this.systemPrompt
      ? [
          { role: "system" as const, content: this.systemPrompt },
          { role: "user" as const, content: prompt },
        ]
      : [{ role: "user" as const, content: prompt }];

    return callChatModel({
      messages,
      model,
      temperature,
    });
  }
}

/**
 * Determine if immediate execution should be used (for auto mode)
 */
function shouldUseImmediate(
  prompt: string,
  context: AgentExecutionContext
): boolean {
  // Use immediate execution for:
  // - Long prompts (batch efficiency decreases)
  // - Time-sensitive operations (can be determined by metadata)
  const isTimeSensitive = context.metadata?.timeSensitive === true;
  const isLongPrompt = prompt.length > 5000; // Arbitrary threshold

  return isTimeSensitive || isLongPrompt;
}

/**
 * Register an agent
 */
export function registerAgent(agent: Agent): void {
  agentRegistry.register(agent);
}

/**
 * Get an agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return agentRegistry.get(agentId);
}

/**
 * Get all agents
 */
export function getAllAgents(): Agent[] {
  return agentRegistry.getAll();
}

/**
 * Get agents by tag
 */
export function getAgentsByTag(tag: string): Agent[] {
  return agentRegistry.getByTag(tag);
}

/**
 * Execute an agent
 */
export function executeAgent(
  agentId: string,
  prompt: string,
  context: AgentExecutionContext,
  options?: AgentExecutionOptions
): Promise<string> {
  return agentRegistry.execute(agentId, prompt, context, options);
}

/**
 * Export the registry for direct access if needed
 */
export default agentRegistry;


