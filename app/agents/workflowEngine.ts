/**
 * Workflow Engine
 * 
 * Core engine for executing autonomous AI workflows with guardrails.
 * This module orchestrates the execution of workflow steps, manages context,
 * and enforces guardrails throughout the process.
 * 
 * Architecture:
 * - Sequential step execution with context passing
 * - Error handling and recovery
 * - Guardrail enforcement at each step
 * - Approval workflow support
 * 
 * To extend the engine:
 * 1. Add new step types in WorkflowStep interface
 * 2. Implement parallel execution support (currently sequential)
 * 3. Add retry logic for failed steps
 * 4. Implement step rollback for error recovery
 * 5. Add workflow templates/presets
 */

import { 
  WorkflowDefinition, 
  WorkflowContext, 
  WorkflowResult, 
  WorkflowError, 
  StepResult,
  WorkflowStep 
} from './types';
import { agentRegistry } from './agentRegistry';
import { checkGuardrails } from './guardrails';
import { validateVoiceConsistency } from './voiceLock';

/**
 * Execute a complete workflow from definition.
 * 
 * @param workflow - The workflow definition to execute
 * @param userId - User ID executing the workflow
 * @param personaId - Optional persona ID for persona-specific workflows
 * @param initialData - Optional initial data to seed the context
 * @returns Promise resolving to workflow execution result
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  userId: string,
  personaId?: string,
  initialData?: Record<string, unknown>
): Promise<WorkflowResult> {
  const startTime = Date.now();
  
  // Initialize workflow context
  const context: WorkflowContext = {
    data: initialData || {},
    currentStep: 0,
    workflow,
    userId,
    personaId,
    errors: [],
  };

  // Validate workflow definition
  const validationError = validateWorkflowDefinition(workflow);
  if (validationError) {
    return {
      success: false,
      context,
      summary: `Workflow validation failed: ${validationError}`,
      executionTime: Date.now() - startTime,
    };
  }

  // Execute each step sequentially
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    context.currentStep = i;

    // Check step condition if present
    if (step.condition) {
      try {
        const conditionResult = await step.condition(context);
        if (!conditionResult) {
          context.errors.push({
            stepIndex: i,
            agent: step.agent,
            message: `Step condition not met, skipping step`,
            timestamp: new Date(),
            recoverable: true,
          });
          continue; // Skip this step
        }
      } catch (error) {
        context.errors.push({
          stepIndex: i,
          agent: step.agent,
          message: `Error evaluating step condition: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          recoverable: false,
        });
        // Continue execution but mark as error
      }
    }

    // Execute the step
    const stepResult = await executeStep(step, context);

    // Handle step result
    if (!stepResult.success) {
      const error: WorkflowError = {
        stepIndex: i,
        agent: step.agent,
        message: stepResult.error || 'Step execution failed',
        timestamp: new Date(),
        recoverable: stepResult.error?.includes('recoverable') || false,
      };
      context.errors.push(error);

      // If step is not recoverable, stop workflow
      if (!error.recoverable) {
        return {
          success: false,
          context,
          summary: `Workflow failed at step ${i + 1} (${step.agent}/${step.action}): ${error.message}`,
          executionTime: Date.now() - startTime,
        };
      }
    } else {
      // Merge step output into context
      if (stepResult.output) {
        context.data = {
          ...context.data,
          ...stepResult.output,
        };
      }

      // Apply guardrails to step output if content was produced
      if (stepResult.output?.content || stepResult.output?.draft || stepResult.output?.refined) {
        const content = stepResult.output.content || stepResult.output.draft || stepResult.output.refined;
        const guardrailResult = await checkGuardrails(
          content,
          workflow.guardrails,
          context
        );

        if (!guardrailResult.passed) {
          // Log violations but don't fail workflow (editor can fix)
          context.errors.push({
            stepIndex: i,
            agent: step.agent,
            message: `Guardrail violations detected: ${guardrailResult.violations.map(v => v.message).join(', ')}`,
            timestamp: new Date(),
            recoverable: true,
          });

          // If approval is required and violations are critical, mark for approval
          if (workflow.guardrails.requireApproval) {
            context.approvalStatus = 'pending';
          }
        }
      }
    }
  }

  // Check if approval is required before completion
  if (workflow.guardrails.requireApproval && context.approvalStatus !== 'approved') {
    return {
      success: true,
      context,
      summary: `Workflow completed but requires approval before posting. ${context.errors.length} warnings encountered.`,
      executionTime: Date.now() - startTime,
    };
  }

  // Generate summary
  const errorCount = context.errors.length;
  const summary = errorCount > 0
    ? `Workflow completed with ${errorCount} warning(s). Review errors before proceeding.`
    : 'Workflow completed successfully.';

  return {
    success: true,
    context,
    summary,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Execute a single workflow step.
 * 
 * @param step - The step to execute
 * @param context - Current workflow context
 * @returns Promise resolving to step execution result
 */
