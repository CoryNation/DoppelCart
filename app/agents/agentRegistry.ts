/**
 * Agent Registry
 * 
 * Central registry for managing and executing different types of agents
 * in the workflow system. This module provides a factory pattern for
 * creating and accessing agents by type.
 * 
 * To add a new agent type:
 * 1. Create a new agent class implementing the Agent interface
 * 2. Register it in the initializeAgents() function
 * 3. Add the agent type to the AgentType union in types.ts
 */

import { Agent, AgentType, AgentAction, WorkflowContext, StepResult } from './types';

/**
 * Research Agent
 * Handles data gathering, trend analysis, and audience research.
 */
class ResearchAgent implements Agent {
  type: AgentType = 'research';

  getSupportedActions(): AgentAction[] {
    return ['fetch_trends', 'analyze_audience'];
  }

  supportsAction(action: AgentAction): boolean {
    return this.getSupportedActions().includes(action);
  }

  async execute(
    action: AgentAction,
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    if (!this.supportsAction(action)) {
      return {
        success: false,
        error: `Research agent does not support action: ${action}`,
      };
    }

    try {
      switch (action) {
        case 'fetch_trends':
          return await this.fetchTrends(context, params);
        case 'analyze_audience':
          return await this.analyzeAudience(context, params);
        default:
          return {
            success: false,
            error: `Unhandled action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in research agent',
      };
    }
  }

  private async fetchTrends(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // TODO: Integrate with actual research APIs (e.g., Google Trends, social media APIs)
    // For now, return mock data structure
    const platform = (params?.platform as string) || 'linkedin';
    const timeframe = (params?.timeframe as string) || '7d';

    // Simulate research data
    const trends = {
      platform,
      timeframe,
      trendingTopics: [
        'AI automation',
        'Content strategy',
        'Personal branding',
      ],
      engagementMetrics: {
        avgLikes: 150,
        avgComments: 25,
        avgShares: 10,
      },
      recommendedTopics: [
        'Workflow automation',
        'AI productivity',
        'Content creation tools',
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        trends,
        researchData: trends,
      },
      metadata: {
        platform,
        timeframe,
        dataSource: 'mock',
      },
    };
  }

  private async analyzeAudience(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // TODO: Integrate with persona data and analytics
    const personaId = context.personaId || (params?.personaId as string);

    const audienceAnalysis = {
      personaId,
      demographics: {
        ageRange: '25-45',
        interests: ['technology', 'productivity', 'business'],
      },
      engagementPatterns: {
        bestPostingTimes: ['09:00', '12:00', '17:00'],
        preferredContentTypes: ['educational', 'tips', 'case studies'],
      },
      recommendations: [
        'Focus on actionable insights',
        'Use data-driven examples',
        'Maintain professional tone',
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        audienceAnalysis,
      },
      metadata: {
        personaId,
      },
    };
  }
}

/**
 * Writing Agent
 * Handles content drafting and initial content generation.
 */
class WriterAgent implements Agent {
  type: AgentType = 'writer';

  getSupportedActions(): AgentAction[] {
    return ['draft_content'];
  }

  supportsAction(action: AgentAction): boolean {
    return this.getSupportedActions().includes(action);
  }

  async execute(
    action: AgentAction,
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    if (!this.supportsAction(action)) {
      return {
        success: false,
        error: `Writer agent does not support action: ${action}`,
      };
    }

    try {
      switch (action) {
        case 'draft_content':
          return await this.draftContent(context, params);
        default:
          return {
            success: false,
            error: `Unhandled action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in writer agent',
      };
    }
  }

  private async draftContent(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // TODO: Integrate with OpenAI API via lib/openai.ts
    // Use trends and audience data from previous steps
    const trends = context.data.trends as Record<string, unknown> | undefined;
    const audienceAnalysis = context.data.audienceAnalysis as Record<string, unknown> | undefined;
    const topic = (params?.topic as string) || 'AI workflows';
    const tone = context.workflow.guardrails.tone || 'professional';

    // For now, return structured mock content
    // In production, this would call OpenAI with persona context
    const draft = {
      title: `Mastering ${topic}: A Complete Guide`,
      caption: `Here's how to leverage ${topic} for your business. Key insights from recent trends show that automation is becoming essential.`,
      hashtags: ['#AI', '#Automation', '#Productivity'],
      platform: (params?.platform as string) || 'linkedin',
      tone,
      wordCount: 150,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        draft,
        content: draft,
      },
      metadata: {
        topic,
        tone,
        sourceData: {
          hasTrends: !!trends,
          hasAudienceData: !!audienceAnalysis,
        },
      },
    };
  }
}

/**
 * Editor Agent
 * Handles content refinement, optimization, and quality checks.
 */
class EditorAgent implements Agent {
  type: AgentType = 'editor';

  getSupportedActions(): AgentAction[] {
    return ['refine', 'optimize'];
  }

  supportsAction(action: AgentAction): boolean {
    return this.getSupportedActions().includes(action);
  }

