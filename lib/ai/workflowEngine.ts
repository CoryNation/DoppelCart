/**
 * Workflow Engine
 * 
 * Orchestrates multi-step agent workflows with support for batch inference.
 * Manages workflow state, step dependencies, and result passing between steps.
 */

import { AgentExecutionContext, AgentExecutionOptions, executeAgent } from "./agentRegistry";

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  /** Unique step identifier */
  id: string;
  /** Agent ID to execute for this step */
  agentId: string;
  /** Step name/description */
  name: string;
  /** Prompt template (can use {{previousResult}} or {{stepId.result}} syntax) */
  promptTemplate: string;
  /** Execution options for this step */
  options?: AgentExecutionOptions;
  /** Dependencies - steps that must complete before this step */
  dependencies?: string[];
  /** Whether this step is optional */
  optional?: boolean;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  /** Unique workflow identifier */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Steps in the workflow */
  steps: WorkflowStep[];
  /** Maximum parallel execution (default: 1) */
  maxParallel?: number;
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext extends AgentExecutionContext {
  workflowId: string;
  workflowName: string;
  stepResults: Map<string, unknown>;
  currentStep?: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  success: boolean;
  stepResults: Map<string, { success: boolean; result?: unknown; error?: Error }>;
  executionTime: number;
  errors: Error[];
}

/**
 * Workflow Engine class
 */
export class WorkflowEngine {
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecutionResult>();

  /**
   * Register a workflow
   */
  register(workflow: WorkflowDefinition): void {
    if (this.workflows.has(workflow.id)) {
      console.warn(`Workflow ${workflow.id} is already registered. Overwriting.`);
    }
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Get a workflow by ID
   */
  get(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflowId: string,
    initialContext: Omit<AgentExecutionContext, "agentId">,
    initialData?: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const startTime = Date.now();
    const stepResults = new Map<string, { success: boolean; result?: unknown; error?: Error }>();
    const errors: Error[] = [];

    // Build workflow context
    const workflowContext: WorkflowExecutionContext = {
      ...initialContext,
      agentId: workflowId, // Use workflow ID as agent ID for context
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepResults: new Map(),
      metadata: {
        ...initialContext.metadata,
        initialData,
      },
    };

    // Initialize step results with initial data
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        workflowContext.stepResults.set(key, value);
      });
    }

    // Execute steps in dependency order
    const executedSteps = new Set<string>();
    const maxParallel = workflow.maxParallel || 1;

    try {
      await this.executeStepsRecursive(
        workflow.steps,
        workflowContext,
        executedSteps,
        stepResults,
        errors,
        maxParallel
      );
    } catch (error) {
      const workflowError = error instanceof Error ? error : new Error("Workflow execution failed");
      errors.push(workflowError);
    }

    const executionTime = Date.now() - startTime;

    const result: WorkflowExecutionResult = {
      workflowId: workflow.id,
      success: errors.length === 0,
      stepResults,
      executionTime,
      errors,
    };

    // Store execution result
    this.executions.set(`${workflowId}-${Date.now()}`, result);

    return result;
  }

  /**
   * Execute steps recursively respecting dependencies
   */
  private async executeStepsRecursive(
    steps: WorkflowStep[],
    context: WorkflowExecutionContext,
    executedSteps: Set<string>,
    stepResults: Map<string, { success: boolean; result?: unknown; error?: Error }>,
    errors: Error[],
    maxParallel: number
  ): Promise<void> {
    // Find steps that can be executed (dependencies satisfied)
    const readySteps = steps.filter(
      (step) =>
        !executedSteps.has(step.id) &&
        (!step.dependencies || step.dependencies.every((dep) => executedSteps.has(dep)))
    );

    if (readySteps.length === 0) {
      return;
    }

    // Execute ready steps (up to maxParallel)
    const stepsToExecute = readySteps.slice(0, maxParallel);
    const executionPromises = stepsToExecute.map((step) =>
      this.executeStep(step, context, stepResults, errors)
    );

    await Promise.all(executionPromises);

    // Mark steps as executed
    stepsToExecute.forEach((step) => {
      executedSteps.add(step.id);
    });

    // Continue with remaining steps
    await this.executeStepsRecursive(steps, context, executedSteps, stepResults, errors, maxParallel);
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    stepResults: Map<string, { success: boolean; result?: unknown; error?: Error }>,
    errors: Error[]
  ): Promise<void> {
    try {
      context.currentStep = step.id;

      // Resolve prompt template with previous results
      const prompt = this.resolvePromptTemplate(step.promptTemplate, context);

      // Build agent execution context
      const agentContext: AgentExecutionContext = {
        ...context,
        agentId: step.agentId,
        metadata: {
          ...context.metadata,
          workflowId: context.workflowId,
          workflowStepId: step.id,
          workflowStepName: step.name,
        },
      };

      // Execute agent
      const result = await executeAgent(
        step.agentId,
        prompt,
        agentContext,
        step.options
      );

      // Store result
      context.stepResults.set(step.id, result);
      stepResults.set(step.id, {
        success: true,
        result,
      });
    } catch (error) {
      const stepError = error instanceof Error ? error : new Error("Step execution failed");
      errors.push(stepError);

      stepResults.set(step.id, {
        success: false,
        error: stepError,
      });

      // If step is not optional, throw error
      if (!step.optional) {
        throw stepError;
      }
    }
  }

  /**
   * Resolve prompt template with step results
   */
  private resolvePromptTemplate(
    template: string,
    context: WorkflowExecutionContext
  ): string {
    let resolved = template;

    // Replace {{previousResult}} with the result from the last executed step
    const previousResult = Array.from(context.stepResults.values()).pop();
    if (previousResult) {
      resolved = resolved.replace(
        /\{\{previousResult\}\}/g,
        String(previousResult)
      );
    }

    // Replace {{stepId.result}} with specific step results
    context.stepResults.forEach((result, stepId) => {
      const placeholder = new RegExp(`\\{\\{${stepId}\\.result\\}\\}`, "g");
      resolved = resolved.replace(placeholder, String(result));
    });

    // Replace other context variables
    if (context.userId) {
      resolved = resolved.replace(/\{\{userId\}\}/g, context.userId);
    }
    if (context.sessionId) {
      resolved = resolved.replace(/\{\{sessionId\}\}/g, context.sessionId);
    }

    return resolved;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(workflowId: string): WorkflowExecutionResult[] {
    return Array.from(this.executions.values()).filter(
      (execution) => execution.workflowId === workflowId
    );
  }
}

// Global workflow engine instance
const globalWorkflowEngine = new WorkflowEngine();

/**
 * Register a workflow
 */
export function registerWorkflow(workflow: WorkflowDefinition): void {
  globalWorkflowEngine.register(workflow);
}

/**
 * Execute a workflow
 */
export function executeWorkflow(
  workflowId: string,
  initialContext: Omit<AgentExecutionContext, "agentId">,
  initialData?: Record<string, unknown>
): Promise<WorkflowExecutionResult> {
  return globalWorkflowEngine.execute(workflowId, initialContext, initialData);
}

/**
 * Get a workflow by ID
 */
export function getWorkflow(workflowId: string): WorkflowDefinition | undefined {
  return globalWorkflowEngine.get(workflowId);
}

/**
 * Export the workflow engine for direct access if needed
 */
export default globalWorkflowEngine;


