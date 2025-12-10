# Autonomous AI Workflow System

This module implements a modular architecture for autonomous AI workflows with guardrails in DoppelCart.

## Architecture Overview

The system consists of four core components:

1. **Agent Registry** (`agentRegistry.ts`) - Manages different agent types (research, writer, editor, scheduler)
2. **Workflow Engine** (`workflowEngine.ts`) - Executes workflows step-by-step with error handling
3. **Guardrails** (`guardrails.ts`) - Enforces brand safety, content validation, and approval workflows
4. **Voice Lock** (`voiceLock.ts`) - Maintains tone consistency across content

## Quick Start

### Basic Workflow Execution

```typescript
import { executeWorkflow, createWeeklyLinkedInStrategyWorkflow } from '@/app/agents';

// Create a workflow
const workflow = createWeeklyLinkedInStrategyWorkflow();

// Execute it
const result = await executeWorkflow(
  workflow,
  userId,
  personaId
);

if (result.success) {
  console.log(result.summary);
  console.log('Generated content:', result.context.data.content);
} else {
  console.error('Workflow failed:', result.summary);
}
```

### Custom Workflow Definition

```typescript
import { WorkflowDefinition } from '@/app/agents';

const customWorkflow: WorkflowDefinition = {
  name: 'Daily Content Creation',
  description: 'Generate and schedule daily content',
  steps: [
    { agent: 'research', action: 'fetch_trends', params: { platform: 'linkedin' } },
    { agent: 'writer', action: 'draft_content', params: { topic: 'AI automation' } },
    { agent: 'editor', action: 'refine' },
    { agent: 'scheduler', action: 'schedule_posts' },
  ],
  guardrails: {
    tone: 'professional',
    requireApproval: true,
    forbiddenPhrases: ['spam', 'scam'],
    forbiddenTopics: ['get rich quick'],
    minLength: 100,
    maxLength: 2000,
  },
};

const result = await executeWorkflow(customWorkflow, userId, personaId);
```

### Using Guardrails

```typescript
import { checkGuardrails, createProfessionalGuardrails } from '@/app/agents';

const guardrails = createProfessionalGuardrails();
const content = 'Your content here...';

const check = await checkGuardrails(content, guardrails, context);

if (!check.passed) {
  console.log('Violations:', check.violations);
  console.log('Suggestions:', check.suggestions);
}
```

### Voice Consistency Validation

```typescript
import { validateVoiceConsistency } from '@/app/agents';

const result = await validateVoiceConsistency(
  content,
  'professional',
  workflowContext
);

if (!result.consistent) {
  console.log('Tone mismatch:', result.reason);
  console.log('Suggestions:', result.suggestions);
}
```

## Extending the System

### Adding a New Agent

1. Create a new agent class implementing the `Agent` interface:

```typescript
import { Agent, AgentType, AgentAction, WorkflowContext, StepResult } from './types';

class CustomAgent implements Agent {
  type: AgentType = 'custom';
  
  getSupportedActions(): AgentAction[] {
    return ['custom_action'];
  }
  
  supportsAction(action: AgentAction): boolean {
    return this.getSupportedActions().includes(action);
  }
  
  async execute(
    action: AgentAction,
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // Implement your agent logic
    return { success: true, output: { /* your data */ } };
  }
}
```

2. Register it in `agentRegistry.ts`:

```typescript
agentRegistry.registerAgent(new CustomAgent());
```

3. Add the agent type to `types.ts`:

```typescript
export type AgentType = 'research' | 'writer' | 'editor' | 'scheduler' | 'custom';
```

### Adding New Workflow Steps

1. Add the action to `types.ts`:

```typescript
export type AgentAction = 
  | 'fetch_trends' 
  | 'draft_content'
  | 'custom_action'; // Add your action
```

2. Implement the action in the appropriate agent class.

### Creating Guardrail Presets

```typescript
export function createIndustrySpecificGuardrails(): WorkflowGuardrails {
  return {
    tone: 'professional',
    requireApproval: true,
    forbiddenPhrases: ['industry-specific', 'forbidden', 'phrases'],
    allowedTopics: ['topic1', 'topic2'],
    toneBoundaries: ['professional', 'authoritative'],
  };
}
```

## Workflow Execution Flow

1. **Validation** - Workflow definition is validated
2. **Step Execution** - Each step runs sequentially
3. **Context Passing** - Data from each step is added to context
4. **Guardrail Checks** - Content is validated after generation steps
5. **Approval** - If required, workflow waits for approval
6. **Completion** - Final result is returned with summary

## Error Handling

- **Recoverable Errors**: Workflow continues, error is logged
- **Non-Recoverable Errors**: Workflow stops immediately
- **Guardrail Violations**: Logged as warnings, workflow continues (approval may be required)

## Future Enhancements

The architecture supports these extensions:

- **Parallel Step Execution**: Modify `workflowEngine.ts` to support concurrent steps
- **Step Retry Logic**: Add retry mechanisms for failed steps
- **Workflow Templates**: Create reusable workflow templates
- **Conditional Branching**: Enhanced step conditions for complex workflows
- **External Integrations**: Connect agents to real APIs (research APIs, social platforms)
- **Machine Learning**: Enhanced tone detection and voice profiling
- **Workflow Scheduling**: Cron-based automatic workflow execution
- **Analytics**: Track workflow performance and success rates

## Integration Points

### With Supabase

- Store workflow definitions in database
- Save workflow execution history
- Track approval status
- Store generated content in `content_items` table

### With OpenAI

- Agents use `lib/openai.ts` for AI operations
- Voice Lock uses OpenAI for tone analysis
- Writer and Editor agents generate/refine content via OpenAI

### With Personas

- Workflows can be persona-specific via `personaId` parameter
- Voice Lock can use persona voice profiles
- Content generation respects persona characteristics

## Notes

- All agents currently use mock data - integrate with real APIs for production
- Voice Lock uses OpenAI for accurate tone analysis with fallback to keyword matching
- Guardrails are extensible - add custom validation rules as needed
- Workflow engine is sequential by default - parallel execution requires modification


