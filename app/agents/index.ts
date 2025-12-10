/**
 * Autonomous AI Workflow System
 * 
 * Main entry point for the workflow engine, agents, and guardrails.
 * 
 * Usage example:
 * ```typescript
 * import { executeWorkflow, createWeeklyLinkedInStrategyWorkflow } from '@/app/agents';
 * 
 * const workflow = createWeeklyLinkedInStrategyWorkflow();
 * const result = await executeWorkflow(workflow, userId, personaId);
 * ```
 */

// Core workflow engine
export {
  executeWorkflow,
  approveWorkflow,
  rejectWorkflow,
  resumeWorkflow,
  createWeeklyLinkedInStrategyWorkflow,
} from './workflowEngine';

// Agent registry
export {
  agentRegistry,
  ResearchAgent,
  WriterAgent,
  EditorAgent,
  SchedulerAgent,
} from './agentRegistry';

// Guardrails
export {
  checkGuardrails,
  createProfessionalGuardrails,
  createCasualGuardrails,
} from './guardrails';

// Voice Lock
export {
  validateVoiceConsistency,
  buildVoiceProfile,
  compareToVoiceProfile,
} from './voiceLock';

// Types
export type {
  AgentType,
  AgentAction,
  Tone,
  WorkflowStep,
  WorkflowGuardrails,
  WorkflowDefinition,
  WorkflowContext,
  WorkflowResult,
  WorkflowError,
  StepResult,
  Agent,
  GuardrailCheckResult,
  GuardrailViolation,
  VoiceConsistencyResult,
  VoiceProfile,
} from './types';


