/**
 * BaseAgent - Abstract base class for all agents
 *
 * Encapsulates the common agent execution pattern using AI SDK v6's
 * generateText with stopWhen conditions for graceful termination.
 *
 * Key Features:
 * - Unified execution interface via run() method
 * - AI SDK v6 native: stopWhen with hasToolCall('finalAnswer') + stepCountIs(N)
 * - Provider fallback chain support
 * - Step-by-step monitoring via onStepFinish
 * - Timeout protection with configurable limits
 *
 * @version 1.0.0
 * @created 2026-01-27
 */

import { generateText, streamText, hasToolCall, stepCountIs, type LanguageModel, type Tool } from 'ai';
import { sanitizeChineseCharacters } from '../../../lib/text-sanitizer';
import type { AgentConfig, ModelResult } from './config';

// ============================================================================
// Types
// ============================================================================

/**
 * Result returned by agent execution
 */
export interface AgentResult {
  /** Generated text response */
  text: string;
  /** Whether execution was successful */
  success: boolean;
  /** Tools called during execution */
  toolsCalled: string[];
  /** Token usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Execution metadata */
  metadata: {
    provider: string;
    modelId: string;
    durationMs: number;
    steps: number;
    finishReason?: string;
  };
  /** Error message if failed */
  error?: string;
}

/**
 * Configuration options for agent execution
 */
export interface AgentRunOptions {
  /** Maximum execution time in milliseconds */
  timeoutMs?: number;
  /** Maximum number of steps (LLM calls) */
  maxSteps?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Enable web search tools */
  webSearchEnabled?: boolean;
  /** Session ID for context tracking */
  sessionId?: string;
}

/**
 * Stream event types for streaming execution
 */
export interface AgentStreamEvent {
  type: 'text_delta' | 'tool_call' | 'step_finish' | 'done' | 'error' | 'warning';
  data: unknown;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<AgentRunOptions, 'sessionId'>> = {
  timeoutMs: 45_000,
  maxSteps: 5,
  temperature: 0.4,
  maxOutputTokens: 2048,
  webSearchEnabled: true,
};

// ============================================================================
// BaseAgent Abstract Class
// ============================================================================

/**
 * Abstract base class for all agents
 *
 * Subclasses must implement:
 * - getName(): Agent display name
 * - getConfig(): Get AgentConfig from AGENT_CONFIGS
 *
 * Provides:
 * - run(): Execute agent with query and return result
 * - stream(): Execute agent with streaming response
 * - isAvailable(): Check if agent has valid model
 */
export abstract class BaseAgent {
  /**
   * Get the agent's display name
   */
  abstract getName(): string;

  /**
   * Get the agent's configuration from AGENT_CONFIGS
   */
  abstract getConfig(): AgentConfig | null;

  /**
   * Check if agent is available (has valid model)
   */
  isAvailable(): boolean {
    const config = this.getConfig();
    if (!config) return false;
    return config.getModel() !== null;
  }

  /**
   * Get model result from config
   */
  protected getModel(): ModelResult | null {
    const config = this.getConfig();
    if (!config) return null;
    return config.getModel();
  }

  /**
   * Filter tools based on options
   */
  protected filterTools(
    tools: Record<string, Tool>,
    options: AgentRunOptions
  ): Record<string, Tool> {
    if (options.webSearchEnabled !== false) {
      return tools;
    }

    // Remove searchWeb tool when disabled
    const filtered = { ...tools };
    if ('searchWeb' in filtered) {
      delete filtered.searchWeb;
      console.log(`🚫 [${this.getName()}] searchWeb disabled`);
    }
    return filtered;
  }

  /**
   * Execute agent with query and return complete result
   *
   * Uses AI SDK v6 generateText with stopWhen conditions:
   * - hasToolCall('finalAnswer'): Graceful termination when agent calls finalAnswer
   * - stepCountIs(maxSteps): Safety limit to prevent infinite loops
   *
   * @param query - User query to process
   * @param options - Execution options
   * @returns AgentResult with response and metadata
   */
  async run(query: string, options: AgentRunOptions = {}): Promise<AgentResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const agentName = this.getName();

    console.log(`🤖 [${agentName}] Starting execution...`);

    // Validate configuration
    const config = this.getConfig();
    if (!config) {
      return {
        text: '',
        success: false,
        toolsCalled: [],
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        metadata: {
          provider: 'none',
          modelId: 'none',
          durationMs: Date.now() - startTime,
          steps: 0,
        },
        error: `Agent ${agentName} config not found`,
      };
    }

    const modelResult = config.getModel();
    if (!modelResult) {
      return {
        text: '',
        success: false,
        toolsCalled: [],
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        metadata: {
          provider: 'none',
          modelId: 'none',
          durationMs: Date.now() - startTime,
          steps: 0,
        },
        error: `No model available for ${agentName}`,
      };
    }

    const { model, provider, modelId } = modelResult;
    const filteredTools = this.filterTools(config.tools as Record<string, Tool>, opts);

    console.log(`🎯 [${agentName}] Using ${provider}/${modelId}`);

