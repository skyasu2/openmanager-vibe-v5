/**
 * Supervisor Routes
 *
 * AI SDK Supervisor endpoints for chat interactions.
 *
 * @version 2.0.0
 * @created 2025-12-28
 * @updated 2026-01-09 - Added real SSE streaming endpoint
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import {
  executeSupervisor,
  executeSupervisorStream,
  checkSupervisorHealth,
  logProviderStatus,
  createSupervisorStreamResponse,
} from '../services/ai-sdk';
import { handleApiError, handleValidationError, jsonSuccess } from '../lib/error-handler';
import { sanitizeChineseCharacters } from '../lib/text-sanitizer';
import { logger } from '../lib/logger';

// ============================================================================
// 📋 Stream Request Schema
// ============================================================================

const streamMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content required'),
});

const streamRequestSchema = z.object({
  messages: z.array(streamMessageSchema).min(1, 'At least one message required'),
  sessionId: z.string().optional(),
});

export const supervisorRouter = new Hono();

/**
 * POST /supervisor - Main AI Supervisor Endpoint
 *
 * Dual-mode execution:
 * - Single-agent: Simple queries with multi-step tool calling
 * - Multi-agent: Complex queries with orchestrated handoffs
 */
supervisorRouter.post('/', async (c: Context) => {
  try {
    const { messages, sessionId } = await c.req.json();

    // Validate input
    const lastMessage = messages?.[messages.length - 1];
    const query = lastMessage?.content;

    if (!query) {
      return handleValidationError(c, 'No query provided');
    }

    logger.info({ sessionId }, 'Supervisor processing request');
    logProviderStatus();

    const result = await executeSupervisor({
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      sessionId: sessionId || 'default',
    });

    if (!result.success) {
      return c.json({
        success: false,
        error: 'error' in result ? result.error : 'Unknown error',
        code: 'code' in result ? result.code : 'UNKNOWN',
        timestamp: new Date().toISOString(),
      }, 500);
    }

    // Sanitize Chinese characters from LLM output
    const sanitizedResponse = sanitizeChineseCharacters(result.response);

    return jsonSuccess(c, {
      response: sanitizedResponse,
      toolsCalled: result.toolsCalled,
      usage: result.usage,
      metadata: result.metadata,
    });
  } catch (error) {
    return handleApiError(c, error, 'Supervisor');
  }
});

/**
 * POST /supervisor/stream - Real-time SSE Streaming Endpoint
 *
 * Uses Server-Sent Events (SSE) for real-time token streaming.
 * Compatible with Vercel AI SDK's DataStreamChatTransport.
 *
 * Event types:
 * - text_delta: Incremental text content
 * - tool_call: Tool invocation notification
 * - tool_result: Tool execution result
 * - done: Final response with metadata
 * - error: Error occurred
 */
supervisorRouter.post('/stream', async (c: Context) => {
  try {
    // 1. Parse and validate request with Zod schema
    const body = await c.req.json();
    const parseResult = streamRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errorDetails = parseResult.error.issues
        .map((i) => i.message)
        .join(', ');
      logger.warn({ errorDetails }, 'SupervisorStream invalid payload');
      return handleValidationError(c, `Invalid request: ${errorDetails}`);
    }

    const { messages, sessionId } = parseResult.data;

    // 2. Get last user query for logging
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    logger.info({ sessionId: sessionId || 'default', query: query.slice(0, 50) }, 'SupervisorStream starting');
    logProviderStatus();

    // 3. Stream response using SSE
    return streamSSE(c, async (stream) => {
      let messageId = 0;

      try {
        const request = {
          messages: messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          sessionId: sessionId || 'default',
        };

        for await (const event of executeSupervisorStream(request)) {
          const eventData = JSON.stringify({
            type: event.type,
            data: event.type === 'text_delta'
              ? sanitizeChineseCharacters(event.data as string)
              : event.data,
          });

          await stream.writeSSE({
            id: String(messageId++),
            event: event.type,
            data: eventData,
          });

          // Small delay to prevent overwhelming the client
          if (event.type === 'text_delta') {
            await stream.sleep(5);
          }
        }

        logger.info({ eventCount: messageId }, 'SupervisorStream completed');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error: errorMessage }, 'SupervisorStream error');

        await stream.writeSSE({
          id: String(messageId++),
          event: 'error',
          data: JSON.stringify({ type: 'error', data: { message: errorMessage } }),
        });
      }
    });
  } catch (error) {
    return handleApiError(c, error, 'SupervisorStream');
  }
});

/**
 * POST /supervisor/stream/v2 - AI SDK Native UIMessageStream Endpoint
 *
 * Uses AI SDK v6 createUIMessageStream for native streaming that works
 * directly with useChat on the frontend without custom transport.
 *
 * Benefits over /stream:
 * - Native AI SDK protocol (no TextStreamChatTransport needed)
 * - Structured data events (handoffs, tool calls, metadata)
 * - Better frontend integration with useChat hooks
 *
 * Event types:
 * - text: Incremental text content (native AI SDK)
 * - data: Structured events (handoff, tool_call, done, error)
 */
supervisorRouter.post('/stream/v2', async (c: Context) => {
  try {
    // 1. Parse and validate request with Zod schema
    const body = await c.req.json();
    const parseResult = streamRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errorDetails = parseResult.error.issues
        .map((i) => i.message)
        .join(', ');
      logger.warn({ errorDetails }, 'SupervisorStreamV2 invalid payload');
      return handleValidationError(c, `Invalid request: ${errorDetails}`);
    }

    const { messages, sessionId } = parseResult.data;

    // 2. Get last user query for logging
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    logger.info(
      { sessionId: sessionId || 'default', query: query.slice(0, 50) },
      'SupervisorStreamV2 starting (UIMessageStream)'
    );
    logProviderStatus();

    // 3. Create and return UIMessageStream response
    const response = createSupervisorStreamResponse({
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      sessionId: sessionId || 'default',
    });

    logger.info('SupervisorStreamV2 response created');

    return response;
  } catch (error) {
    return handleApiError(c, error, 'SupervisorStreamV2');
  }
});

/**
 * GET /supervisor/health - Health Check for AI SDK Supervisor
 */
supervisorRouter.get('/health', async (c: Context) => {
  try {
    const health = await checkSupervisorHealth();
    return jsonSuccess(c, health);
  } catch (error) {
    return handleApiError(c, error, 'Supervisor Health');
  }
});
