/**
 * Unified AI Stream API Route
 * LangGraph Multi-Agent System을 사용한 스트리밍 응답
 *
 * Architecture:
 * - Supervisor (Groq Llama-8b): 빠른 인텐트 분류 및 라우팅
 * - NLQ Agent (Gemini Flash): 서버 메트릭 조회
 * - Analyst Agent (Gemini Pro): 패턴 분석 및 이상 탐지
 * - Reporter Agent (Llama 70b): 인시던트 리포트 및 RAG
 */

import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import {
  createStreamingResponse,
  executeGraph,
} from '@/services/langgraph/graph-builder';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// ============================================================================
// 🧠 Main Handler - LangGraph Multi-Agent System
// ============================================================================

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { messages, sessionId: clientSessionId } = await req.json();

    // 1. 마지막 메시지에서 사용자 쿼리 추출
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : null;
    const userQuery =
      lastMessage && typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'System status check';

    // 2. 세션 ID 생성/사용
    const sessionId = clientSessionId || `session_${Date.now()}`;

    console.log(`🚀 [Unified-Stream] Query: "${userQuery.slice(0, 50)}..."`);
    console.log(`📡 [Unified-Stream] Session: ${sessionId}`);

    // 3. 스트리밍 요청 여부 확인
    const acceptHeader = req.headers.get('accept') || '';
    const wantsStream =
      acceptHeader.includes('text/event-stream') ||
      acceptHeader.includes('text/plain');

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
          },
        });
      }
    } else {
      // 단일 응답 (invoke 사용)
      const result = await executeGraph(userQuery, { sessionId });

      return Response.json({
        success: true,
        response: result.response,
        toolResults: result.toolResults,
        targetAgent: result.targetAgent,
        sessionId: result.sessionId,
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
