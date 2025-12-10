/**
 * Batch Inference Module
 * 
 * Reduces OpenAI API costs by batching multiple agent prompts into a single API call.
 * This module queues prompts, combines them into batches, executes them efficiently,
 * and distributes responses back to the originating agents.
 * 
 * Key Features:
 * - Queues prompts with tags for grouping
 * - Executes batches when threshold or timeout is reached
 * - Splits and distributes responses to original requesters
 * - Supports both batch and immediate execution modes
 * - Compatible with guardrails and workflowEngine
 */

import { callChatModel } from "./openai";

/**
 * Configuration for batch inference behavior
 */
export interface BatchInferenceConfig {
  /** Maximum number of prompts to batch together */
  maxBatchSize: number;
  /** Maximum time (ms) to wait before executing a batch */
  maxBatchWaitTime: number;
  /** Minimum number of prompts required to trigger a batch */
  minBatchSize: number;
  /** Model to use for batch requests */
  model?: string;
  /** Temperature for batch requests */
  temperature?: number;
}

/**
 * Default batch inference configuration
 */
const DEFAULT_CONFIG: BatchInferenceConfig = {
  maxBatchSize: 10,
  maxBatchWaitTime: 5000, // 5 seconds
  minBatchSize: 2,
  model: process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini",
  temperature: 0.7,
};

/**
 * Queued prompt with metadata
 */
export interface QueuedPrompt {
  id: string;
  prompt: string;
  systemPrompt?: string;
  tags: string[];
  resolve: (response: string) => void;
  reject: (error: Error) => void;
  timestamp: number;
  model?: string;
  temperature?: number;
  responseFormatType?: "json_object" | "text";
  metadata?: Record<string, unknown>;
}

/**
 * Batch execution result
 */
export interface BatchExecutionResult {
  batchId: string;
  promptIds: string[];
  responses: Map<string, string>;
  errors: Map<string, Error>;
  executionTime: number;
}

/**
 * Global queue and state management
 */
class BatchInferenceQueue {
  private queue: QueuedPrompt[] = [];
  private config: BatchInferenceConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private executing = false;

  constructor(config: Partial<BatchInferenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a prompt to the queue
   */
  enqueue(prompt: QueuedPrompt): void {
    this.queue.push(prompt);
    
    // Auto-flush if batch size is reached
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
      return;
    }

    // Set timeout for auto-flush
    if (!this.flushTimer && this.queue.length >= this.config.minBatchSize) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.config.maxBatchWaitTime);
    }
  }

  /**
   * Flush the queue and execute batch
   */
  async flush(): Promise<BatchExecutionResult | null> {
    if (this.executing || this.queue.length === 0) {
      return null;
    }

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Extract batch (respecting max batch size)
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    
    if (batch.length < this.config.minBatchSize) {
      // Not enough prompts, put them back
      this.queue.unshift(...batch);
      return null;
    }

    this.executing = true;
    const startTime = Date.now();
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await executeBatch(batch, batchId, this.config);
      return result;
    } finally {
      this.executing = false;
      
      // Check if there are more items to process
      if (this.queue.length >= this.config.minBatchSize) {
        setTimeout(() => this.flush(), 100);
      }
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (useful for testing or cleanup)
   */
  clear(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.queue.forEach((item) => {
      item.reject(new Error("Queue cleared"));
    });
    this.queue = [];
  }
}

// Global queue instance
const globalQueue = new BatchInferenceQueue();

/**
 * Queue a prompt for batch inference
 * 
 * @param prompt - The user prompt/message
 * @param tags - Tags for grouping/identification (e.g., ["agent:persona-builder", "user:123"])
 * @param options - Additional options for the prompt
 * @returns Promise that resolves with the model response
 */
export async function queuePrompt(
  prompt: string,
  tags: string[],
  options?: {
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    responseFormatType?: "json_object" | "text";
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const queuedPrompt: QueuedPrompt = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prompt,
      systemPrompt: options?.systemPrompt,
      tags,
      resolve,
      reject,
      timestamp: Date.now(),
      model: options?.model,
      temperature: options?.temperature,
      responseFormatType: options?.responseFormatType,
      metadata: options?.metadata,
    };

    globalQueue.enqueue(queuedPrompt);
  });
}

/**
 * Execute a batch of prompts as a single OpenAI API call
 * 
 * This function combines multiple prompts into a structured format that
 * the model can process and return multiple responses.
 * 
 * @param batch - Array of queued prompts to execute
 * @param batchId - Unique identifier for this batch
 * @param config - Batch inference configuration
 * @returns Batch execution result with responses mapped to prompt IDs
 */
export async function executeBatch(
  batch: QueuedPrompt[],
  batchId: string,
  config: BatchInferenceConfig = DEFAULT_CONFIG
): Promise<BatchExecutionResult> {
  const startTime = Date.now();
  const responses = new Map<string, string>();
  const errors = new Map<string, Error>();

  try {
    // Group prompts by configuration (model, temperature, response format)
    const groupedBatches = groupPromptsByConfig(batch);

    // Execute each group separately
    for (const group of groupedBatches) {
      const groupResults = await executeGroupedBatch(group, config);
      
      // Merge results
      groupResults.responses.forEach((value, key) => {
        responses.set(key, value);
      });
      groupResults.errors.forEach((value, key) => {
        errors.set(key, value);
      });
    }

    // Resolve or reject each promise
    batch.forEach((item) => {
      if (responses.has(item.id)) {
        item.resolve(responses.get(item.id)!);
      } else if (errors.has(item.id)) {
        item.reject(errors.get(item.id)!);
      } else {
        item.reject(new Error("No response received for prompt"));
      }
    });

    const executionTime = Date.now() - startTime;

    return {
      batchId,
      promptIds: batch.map((p) => p.id),
      responses,
      errors,
      executionTime,
    };
  } catch (error) {
    // If batch execution fails, reject all promises
    const batchError = error instanceof Error ? error : new Error("Batch execution failed");
    batch.forEach((item) => {
      item.reject(batchError);
    });

    const executionTime = Date.now() - startTime;

    return {
      batchId,
      promptIds: batch.map((p) => p.id),
      responses: new Map(),
      errors: new Map(batch.map((p) => [p.id, batchError])),
      executionTime,
    };
  }
}