async function executeStep(
  step: WorkflowStep,
  context: WorkflowContext
): Promise<StepResult> {
  // Get the appropriate agent
  const agent = agentRegistry.getAgent(step.agent);
  
  if (!agent) {
    return {
      success: false,
      error: `Agent type '${step.agent}' is not registered`,
    };
  }

  // Verify agent supports the action
  if (!agent.supportsAction(step.action)) {
    return {
      success: false,
      error: `Agent '${step.agent}' does not support action '${step.action}'`,
    };
  }

  // Execute the action
  try {
    const result = await agent.execute(step.action, context, step.params);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during step execution',
    };
  }
}

/**
 * Validate a workflow definition before execution.
 * 
 * @param workflow - Workflow definition to validate
 * @returns Error message if invalid, null if valid
 */
function validateWorkflowDefinition(workflow: WorkflowDefinition): string | null {
  if (!workflow.name || workflow.name.trim().length === 0) {
    return 'Workflow name is required';
  }

  if (!workflow.steps || workflow.steps.length === 0) {
    return 'Workflow must have at least one step';
  }

  if (!workflow.guardrails) {
    return 'Workflow must have guardrails configuration';
  }

  // Validate each step
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    
    if (!step.agent) {
      return `Step ${i + 1} is missing agent type`;
    }

    if (!step.action) {
      return `Step ${i + 1} is missing action`;
    }

    // Verify agent exists and supports action
    const agent = agentRegistry.getAgent(step.agent);
    if (!agent) {
      return `Step ${i + 1}: Agent type '${step.agent}' is not registered`;
    }

    if (!agent.supportsAction(step.action)) {
      return `Step ${i + 1}: Agent '${step.agent}' does not support action '${step.action}'`;
    }
  }

  return null; // Valid
}

/**
 * Approve a workflow that requires approval.
 * This updates the approval status in the context.
 * 
 * @param context - Workflow context to approve
 * @returns Updated context with approval status
 */
export function approveWorkflow(context: WorkflowContext): WorkflowContext {
  return {
    ...context,
    approvalStatus: 'approved',
  };
}

/**
 * Reject a workflow that requires approval.
 * 
 * @param context - Workflow context to reject
 * @param reason - Optional reason for rejection
 * @returns Updated context with rejection status
 */
export function rejectWorkflow(
  context: WorkflowContext,
  reason?: string
): WorkflowContext {
  return {
    ...context,
    approvalStatus: 'rejected',
    data: {
      ...context.data,
      rejectionReason: reason,
    },
  };
}

/**
 * Resume a workflow from a specific step.
 * Useful for retrying after errors or continuing after approval.
 * 
 * @param workflow - Workflow definition
 * @param context - Existing context to resume from
 * @param fromStep - Step index to resume from (default: currentStep)
 * @returns Promise resolving to workflow execution result
 */
export async function resumeWorkflow(
  workflow: WorkflowDefinition,
  context: WorkflowContext,
  fromStep?: number
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const resumeFrom = fromStep ?? context.currentStep;

  // Create a new workflow with steps from resume point
  const remainingWorkflow: WorkflowDefinition = {
    ...workflow,
    steps: workflow.steps.slice(resumeFrom),
  };

  // Update context
  const updatedContext: WorkflowContext = {
    ...context,
    currentStep: 0, // Reset to 0 for the remaining steps
    errors: [], // Clear previous errors for retry
  };

  // Execute remaining steps
  return executeWorkflow(
    remainingWorkflow,
    updatedContext.userId,
    updatedContext.personaId,
    updatedContext.data
  );
}

/**
 * Example workflow definition factory.
 * Creates a "Weekly LinkedIn Strategy" workflow as specified in requirements.
 */
export function createWeeklyLinkedInStrategyWorkflow(): WorkflowDefinition {
  return {
    name: 'Weekly LinkedIn Strategy',
    description: 'Automated weekly content strategy for LinkedIn',
    steps: [
      { agent: 'research', action: 'fetch_trends' },
      { agent: 'writer', action: 'draft_content' },
      { agent: 'editor', action: 'refine' },
      { agent: 'scheduler', action: 'schedule_posts' },
    ],
    guardrails: {
      tone: 'professional',
      requireApproval: true,
    },
  };
}


