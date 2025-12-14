/**
 * Unified AI Stream Route
 * LangGraph Multi-Agent System 스트리밍 API
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { createSessionConfig } from '../services/langgraph/checkpointer.js';
import { createMultiAgentGraph } from '../services/langgraph/graph-builder.js';

export const unifiedStreamRoute = new Hono();

// ============================================================================
// Request Schema
// ============================================================================

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  sessionId: z.string().optional(),
});

// ============================================================================
// Security Helpers
// ============================================================================

function quickSanitize(input: string): string {
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .slice(0, 5000);
}

function quickFilter(response: string): string {
  // PII 패턴 필터링
  return response
    .replace(/\b\d{6}-\d{7}\b/g, '[REDACTED]') // 주민등록번호
    .replace(/\b\d{3}-\d{4}-\d{4}\b/g, '[REDACTED]'); // 전화번호
}

// ============================================================================
// POST /api/ai/unified-stream
// ============================================================================

unifiedStreamRoute.post('/', async (c) => {
  const startTime = Date.now();

  try {
    // 1. Request Validation
    const body = await c.req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      console.warn(
        '⚠️ [Unified-Stream] Invalid payload:',
        parseResult.error.issues
      );
      return c.json(
        {
          success: false,
          error: 'Invalid request payload',
          details: parseResult.error.issues.map((i) => i.message).join(', '),
        },
        400
      );
    }

    const { messages, sessionId: clientSessionId } = parseResult.data;

    // 2. Extract user query
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : null;
    const rawQuery =
      lastMessage && typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'System status check';
    const userQuery = quickSanitize(rawQuery);

    const sessionId = clientSessionId || `session_${Date.now()}`;

    console.log(`🚀 [Unified-Stream] Query: "${userQuery.slice(0, 50)}..."`);
    console.log(`📡 [Unified-Stream] Session: ${sessionId}`);

    // 3. Check streaming preference
    const acceptHeader = c.req.header('accept') || '';
    const wantsStream =
      acceptHeader.includes('text/event-stream') ||
      acceptHeader.includes('text/plain');

    if (wantsStream) {
      // Streaming response
      const stream = await createStreamingResponse(userQuery, sessionId);

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Session-Id': sessionId,
          'X-Processing-Time': `${Date.now() - startTime}ms`,
        },
      });
    } else {
      // Single response
      const result = await executeGraph(userQuery, { sessionId });

      return c.json({
        success: true,
        response: quickFilter(result.response),
        toolResults: result.toolResults,
        targetAgent: result.targetAgent,
        sessionId: result.sessionId,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }
  } catch (error) {
    console.error('❌ AI 스트리밍 처리 실패:', error);

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 500),
      });
    }

    return c.json(
      {
        success: false,
        error: 'AI processing failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: `${Date.now() - startTime}ms`,
      },
      500
    );
  }
});

// ============================================================================
// Graph Execution Helpers (Inline for Cloud Run standalone)
// ============================================================================

interface GraphExecutionOptions {
  sessionId?: string;
}

interface GraphResult {
  response: string;
  toolResults: unknown[];
  targetAgent: string | null;
  sessionId: string;
}

async function executeGraph(
  query: string,
  options: GraphExecutionOptions = {}
): Promise<GraphResult> {
  const graph = await createMultiAgentGraph();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  const { HumanMessage } = await import('@langchain/core/messages');

  const result = await graph.invoke(
    {
      messages: [new HumanMessage(query)],
      sessionId,
    },
    config
  );

  return {
    response: result.finalResponse || '응답을 생성할 수 없습니다.',
    toolResults: result.toolResults || [],
    targetAgent: result.targetAgent,
    sessionId,
  };
}

async function* streamGraph(
  query: string,
  options: GraphExecutionOptions = {}
): AsyncGenerator<{
  type: 'token' | 'tool_result' | 'final';
  content: string;
  metadata?: Record<string, unknown>;
}> {
  const graph = await createMultiAgentGraph();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  const { HumanMessage } = await import('@langchain/core/messages');

  const stream = await graph.streamEvents(
    {
      messages: [new HumanMessage(query)],
      sessionId,
    },
    {
      version: 'v2',
      ...config,
    }
  );

  for await (const event of stream) {
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk;
      if (chunk?.content) {
        yield {
          type: 'token',
          content: typeof chunk.content === 'string' ? chunk.content : '',
          metadata: { node: event.name },
        };
      }
    }

    if (event.event === 'on_tool_end') {
      yield {
        type: 'tool_result',
        content: JSON.stringify(event.data?.output),
        metadata: { toolName: event.name },
      };
    }

    if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
      const output = event.data?.output;
      if (output?.finalResponse) {
        yield {
          type: 'final',
          content: output.finalResponse,
          metadata: {
            targetAgent: output.targetAgent,
            toolResults: output.toolResults,
          },
        };
      }
    }
  }
}

async function createStreamingResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const generator = streamGraph(query, { sessionId });

        for await (const chunk of generator) {
          if (chunk.type === 'token') {
            controller.enqueue(encoder.encode(quickFilter(chunk.content)));
          } else if (chunk.type === 'final') {
            console.log('📤 Stream completed');
          }
        }

        controller.close();
      } catch (error) {
        console.error('❌ Streaming error:', error);
        controller.error(error);
      }
    },
  });
}