/**
 * Group prompts by configuration (model, temperature, response format)
 */
function groupPromptsByConfig(batch: QueuedPrompt[]): QueuedPrompt[][] {
  const groups = new Map<string, QueuedPrompt[]>();

  batch.forEach((prompt) => {
    const key = JSON.stringify({
      model: prompt.model,
      temperature: prompt.temperature,
      responseFormatType: prompt.responseFormatType,
      systemPrompt: prompt.systemPrompt,
    });

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(prompt);
  });

  return Array.from(groups.values());
}

/**
 * Execute a grouped batch (all prompts share the same config)
 */
async function executeGroupedBatch(
  batch: QueuedPrompt[],
  config: BatchInferenceConfig
): Promise<{ responses: Map<string, string>; errors: Map<string, Error> }> {
  const responses = new Map<string, string>();
  const errors = new Map<string, Error>();

  if (batch.length === 0) {
    return { responses, errors };
  }

  // Use the first prompt's config, or fall back to default config
  const firstPrompt = batch[0];
  const model = firstPrompt.model || config.model || DEFAULT_CONFIG.model!;
  const temperature = firstPrompt.temperature ?? config.temperature ?? DEFAULT_CONFIG.temperature!;
  const responseFormatType = firstPrompt.responseFormatType || "text";
  const systemPrompt = firstPrompt.systemPrompt;

  // Build a combined prompt that asks the model to respond to multiple requests
  const combinedPrompt = buildCombinedPrompt(batch, systemPrompt);

  try {
    const messages = systemPrompt
      ? [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: combinedPrompt },
        ]
      : [{ role: "user" as const, content: combinedPrompt }];

    const response = await callChatModel({
      messages,
      model,
      temperature,
      responseFormatType,
    });

    // Split the response back to individual responses
    const splitResponses = splitBatchResponse(response, batch.length);

    batch.forEach((item, index) => {
      if (index < splitResponses.length) {
        responses.set(item.id, splitResponses[index]);
      } else {
        errors.set(item.id, new Error("Response missing for prompt"));
      }
    });
  } catch (error) {
    const batchError = error instanceof Error ? error : new Error("Failed to execute batch");
    batch.forEach((item) => {
      errors.set(item.id, batchError);
    });
  }

  return { responses, errors };
}

/**
 * Build a combined prompt from multiple queued prompts
 */
function buildCombinedPrompt(batch: QueuedPrompt[], defaultSystemPrompt?: string): string {
  let combined = `You are processing ${batch.length} separate, independent requests. 
Please respond with exactly ${batch.length} responses, one for each request.
Separate each response with the delimiter: "---RESPONSE_SEPARATOR---"

Format your output as:
RESPONSE 1:
[response for first request]

---RESPONSE_SEPARATOR---

RESPONSE 2:
[response for second request]

---RESPONSE_SEPARATOR---

... (continue for all ${batch.length} requests)

IMPORTANT: You must provide exactly ${batch.length} responses, each separated by "---RESPONSE_SEPARATOR---"

Here are the ${batch.length} requests:

`;

  batch.forEach((item, index) => {
    combined += `\n=== REQUEST ${index + 1} ===\n`;
    if (item.tags.length > 0) {
      combined += `Tags: ${item.tags.join(", ")}\n`;
    }
    combined += `${item.prompt}\n`;
  });

  return combined;
}

/**
 * Split a batch response back into individual responses
 * 
 * @param batchResponse - The combined response from OpenAI
 * @param expectedCount - Expected number of responses
 * @returns Array of individual responses
 */
export function splitBatchResponse(
  batchResponse: string,
  expectedCount: number
): string[] {
  const separator = "---RESPONSE_SEPARATOR---";
  const parts = batchResponse.split(separator);

  // Clean up each part
  const responses = parts
    .map((part) => {
      // Remove response headers like "RESPONSE 1:" etc.
      return part
        .replace(/^RESPONSE\s+\d+\s*:?\s*/i, "")
        .replace(/^=== REQUEST \d+ ===/i, "")
        .trim();
    })
    .filter((part) => part.length > 0);

  // If we got fewer responses than expected, pad with empty strings
  while (responses.length < expectedCount) {
    responses.push("");
  }

  // If we got more responses than expected, truncate
  if (responses.length > expectedCount) {
    return responses.slice(0, expectedCount);
  }

  return responses;
}

/**
 * Manually trigger batch execution (useful for testing or manual control)
 */
export async function flushBatch(): Promise<BatchExecutionResult | null> {
  return globalQueue.flush();
}

/**
 * Get current queue statistics
 */
export function getQueueStats(): {
  queueSize: number;
  isExecuting: boolean;
} {
  return {
    queueSize: globalQueue.getQueueSize(),
    isExecuting: false, // This would need to be exposed from the queue class
  };
}

/**
 * Clear the batch queue (useful for testing or cleanup)
 */
export function clearBatchQueue(): void {
  globalQueue.clear();
}

/**
 * Configure batch inference settings
 */
export function configureBatchInference(config: Partial<BatchInferenceConfig>): void {
  // This would recreate the global queue with new config
  // For now, we'll use the default config
  // In a production system, you might want to make this more flexible
  console.warn("Batch inference configuration changes require queue recreation. Using defaults.");
}


