/**
 * Agent Architecture Index
 * 
 * Central export point for all agent-related functionality including:
 * - Agent registry
 * - Batch inference
 * - Middleware
 * - Guardrails
 * - Workflow engine
 */

// Agent Registry
export {
  type Agent,
  type AgentMetadata,
  type AgentExecutionContext,
  type AgentExecutionOptions,
  type AgentExecutionMode,
  BaseAgent,
  registerAgent,
  getAgent,
  getAllAgents,
  getAgentsByTag,
  executeAgent,
  default as agentRegistry,
} from "./agentRegistry";

// Agent Middleware
export {
  type MiddlewareContext,
  type MiddlewareFunction,
  type GuardrailsResult,
  type WorkflowContext,
  agentMiddleware,
  guardrailsMiddleware,
  workflowEngineMiddleware,
  composeMiddleware,
  defaultAgentMiddleware,
  validateGuardrails as validateGuardrailsMiddleware,
} from "./agentMiddleware";

// Guardrails
export {
  type GuardrailsConfig,
  type GuardrailsValidationResult,
  GuardrailsService,
  DEFAULT_GUARDRAILS_CONFIG,
  getGuardrailsService,
  validateGuardrails,
} from "./guardrails";

// Workflow Engine
export {
  type WorkflowStep,
  type WorkflowDefinition,
  type WorkflowExecutionContext,
  type WorkflowExecutionResult,
  WorkflowEngine,
  registerWorkflow,
  executeWorkflow,
  getWorkflow,
  default as workflowEngine,
} from "./workflowEngine";

// Batch Inference (re-exported from parent lib)
export {
  type BatchInferenceConfig,
  type QueuedPrompt,
  type BatchExecutionResult,
  queuePrompt,
  executeBatch,
  splitBatchResponse,
  flushBatch,
  getQueueStats,
  clearBatchQueue,
  configureBatchInference,
} from "../batchInference";