  async execute(
    action: AgentAction,
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    if (!this.supportsAction(action)) {
      return {
        success: false,
        error: `Editor agent does not support action: ${action}`,
      };
    }

    try {
      switch (action) {
        case 'refine':
          return await this.refineContent(context, params);
        case 'optimize':
          return await this.optimizeContent(context, params);
        default:
          return {
            success: false,
            error: `Unhandled action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in editor agent',
      };
    }
  }

  private async refineContent(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // TODO: Integrate with OpenAI for content refinement
    // Use voiceLock to ensure tone consistency
    const draft = context.data.draft || context.data.content;
    
    if (!draft) {
      return {
        success: false,
        error: 'No draft content found in context to refine',
      };
    }

    // Simulate refinement
    const refined = {
      ...(draft as Record<string, unknown>),
      refined: true,
      improvements: [
        'Enhanced clarity',
        'Improved flow',
        'Better engagement hooks',
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        refined,
        content: refined,
      },
      metadata: {
        originalLength: (draft as { wordCount?: number })?.wordCount || 0,
        refinedLength: (refined as { wordCount?: number })?.wordCount || 0,
      },
    };
  }

  private async optimizeContent(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // TODO: Integrate SEO optimization, platform-specific formatting
    const content = context.data.refined || context.data.content || context.data.draft;
    
    if (!content) {
      return {
        success: false,
        error: 'No content found in context to optimize',
      };
    }

    const optimized = {
      ...(content as Record<string, unknown>),
      optimized: true,
      seoScore: 85,
      engagementScore: 78,
      optimizations: [
        'Added relevant hashtags',
        'Optimized for platform algorithm',
        'Enhanced call-to-action',
      ],
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        optimized,
        content: optimized,
      },
    };
  }
}

/**
 * Scheduler Agent
 * Handles scheduling and posting of content.
 */
class SchedulerAgent implements Agent {
  type: AgentType = 'scheduler';

  getSupportedActions(): AgentAction[] {
    return ['schedule_posts', 'validate_schedule'];
  }

  supportsAction(action: AgentAction): boolean {
    return this.getSupportedActions().includes(action);
  }

  async execute(
    action: AgentAction,
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    if (!this.supportsAction(action)) {
      return {
        success: false,
        error: `Scheduler agent does not support action: ${action}`,
      };
    }

    try {
      switch (action) {
        case 'schedule_posts':
          return await this.schedulePosts(context, params);
        case 'validate_schedule':
          return await this.validateSchedule(context, params);
        default:
          return {
            success: false,
            error: `Unhandled action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in scheduler agent',
      };
    }
  }

  private async schedulePosts(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    // TODO: Integrate with Supabase scheduled_posts table
    // Check if approval is required before scheduling
    const content = context.data.optimized || context.data.refined || context.data.content;
    
    if (!content) {
      return {
        success: false,
        error: 'No content found in context to schedule',
      };
    }

    const requireApproval = context.workflow.guardrails.requireApproval;
    
    if (requireApproval && context.approvalStatus !== 'approved') {
      return {
        success: false,
        error: 'Content requires approval before scheduling',
        output: {
          approvalRequired: true,
          content,
        },
      };
    }

    const scheduledTime = (params?.scheduledTime as string) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const platform = (params?.platform as string) || (content as { platform?: string })?.platform || 'linkedin';

    const schedule = {
      contentId: `content_${Date.now()}`,
      scheduledTime,
      platform,
      status: requireApproval ? 'pending_approval' : 'scheduled',
      content,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        schedule,
        scheduledPosts: [schedule],
      },
      metadata: {
        scheduledTime,
        platform,
        requiresApproval: requireApproval || false,
      },
    };
  }

  private async validateSchedule(
    context: WorkflowContext,
    params?: Record<string, unknown>
  ): Promise<StepResult> {
    const schedule = context.data.schedule || context.data.scheduledPosts;
    
    if (!schedule) {
      return {
        success: false,
        error: 'No schedule found in context to validate',
      };
    }

    // Validate scheduling constraints
    const scheduledTime = new Date((schedule as { scheduledTime?: string })?.scheduledTime || '');
    const now = new Date();
    
    if (scheduledTime < now) {
      return {
        success: false,
        error: 'Scheduled time is in the past',
        warnings: ['Schedule time must be in the future'],
      };
    }

    return {
      success: true,
      output: {
        validated: true,
        schedule,
      },
      metadata: {
        scheduledTime: scheduledTime.toISOString(),
        isValid: true,
      },
    };
  }
}

/**
 * Agent Registry
 * Singleton pattern for managing all agents.
 */
class AgentRegistry {
  private agents: Map<AgentType, Agent> = new Map();

  /**
   * Initialize all available agents.
   * Call this once at application startup or module load.
   */
  initializeAgents(): void {
    this.agents.set('research', new ResearchAgent());
    this.agents.set('writer', new WriterAgent());
    this.agents.set('editor', new EditorAgent());
    this.agents.set('scheduler', new SchedulerAgent());
  }

  /**
   * Get an agent by type.
   */
  getAgent(type: AgentType): Agent | undefined {
    return this.agents.get(type);
  }

  /**
   * Register a custom agent.
   * Useful for extending the system with new agent types.
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.type, agent);
  }

  /**
   * Get all registered agent types.
   */
  getRegisteredTypes(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if an agent type is registered.
   */
  hasAgent(type: AgentType): boolean {
    return this.agents.has(type);
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();

// Initialize default agents on module load
agentRegistry.initializeAgents();

// Export agent classes for testing or extension
export { ResearchAgent, WriterAgent, EditorAgent, SchedulerAgent };


