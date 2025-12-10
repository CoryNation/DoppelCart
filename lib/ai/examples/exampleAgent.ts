/**
 * Example Agent Implementation
 * 
 * This file demonstrates how to create and use agents with the batch inference system.
 * Use this as a reference when creating new agents.
 */

import { BaseAgent, registerAgent, type AgentExecutionContext } from "../agentRegistry";
import { executeAgent } from "../agentRegistry";
import { validateGuardrails } from "../guardrails";

/**
 * Example: Persona Builder Agent
 * This agent helps build personas using batch inference by default.
 */
export class PersonaBuilderAgent extends BaseAgent {
  id = "persona-builder";
  name = "Persona Builder";
  description = "Builds and refines social media personas";
  tags = ["persona", "content", "social-media"];
  executionMode = "batch"; // Use batch inference by default
  systemPrompt = `You are a Persona Architect helping create social media personas.
  Focus on authenticity, consistency, and engagement potential.`;
  model = "gpt-4o-mini";
  temperature = 0.7;
}

/**
 * Example: Content Generator Agent
 * This agent generates content and can be used in immediate or batch mode.
 */
export class ContentGeneratorAgent extends BaseAgent {
  id = "content-generator";
  name = "Content Generator";
  description = "Generates social media content";
  tags = ["content", "generation"];
  executionMode = "auto"; // Automatically decides based on context
  systemPrompt = `You are a Content Creator specializing in engaging social media posts.
  Create content that is authentic, valuable, and aligned with the persona's voice.`;
  model = "gpt-4o-mini";
  temperature = 0.8;
}

/**
 * Example: Research Agent
 * This agent performs research and uses immediate execution for time-sensitive tasks.
 */
export class ResearchAgent extends BaseAgent {
  id = "research";
  name = "Research Agent";
  description = "Performs research and analysis";
  tags = ["research", "analysis"];
  executionMode = "immediate"; // Use immediate execution for research
  systemPrompt = `You are a Research Analyst. Provide thorough, accurate, and well-structured research results.`;
  model = "gpt-4o-mini";
  temperature = 0.5;
}

/**
 * Example usage function
 */
export async function exampleUsage() {
  // Register agents
  registerAgent(new PersonaBuilderAgent());
  registerAgent(new ContentGeneratorAgent());
  registerAgent(new ResearchAgent());

  // Example 1: Execute agent with batch inference (default)
  const context1: AgentExecutionContext = {
    agentId: "persona-builder",
    userId: "user-123",
    sessionId: "session-456",
  };

  try {
    const result1 = await executeAgent(
      "persona-builder",
      "Create a persona for a tech startup founder focused on AI",
      context1
    );
    console.log("Persona Builder Result:", result1);
  } catch (error) {
    console.error("Error:", error);
  }

  // Example 2: Execute agent with immediate mode override
  const context2: AgentExecutionContext = {
    agentId: "content-generator",
    userId: "user-123",
    sessionId: "session-456",
  };

  try {
    const result2 = await executeAgent(
      "content-generator",
      "Generate a post about AI ethics",
      context2,
      {
        executionMode: "immediate", // Override to immediate
        metadata: {
          timeSensitive: true, // This would trigger immediate mode in auto mode
        },
      }
    );
    console.log("Content Generator Result:", result2);
  } catch (error) {
    console.error("Error:", error);
  }

  // Example 3: Use guardrails validation
  const context3: AgentExecutionContext = {
    agentId: "research",
    userId: "user-123",
    sessionId: "session-456",
  };

  const validationResult = await validateGuardrails(
    "Research the latest trends in AI",
    context3
  );

  if (validationResult.allowed) {
    const result3 = await executeAgent(
      "research",
      validationResult.sanitizedPrompt || "Research the latest trends in AI",
      context3
    );
    console.log("Research Result:", result3);
  } else {
    console.error("Guardrails validation failed:", validationResult.reason);
  }
}

/**
 * Example: Using agents in a workflow
 */
export async function exampleWorkflowUsage() {
  // Import workflow engine
  const { registerWorkflow, executeWorkflow } = await import("../workflowEngine");

  // Define a workflow
  registerWorkflow({
    id: "persona-content-workflow",
    name: "Persona Content Generation Workflow",
    description: "Creates a persona and generates initial content",
    maxParallel: 1, // Execute steps sequentially
    steps: [
      {
        id: "build-persona",
        agentId: "persona-builder",
        name: "Build Persona",
        promptTemplate: "Create a persona for: {{initialData.description}}",
        options: {
          executionMode: "batch", // Use batch inference
        },
      },
      {
        id: "generate-content",
        agentId: "content-generator",
        name: "Generate Content",
        promptTemplate:
          "Based on this persona: {{build-persona.result}}, generate 5 initial content ideas",
        dependencies: ["build-persona"],
        options: {
          executionMode: "batch", // Use batch inference
        },
      },
    ],
  });

  // Execute workflow
  const context: AgentExecutionContext = {
    agentId: "persona-content-workflow",
    userId: "user-123",
    sessionId: "session-456",
  };

  try {
    const result = await executeWorkflow(
      "persona-content-workflow",
      context,
      {
        description: "A tech startup founder focused on AI ethics",
      }
    );

    console.log("Workflow Result:", result);
  } catch (error) {
    console.error("Workflow Error:", error);
  }
}

// Export example agents for use in other files
export { PersonaBuilderAgent, ContentGeneratorAgent, ResearchAgent };


