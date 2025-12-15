/**
 * LangGraph Multi-Agent Supervisor API
 *
 * @endpoint POST /api/ai/supervisor
 *
 * Architecture:
 * - createSupervisor (@langchain/langgraph-supervisor): Automatic agent routing
 * - createReactAgent (@langchain/langgraph/prebuilt): Tool-equipped workers
 *
 * Agents:
 * - Supervisor (Groq Llama-8b): Intent classification & routing
 * - NLQ Agent (Gemini Flash): Server metrics queries
 * - Analyst Agent (Gemini Pro): Pattern analysis & anomaly detection
 * - Reporter Agent (Llama 70b): Incident reports & RAG
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/api-auth';
import {
  isCloudRunEnabled,
  proxyStreamToCloudRun,
  proxyToCloudRun,
} from '@/lib/cloud-run/proxy';
import {
  createSupervisorStreamResponse,
  executeSupervisor,
} from '@/services/langgraph/multi-agent-supervisor';
import { quickFilter, quickSanitize } from './security';

// Allow streaming responses up to 60 seconds (Vercel Hobby/Pro max duration)
export const maxDuration = 60;

// ============================================================================
// 📋 Request Schema (Zod Validation)
// ============================================================================

// AI SDK v5 UIMessage 'parts' 포맷
const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const partSchema = z.discriminatedUnion('type', [
  textPartSchema,
  // 다른 part 타입들 (tool-invocation, tool-result 등)은 무시
  z
    .object({ type: z.literal('tool-invocation') })
    .passthrough(),
  z.object({ type: z.literal('tool-result') }).passthrough(),
  z.object({ type: z.literal('file') }).passthrough(),
  z.object({ type: z.literal('reasoning') }).passthrough(),
]);

// 하이브리드 메시지 스키마: AI SDK v5 (parts) + 레거시 (content) 모두 지원
const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  // AI SDK v5: parts 배열 (UIMessage 포맷)
  parts: z.array(partSchema).optional(),
  // 레거시: content 문자열
  content: z.string().optional(),
  // 추가 메타데이터 허용
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  sessionId: z.string().optional(),
});

// ============================================================================
// 🔧 Utility: UIMessage에서 텍스트 추출
// ============================================================================

/**
 * AI SDK v5 UIMessage 또는 레거시 메시지에서 텍스트 콘텐츠 추출
 */
function extractTextFromMessage(
  message: z.infer<typeof messageSchema>
): string {
  // 1. AI SDK v5 parts 배열에서 텍스트 추출
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter(
        (part): part is z.infer<typeof textPartSchema> => part.type === 'text'
      )
      .map((part) => part.text);
    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }

  // 2. 레거시 content 필드 사용
  if (typeof message.content === 'string') {
    return message.content;
  }

  return '';
}

// ============================================================================
// 🧠 Main Handler - LangGraph Multi-Agent System
// ============================================================================

export const POST = withAuth(async (req: NextRequest) => {
  try {
    // 1. Zod 스키마 검증
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      console.warn(
        '⚠️ [Unified-Stream] Invalid payload:',
        parseResult.error.issues
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request payload',
          details: parseResult.error.issues.map((i) => i.message).join(', '),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages, sessionId: clientSessionId } = parseResult.data;

    // 2. 마지막 메시지에서 사용자 쿼리 추출 + 입력 정제
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : null;
    const rawQuery = lastMessage
      ? extractTextFromMessage(lastMessage)
      : 'System status check';

    // 빈 쿼리 방어
    if (!rawQuery || rawQuery.trim() === '') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Empty query',
          message: '쿼리를 입력해주세요.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userQuery = quickSanitize(rawQuery);

    // 2. 세션 ID 생성/사용
    const sessionId = clientSessionId || `session_${Date.now()}`;

    console.log(`🚀 [Supervisor] Query: "${userQuery.slice(0, 50)}..."`);
    console.log(`📡 [Supervisor] Session: ${sessionId}`);

    // 3. 스트리밍 요청 여부 확인
    // AI SDK v5 DefaultChatTransport는 */* 또는 다양한 Accept 헤더를 보냄
    // supervisor 엔드포인트는 기본적으로 스트리밍 활성화
    // 명시적으로 application/json만 요청하는 경우에만 JSON 응답
    const acceptHeader = req.headers.get('accept') || '';
    const wantsJsonOnly = acceptHeader === 'application/json';
    const wantsStream = !wantsJsonOnly;

    // 4. Cloud Run 프록시 모드 (CLOUD_RUN_ENABLED=true)
    if (isCloudRunEnabled()) {
      console.log('☁️ [Supervisor] Using Cloud Run backend');

      if (wantsStream) {
        // Cloud Run 스트리밍 프록시
        const cloudStream = await proxyStreamToCloudRun({
          path: '/api/ai/supervisor',
          body: { messages, sessionId },
        });

        if (cloudStream) {
          return new Response(cloudStream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Session-Id': sessionId,
              'X-Backend': 'cloud-run',
            },
          });
        }
        // Cloud Run 실패 시 로컬로 폴백
        console.warn('⚠️ Cloud Run stream failed, falling back to local');
      } else {
        // Cloud Run 단일 응답 프록시
        const proxyResult = await proxyToCloudRun({
          path: '/api/ai/supervisor',
          body: { messages, sessionId },
        });

        if (proxyResult.success && proxyResult.data) {
          return Response.json({
            ...proxyResult.data,
            _backend: 'cloud-run',
          });
        }
        // Cloud Run 실패 시 로컬로 폴백
        console.warn('⚠️ Cloud Run request failed, falling back to local');
      }
    }

    // 5. 로컬 모드 (Next.js 내장 LangGraph Multi-Agent Supervisor)
    if (wantsStream) {
      // 스트리밍 응답 (LangGraph createSupervisor + streamEvents 사용)
      try {
        const stream = await createSupervisorStreamResponse(
          userQuery,
          sessionId
        );

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Vercel-AI-Data-Stream': 'v1',
            'X-Session-Id': sessionId,
            'X-Backend': 'vercel-supervisor',
          },
        });
      } catch (streamError) {
        console.error('❌ Streaming Error:', streamError);
        // 스트리밍 실패 시 단일 응답으로 폴백
        const result = await executeSupervisor(userQuery, { sessionId });
        return new Response(result.response, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Session-Id': sessionId,
            'X-Backend': 'vercel-supervisor',
          },
        });
      }
    } else {
      // 단일 응답 (invoke 사용)
      const result = await executeSupervisor(userQuery, { sessionId });

      return Response.json({
        success: true,
        response: quickFilter(result.response),
        sessionId: result.sessionId,
        _backend: 'vercel-supervisor',
      });
    }
  } catch (error) {
    console.error('❌ AI 스트리밍 처리 실패:', error);

    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 500),
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'AI processing failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// 📊 Legacy Tools Reference (Now integrated in LangGraph Agents)
// ============================================================================
//
// The following tools have been migrated to LangGraph agents:
//
// 1. getServerMetrics -> NLQ Agent (nlq-agent.ts)
//    - Queries server CPU/memory/disk status from scenario data
//
// 2. searchKnowledgeBase -> Reporter Agent (reporter-agent.ts)
//    - RAG search using Supabase pgvector (384 dimensions)
//
// 3. analyzePattern -> Analyst Agent (analyst-agent.ts)
//    - Pattern matching for system performance queries
//
// 4. recommendCommands -> Reporter Agent (reporter-agent.ts)
//    - CLI command recommendations based on keywords
//
// ============================================================================
