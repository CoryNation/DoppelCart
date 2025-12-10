/**
 * Type definitions for the autonomous AI workflow system.
 * 
 * This module defines the core interfaces and types used by the workflow engine,
 * agent registry, and guardrail system.
 */

/**
 * Supported agent types in the system.
 * Each agent has a specific role in content creation workflows.
 */
export type AgentType = 'research' | 'writer' | 'editor' | 'scheduler';

/**
 * Action that an agent can perform.
 * Actions are agent-specific and define what the agent does in a workflow step.
 */
export type AgentAction = 
  | 'fetch_trends' 
  | 'analyze_audience' 
  | 'draft_content' 
  | 'refine' 
  | 'optimize' 
  | 'schedule_posts' 
  | 'validate_schedule';

/**
 * Tone options for content generation and guardrails.
 */
export type Tone = 
  | 'professional' 
  | 'casual' 
  | 'friendly' 
  | 'authoritative' 
  | 'humorous' 
  | 'inspirational' 
  | 'educational';

/**
 * Workflow step definition.
 * Each step specifies which agent performs which action.
 */
export interface WorkflowStep {
  /** The agent type that will execute this step */
  agent: AgentType;
  /** The specific action the agent should perform */
  action: AgentAction;
  /** Optional parameters specific to this step */
  params?: Record<string, unknown>;
  /** Optional condition that must be met before this step executes */
  condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
}

/**
 * Guardrail configuration for a workflow.
 * Defines safety rules and approval requirements.
 */
export interface WorkflowGuardrails {
  /** Target tone for content consistency */
  tone?: Tone;
  /** Whether human approval is required before posting */
  requireApproval?: boolean;
  /** Topics that are allowed (whitelist) */
  allowedTopics?: string[];
  /** Topics that are forbidden (blacklist) */
  forbiddenTopics?: string[];
  /** Phrases that must not appear in content */
  forbiddenPhrases?: string[];
  /** Tone boundaries - what tones are acceptable */
  toneBoundaries?: Tone[];
  /** Maximum content length in characters */
  maxLength?: number;
  /** Minimum content length in characters */
  minLength?: number;
}

/**
 * Complete workflow definition.
 * This is the format users define workflows in.
 */
export interface WorkflowDefinition {
  /** Unique identifier for the workflow */
  id?: string;
  /** Human-readable name */
  name: string;
  /** Description of what this workflow does */
  description?: string;
  /** Ordered list of steps to execute */
  steps: WorkflowStep[];
  /** Guardrail configuration */
  guardrails: WorkflowGuardrails;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Context passed between workflow steps.
 * Contains accumulated data from previous steps and workflow state.
 */
export interface WorkflowContext {
  /** Data produced by previous steps */
  data: Record<string, unknown>;
  /** Current step index */
  currentStep: number;
  /** Workflow definition being executed */
  workflow: WorkflowDefinition;
  /** User ID executing the workflow */
  userId: string;
  /** Persona ID if workflow is persona-specific */
  personaId?: string;
  /** Any errors encountered during execution */
  errors: WorkflowError[];
  /** Approval status if requireApproval is true */
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * Result of executing a single workflow step.
 */
export interface StepResult {
  /** Whether the step succeeded */
  success: boolean;
  /** Data produced by this step (added to context.data) */
  output?: Record<string, unknown>;
  /** Error if step failed */
  error?: string;
  /** Warnings or non-fatal issues */
  warnings?: string[];
  /** Metadata about step execution */
  metadata?: Record<string, unknown>;
}

/**
 * Result of executing an entire workflow.
 */
export interface WorkflowResult {
  /** Whether the workflow completed successfully */
  success: boolean;
  /** Final context state */
  context: WorkflowContext;
  /** Summary of execution */
  summary: string;
  /** Total execution time in milliseconds */
  executionTime?: number;
}

/**
 * Error encountered during workflow execution.
 */
export interface WorkflowError {
  /** Step index where error occurred */
  stepIndex: number;
  /** Agent type that encountered the error */
  agent: AgentType;
  /** Error message */
  message: string;
  /** Timestamp of error */
  timestamp: Date;
  /** Whether this error is recoverable */
  recoverable: boolean;
}

/**
 * Agent interface that all agents must implement.
 * This allows the registry to manage different agent types uniformly.
 */
export interface Agent {
  /** Agent type identifier */
  type: AgentType;
  /** Execute an action and return results */
  execute(action: AgentAction, context: WorkflowContext, params?: Record<string, unknown>): Promise<StepResult>;
  /** Get list of actions this agent supports */
  getSupportedActions(): AgentAction[];
  /** Validate that an action is supported */
  supportsAction(action: AgentAction): boolean;
}

/**
 * Guardrail check result.
 */
export interface GuardrailCheckResult {
  /** Whether content passed all guardrails */
  passed: boolean;
  /** Specific violations found */
  violations: GuardrailViolation[];
  /** Suggestions for fixing violations */
  suggestions?: string[];
}

/**
 * Individual guardrail violation.
 */
export interface GuardrailViolation {
  /** Type of violation */
  type: 'forbidden_phrase' | 'forbidden_topic' | 'tone_mismatch' | 'length' | 'approval_required';
  /** Description of the violation */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning';
  /** Location in content where violation occurred (if applicable) */
  location?: { start: number; end: number };
}


