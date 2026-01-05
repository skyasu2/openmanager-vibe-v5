/**
 * Supervisor Routes
 *
 * AI SDK Supervisor endpoints for chat interactions.
 *
 * @version 1.0.0
 * @created 2025-12-28
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { executeSupervisor, checkSupervisorHealth, logProviderStatus } from '../services/ai-sdk';
import { handleApiError, handleValidationError, jsonSuccess } from '../lib/error-handler';
import { sanitizeChineseCharacters } from '../lib/text-sanitizer';

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

    console.log(`🤖 [Supervisor] Using AI SDK (session: ${sessionId})`);
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