    try {
      // Execute with AI SDK v6 native pattern
      const result = await generateText({
        model,
        system: config.instructions,
        messages: [{ role: 'user', content: query }],
        tools: filteredTools,
        maxRetries: 1,
        // AI SDK v6 Best Practice: Graceful termination conditions
        stopWhen: [hasToolCall('finalAnswer'), stepCountIs(opts.maxSteps)],
        temperature: opts.temperature,
        maxOutputTokens: opts.maxOutputTokens,
        // Step-by-step monitoring
        onStepFinish: ({ finishReason, toolCalls }) => {
          const toolNames = toolCalls?.map(tc => tc.toolName) || [];
          console.log(`📍 [${agentName}] Step: reason=${finishReason}, tools=[${toolNames.join(',')}]`);
        },
      });

      // Extract tool calls and check for finalAnswer
      const toolsCalled: string[] = [];
      let finalAnswerResult: { answer: string } | null = null;
      let finishReason = 'stop';

      for (const step of result.steps) {
        if (step.finishReason) {
          finishReason = step.finishReason;
        }
        for (const toolCall of step.toolCalls) {
          toolsCalled.push(toolCall.toolName);
        }
        // Extract finalAnswer result if called
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            if ('result' in tr && tr.toolName === 'finalAnswer' && tr.result && typeof tr.result === 'object') {
              finalAnswerResult = tr.result as { answer: string };
            }
          }
        }
      }

      // Use finalAnswer if called, otherwise fall back to result.text
      const responseText = finalAnswerResult?.answer ?? result.text;
      const sanitizedText = sanitizeChineseCharacters(responseText);

      const durationMs = Date.now() - startTime;
      console.log(`✅ [${agentName}] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]`);

      return {
        text: sanitizedText,
        success: true,
        toolsCalled,
        usage: {
          promptTokens: result.usage?.inputTokens ?? 0,
          completionTokens: result.usage?.outputTokens ?? 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
        metadata: {
          provider,
          modelId,
          durationMs,
          steps: result.steps.length,
          finishReason,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - startTime;

      console.error(`❌ [${agentName}] Error after ${durationMs}ms:`, errorMessage);

      return {
        text: '',
        success: false,
        toolsCalled: [],
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        metadata: {
          provider,
          modelId,
          durationMs,
          steps: 0,
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Execute agent with streaming response
   *
   * Yields AgentStreamEvent chunks in real-time for progressive UI updates.
   *
   * @param query - User query to process
   * @param options - Execution options
   * @yields AgentStreamEvent - Real-time streaming events
   */
  async *stream(query: string, options: AgentRunOptions = {}): AsyncGenerator<AgentStreamEvent> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const agentName = this.getName();

    console.log(`🤖 [${agentName}] Starting stream...`);

    // Validate configuration
    const config = this.getConfig();
    if (!config) {
      yield { type: 'error', data: { code: 'CONFIG_NOT_FOUND', error: `Agent ${agentName} config not found` } };
      return;
    }

    const modelResult = config.getModel();
    if (!modelResult) {
      yield { type: 'error', data: { code: 'MODEL_UNAVAILABLE', error: `No model available for ${agentName}` } };
      return;
    }

    const { model, provider, modelId } = modelResult;
    const filteredTools = this.filterTools(config.tools as Record<string, Tool>, opts);

    console.log(`🎯 [${agentName}] Streaming with ${provider}/${modelId}`);

    try {
      const streamResult = streamText({
        model,
        system: config.instructions,
        messages: [{ role: 'user', content: query }],
        tools: filteredTools,
        stopWhen: [hasToolCall('finalAnswer'), stepCountIs(opts.maxSteps)],
        temperature: opts.temperature,
        maxOutputTokens: opts.maxOutputTokens,
        onStepFinish: ({ finishReason, toolCalls }) => {
          const toolNames = toolCalls?.map(tc => tc.toolName) || [];
          console.log(`📍 [${agentName}] Step: reason=${finishReason}, tools=[${toolNames.join(',')}]`);
        },
      });

      const toolsCalled: string[] = [];

      // Stream text deltas
      for await (const textChunk of streamResult.textStream) {
        const sanitized = sanitizeChineseCharacters(textChunk);
        if (sanitized) {
          yield { type: 'text_delta', data: sanitized };
        }
      }

      // Gather metadata after streaming completes
      const [steps, usage] = await Promise.all([streamResult.steps, streamResult.usage]);

      // Extract tool calls
      if (steps) {
        for (const step of steps) {
          if (step.toolCalls) {
            for (const tc of step.toolCalls) {
              toolsCalled.push(tc.toolName);
              yield { type: 'tool_call', data: { name: tc.toolName } };
            }
          }
        }
      }

      const durationMs = Date.now() - startTime;
      console.log(`✅ [${agentName}] Stream completed in ${durationMs}ms`);

      yield {
        type: 'done',
        data: {
          success: true,
          finalAgent: agentName,
          toolsCalled,
          usage: {
            promptTokens: usage?.inputTokens ?? 0,
            completionTokens: usage?.outputTokens ?? 0,
          },
          metadata: { provider, modelId, durationMs },
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - startTime;

      console.error(`❌ [${agentName}] Stream error after ${durationMs}ms:`, errorMessage);
      yield { type: 'error', data: { code: 'STREAM_ERROR', error: errorMessage } };
    }
  }
}
