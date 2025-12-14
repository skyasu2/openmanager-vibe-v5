/**
 * Unified AI Stream API Route
 * LangGraph Multi-Agent System을 사용한 스트리밍 응답
 *
 * Architecture (Hybrid Mode):
 * - Cloud Run AI Backend (CLOUD_RUN_ENABLED=true): 외부 Cloud Run으로 프록시
 * - Local Mode (default): Next.js 내장 LangGraph 사용
 *
 * Agents:
 * - Supervisor (Groq Llama-8b): 빠른 인텐트 분류 및 라우팅
 * - NLQ Agent (Gemini Flash): 서버 메트릭 조회
 * - Analyst Agent (Gemini Pro): 패턴 분석 및 이상 탐지
 * - Reporter Agent (Llama 70b): 인시던트 리포트 및 RAG
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
  createStreamingResponse,
  executeGraph,
} from '@/services/langgraph/graph-builder';
import { quickFilter, quickSanitize } from './security';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// ============================================================================
// 📋 Request Schema (Zod Validation)
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
    const rawQuery =
      lastMessage && typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'System status check';
    const userQuery = quickSanitize(rawQuery);

    // 2. 세션 ID 생성/사용
    const sessionId = clientSessionId || `session_${Date.now()}`;

    console.log(`🚀 [Unified-Stream] Query: "${userQuery.slice(0, 50)}..."`);
    console.log(`📡 [Unified-Stream] Session: ${sessionId}`);

    // 3. 스트리밍 요청 여부 확인
    const acceptHeader = req.headers.get('accept') || '';
    const wantsStream =
      acceptHeader.includes('text/event-stream') ||
      acceptHeader.includes('text/plain');

    // 4. Cloud Run 프록시 모드 (CLOUD_RUN_ENABLED=true)
    if (isCloudRunEnabled()) {
      console.log('☁️ [Unified-Stream] Using Cloud Run backend');

      if (wantsStream) {
        // Cloud Run 스트리밍 프록시
        const cloudStream = await proxyStreamToCloudRun({
          path: '/api/ai/unified-stream',
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
          path: '/api/ai/unified-stream',
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

    // 5. 로컬 모드 (Next.js 내장 LangGraph)
    if (wantsStream) {
      // 스트리밍 응답 (LangGraph streamEvents 사용)
      try {
        const stream = await createStreamingResponse(userQuery, sessionId);

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Session-Id': sessionId,
            'X-Backend': 'local',
          },
        });
      } catch (streamError) {
        console.error('❌ Streaming Error:', streamError);
        // 스트리밍 실패 시 단일 응답으로 폴백
        const result = await executeGraph(userQuery, { sessionId });
        return new Response(result.response, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Session-Id': sessionId,
            'X-Target-Agent': result.targetAgent || 'unknown',
            'X-Backend': 'local',
          },
        });
      }
    } else {
      // 단일 응답 (invoke 사용)
      const result = await executeGraph(userQuery, { sessionId });

      return Response.json({
        success: true,
        response: quickFilter(result.response),
        toolResults: result.toolResults,
        targetAgent: result.targetAgent,
        sessionId: result.sessionId,
        _backend: 'local',
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
