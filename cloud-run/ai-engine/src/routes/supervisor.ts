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
import { guardInput, filterMaliciousOutput } from '../lib/prompt-guard';
import { logger } from '../lib/logger';

// ============================================================================
// 📋 Stream Request Schema
// ============================================================================

/**
 * Image attachment schema for multimodal messages
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#image-parts
 */
const imageAttachmentSchema = z.object({
  /** Image data: Base64, Data URL, or HTTP(S) URL */
  data: z.string(),
  /** MIME type (e.g., 'image/png', 'image/jpeg') */
  mimeType: z.string(),
  /** Optional filename */
  name: z.string().optional(),
});

/**
 * File attachment schema for multimodal messages
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#file-parts
 */
const fileAttachmentSchema = z.object({
  /** File data: Base64 or HTTP(S) URL */
  data: z.string(),
  /** MIME type (e.g., 'application/pdf', 'text/plain') */
  mimeType: z.string(),
  /** Optional filename */
  name: z.string().optional(),
});

const streamMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content required'),
  /** Image attachments for Vision Agent */
  images: z.array(imageAttachmentSchema).optional(),
  /** File attachments (PDF, audio, etc.) */
  files: z.array(fileAttachmentSchema).optional(),
});

const streamRequestSchema = z.object({
  messages: z.array(streamMessageSchema).min(1, 'At least one message required'),
  sessionId: z.string().optional(),
  enableWebSearch: z.union([z.boolean(), z.literal('auto')]).optional(),
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
    const { messages, sessionId, enableWebSearch } = await c.req.json();

    // Validate input
    const lastMessage = messages?.[messages.length - 1];
    const query = lastMessage?.content;

    if (!query) {
      return handleValidationError(c, 'No query provided');
    }

    // 🛡️ Prompt Injection 방어
    const guard = guardInput(query);
    if (guard.shouldBlock) {
      logger.warn({ patterns: guard.patterns }, 'Supervisor: blocked injection attempt');
      return c.json({ success: false, error: 'Security: blocked input', code: 'PROMPT_INJECTION' }, 400);
    }

    logger.info({ sessionId }, 'Supervisor processing request');
    logProviderStatus();

    // Extract images/files from the last user message for multimodal support
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
    const images = lastUserMessage?.images;
    const files = lastUserMessage?.files;

    if (images?.length) {
      logger.info({ count: images.length }, 'Supervisor: images attached');
    }
    if (files?.length) {
      logger.info({ count: files.length }, 'Supervisor: files attached');
    }

    const result = await executeSupervisor({
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      sessionId: sessionId || 'default',
      enableWebSearch,
      images,
      files,
    });

    if (!result.success) {
      return c.json({
        success: false,
        error: 'error' in result ? result.error : 'Unknown error',
        code: 'code' in result ? result.code : 'UNKNOWN',
        timestamp: new Date().toISOString(),
      }, 500);
    }

    // Sanitize Chinese characters + malicious output filter
    const sanitizedResponse = filterMaliciousOutput(sanitizeChineseCharacters(result.response));

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

    const { messages, sessionId, enableWebSearch } = parseResult.data;

    // 2. Get last user query for logging
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // 🛡️ Prompt Injection 방어
    const guard = guardInput(query);
    if (guard.shouldBlock) {
      logger.warn({ patterns: guard.patterns }, 'SupervisorStream: blocked injection attempt');
      return handleValidationError(c, 'Security: blocked input');
    }

    logger.info({ sessionId: sessionId || 'default', query: query.slice(0, 50) }, 'SupervisorStream starting');
    logProviderStatus();

    // 3. Extract images/files from the last user message for multimodal support
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    const images = lastUserMessage?.images;
    const files = lastUserMessage?.files;

    if (images?.length) {
      logger.info({ count: images.length }, 'SupervisorStream: images attached');
    }
    if (files?.length) {
      logger.info({ count: files.length }, 'SupervisorStream: files attached');
    }

    // 4. Stream response using SSE
    return streamSSE(c, async (stream) => {
      let messageId = 0;

      try {
        const request = {
          messages: messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          sessionId: sessionId || 'default',
          enableWebSearch,
          images,
          files,
        };

        for await (const event of executeSupervisorStream(request)) {
          const eventData = JSON.stringify({
            type: event.type,
            data: event.type === 'text_delta'
              ? filterMaliciousOutput(sanitizeChineseCharacters(event.data as string))
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

    const { messages, sessionId, enableWebSearch } = parseResult.data;

    // 2. Get last user query for logging
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // 🛡️ Prompt Injection 방어
    const guardV2 = guardInput(query);
    if (guardV2.shouldBlock) {
      logger.warn({ patterns: guardV2.patterns }, 'SupervisorStreamV2: blocked injection attempt');
      return handleValidationError(c, 'Security: blocked input');
    }

    logger.info(
      { sessionId: sessionId || 'default', query: query.slice(0, 50) },
      'SupervisorStreamV2 starting (UIMessageStream)'
    );
    logProviderStatus();

    // 3. Extract images/files from the last user message for multimodal support
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    const images = lastUserMessage?.images;
    const files = lastUserMessage?.files;

    if (images?.length) {
      logger.info({ count: images.length }, 'SupervisorStreamV2: images attached');
    }
    if (files?.length) {
      logger.info({ count: files.length }, 'SupervisorStreamV2: files attached');
    }

    // 4. Create and return UIMessageStream response
    const response = createSupervisorStreamResponse({
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      sessionId: sessionId || 'default',
      enableWebSearch,
      images,
      files,
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
