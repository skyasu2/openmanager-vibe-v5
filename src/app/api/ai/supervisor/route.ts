/**
 * Cloud Run AI Supervisor Proxy
 *
 * @endpoint POST /api/ai/supervisor
 *
 * Architecture (2025-12-17):
 * - Primary: Cloud Run ai-engine (LangGraph Multi-Agent)
 * - Fallback: Simple error response (no local LangGraph)
 *
 * Note: Vercel LangGraph removed to reduce bundle size (~2MB)
 * and simplify architecture. All AI processing handled by Cloud Run.
 *
 * Changes (2025-12-22 v5.83.9):
 * - Added normalizeMessagesForCloudRun(): AI SDK v5 parts[] → Cloud Run content 변환
 * - Added sessionId query parameter 지원 (TextStreamChatTransport 호환)
 * - 문제: AI SDK v5는 parts 배열 형식, Cloud Run은 content 문자열 기대
 * - 해결: 메시지 정규화 + transport 호환성 개선
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import { quickSanitize } from './security';

// ============================================================================
// 🔧 Stream Transformer: Vercel Data Stream Protocol → Plain Text
// ============================================================================
// Cloud Run이 반환하는 Data Stream Protocol을 파싱하여 순수 텍스트로 변환
//
// @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
// ============================================================================

/**
 * Vercel AI SDK Data Stream Protocol 상수
 *
 * @warning 이 프로토콜은 Vercel AI SDK 버전에 의존합니다.
 *          SDK 업그레이드 시 호환성 확인 필요
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 */
const DATA_STREAM_PREFIXES = {
  TEXT: '0', // 텍스트 콘텐츠 (주요)
  DATA: '2', // JSON 데이터 배열
  ERROR: '3', // 에러 메시지
  ANNOTATION: '8', // 메시지 주석
  FINISH: 'd', // 완료 신호
  START: 'e', // 시작 신호
} as const;

/**
 * Data Stream Protocol 라인 파싱 정규식
 *
 * @pattern ^(prefix):(content)$
 * - prefix: 숫자 또는 알파벳 한 글자
 * - content: JSON 문자열 또는 객체
 *
 * @fragility 이 정규식은 SDK 프로토콜 변경에 취약합니다.
 *            SDK 버전 업그레이드 시 반드시 테스트 필요
 */
const DATA_STREAM_LINE_REGEX = /^([0-9a-z]):(.*)$/;

/**
 * Data Stream Protocol을 Plain Text로 변환하는 TransformStream
 *
 * @description
 * Cloud Run이 반환하는 `0:"텍스트"` 형식을 파싱하여 순수 텍스트만 추출합니다.
 * TextStreamChatTransport와 함께 사용됩니다.
 *
 * @example
 * Input:  0:"Hello "\n0:"World"\nd:{"finishReason":"stop"}
 * Output: Hello World
 *
 * @warning
 * - Vercel AI SDK v5 Data Stream Protocol에 의존
 * - Cloud Run 응답 형식 변경 시 파싱 실패 가능
 * - 장기적으로 SDK의 공식 파서 사용 권장
 */
// NOTE: Reserved for future streaming implementation
function _createDataStreamParserTransform(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  /**
   * JSON 문자열 안전하게 파싱
   */
  const safeJsonParse = (str: string): unknown => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  /**
   * 텍스트 콘텐츠 추출 (prefix: 0)
   */
  const extractTextContent = (content: string): string | null => {
    const parsed = safeJsonParse(content);
    if (typeof parsed === 'string') {
      return parsed;
    }
    // JSON 파싱 실패 시 raw content 반환 (fallback)
    if (content.startsWith('"') && content.endsWith('"')) {
      return content.slice(1, -1);
    }
    return null;
  };

  /**
   * 에러 메시지 추출 (prefix: 3)
   */
  const extractErrorMessage = (content: string): string => {
    const parsed = safeJsonParse(content);

    if (typeof parsed === 'string') {
      // 중첩된 JSON 에러 처리
      const innerParsed = safeJsonParse(parsed);
      if (
        innerParsed &&
        typeof innerParsed === 'object' &&
        'error' in innerParsed
      ) {
        const errorObj = innerParsed as { error?: { message?: string } };
        return errorObj.error?.message || parsed;
      }
      return parsed;
    }

    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      return (parsed as { message: string }).message;
    }

    return content;
  };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(DATA_STREAM_LINE_REGEX);
        if (!match?.[1] || match[2] === undefined) continue;

        const prefix = match[1];
        const content = match[2];

        switch (prefix) {
          case DATA_STREAM_PREFIXES.TEXT: {
            const text = extractTextContent(content);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
            break;
          }

          case DATA_STREAM_PREFIXES.ERROR: {
            const errorMsg = extractErrorMessage(content);
            controller.enqueue(encoder.encode(`\n\n⚠️ AI 오류: ${errorMsg}`));
            break;
          }

          // DATA, ANNOTATION, FINISH, START: 메타데이터는 무시
          // 필요 시 여기에 추가 처리 로직 구현 가능
        }
      }
    },

    flush(controller) {
      // 버퍼에 남은 불완전한 라인 처리
      if (buffer.trim()) {
        const match = buffer.trim().match(DATA_STREAM_LINE_REGEX);
        if (match?.[1] === DATA_STREAM_PREFIXES.TEXT && match[2]) {
          const text = extractTextContent(match[2]);
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      }
    },
  });
}

// Allow streaming responses up to 120 seconds (Vercel Pro: max 300s)
// Note: Increased from 60s to handle complex NLQ queries with tool calls
// Supervisor → Agent → Tool → Verifier pipeline can take 60-90s
export const maxDuration = 120;

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

/**
 * AI SDK v5 메시지를 Cloud Run 호환 형식으로 정규화
 * parts 배열 → content 문자열로 변환
 *
 * @description (2025-12-22 v5.83.9 추가)
 * AI SDK v5 UIMessage 형식:
 *   { role: 'user', parts: [{ type: 'text', text: '...' }] }
 *
 * Cloud Run 기대 형식:
 *   { role: 'user', content: '...' }
 *
 * 이 함수가 없으면 Cloud Run이 빈 메시지로 처리하여 503 에러 발생
 *
 * @note (2025-12-23 개선)
 * - 빈 content 필터링 제거 → 대화 맥락 보존
 * - 이미지/Tool Call 메시지도 플레이스홀더로 보존
 * - Cloud Run은 빈 문자열도 처리 가능
 */
function normalizeMessagesForCloudRun(
  messages: z.infer<typeof messageSchema>[]
): { role: string; content: string }[] {
  return messages.map((msg) => {
    const content = extractTextFromMessage(msg);

    // 빈 content인 경우 플레이스홀더 사용 (맥락 보존)
    // 이미지, Tool Call 등 비텍스트 메시지의 위치를 유지
    if (!content || content.length === 0) {
      return {
        role: msg.role,
        content: '[Non-text content]',
      };
    }

    return {
      role: msg.role,
      content,
    };
  });
}

// ============================================================================
// 🧠 Main Handler - LangGraph Multi-Agent System
// ============================================================================

export const POST = withRateLimit(
  rateLimiters.aiAnalysis,
  withAuth(async (req: NextRequest) => {
    try {
      // 1. Zod 스키마 검증
      const body = await req.json();
      const parseResult = requestSchema.safeParse(body);

      if (!parseResult.success) {
        console.warn(
          '⚠️ [Supervisor] Invalid payload:',
          parseResult.error.issues
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request payload',
            details: parseResult.error.issues.map((i) => i.message).join(', '),
          },
          { status: 400 }
        );
      }

      const { messages, sessionId: bodySessionId } = parseResult.data;

      // ====================================================================
      // sessionId 추출 (2025-12-22 v5.83.9 수정)
      // ====================================================================
      // TextStreamChatTransport는 body 전송을 지원하지 않아 query param 사용
      // - 클라이언트: /api/ai/supervisor?sessionId=xxx
      // - body.sessionId는 레거시 호환성을 위해 유지
      // ====================================================================
      const url = new URL(req.url);
      const querySessionId = url.searchParams.get('sessionId');
      const clientSessionId = querySessionId || bodySessionId;

      // 2. 마지막 메시지에서 사용자 쿼리 추출 + 입력 정제
      const lastMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;
      const rawQuery = lastMessage
        ? extractTextFromMessage(lastMessage)
        : 'System status check';

      // 빈 쿼리 방어
      if (!rawQuery || rawQuery.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Empty query',
            message: '쿼리를 입력해주세요.',
          },
          { status: 400 }
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

      // 4. Cloud Run 프록시 모드 (Primary - CLOUD_RUN_ENABLED=true)
      if (isCloudRunEnabled()) {
        console.log('☁️ [Supervisor] Using Cloud Run backend');

        // AI SDK v5 parts 형식 → Cloud Run content 형식으로 정규화
        const normalizedMessages = normalizeMessagesForCloudRun(messages);
        console.log(
          `📝 [Supervisor] Normalized ${messages.length} messages → ${normalizedMessages.length} for Cloud Run`
        );

        if (wantsStream) {
          // ================================================================
          // 🔧 Cloud Run JSON 응답 처리 (2025-12-29 수정)
          // ================================================================
          // Cloud Run은 현재 JSON 응답을 반환함 (스트리밍 미구현)
          // JSON 응답에서 텍스트를 추출하여 plain text로 반환
          // ================================================================
          const proxyResult = await proxyToCloudRun({
            path: '/api/ai/supervisor',
            body: { messages: normalizedMessages, sessionId },
            timeout: 90000, // 90초 타임아웃 (복잡한 쿼리 대응)
          });

          if (proxyResult.success && proxyResult.data) {
            const data = proxyResult.data as {
              success?: boolean;
              response?: string;
              error?: string;
            };

            if (data.success && data.response) {
              // 성공: response 텍스트를 plain text로 반환
              return new NextResponse(data.response, {
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'Cache-Control': 'no-cache',
                  'X-Session-Id': sessionId,
                  'X-Backend': 'cloud-run',
                  'X-Stream-Protocol': 'plain-text',
                },
              });
            } else if (data.error) {
              // 에러: 에러 메시지 반환
              return new NextResponse(`⚠️ AI 오류: ${data.error}`, {
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'X-Session-Id': sessionId,
                  'X-Backend': 'cloud-run',
                },
              });
            }
          }
          // Cloud Run 실패 시 에러 응답
          console.error('❌ Cloud Run request failed:', proxyResult.error);
        } else {
          // Cloud Run 단일 응답 프록시
          const proxyResult = await proxyToCloudRun({
            path: '/api/ai/supervisor',
            body: { messages: normalizedMessages, sessionId },
          });

          if (proxyResult.success && proxyResult.data) {
            return NextResponse.json({
              ...(proxyResult.data as object),
              _backend: 'cloud-run',
            });
          }
          // Cloud Run 실패 시 에러 응답
          console.error('❌ Cloud Run request failed:', proxyResult.error);
        }
      }

      // 5. Fallback: Cloud Run 비활성화 또는 실패 시 에러 응답
      // Note: Vercel LangGraph 제거됨 (2025-12-17) - 번들 최적화
      console.warn('⚠️ [Supervisor] Cloud Run unavailable, returning error');

      return NextResponse.json(
        {
          success: false,
          error: 'AI service temporarily unavailable',
          message:
            'AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.',
          sessionId,
          _backend: 'fallback-error',
        },
        {
          status: 503,
          headers: {
            'X-Session-Id': sessionId,
            'Retry-After': '30',
          },
        }
      );
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

      return NextResponse.json(
        {
          success: false,
          error: 'AI processing failed',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
        { status: 500 }
      );
    }
  })
);

// ============================================================================
// 📊 Architecture Note (2025-12-17)
// ============================================================================
//
// All LangGraph agents now run exclusively on Cloud Run ai-engine:
// - Supervisor (Groq Llama-8b): Intent classification & routing
// - NLQ Agent (Gemini Flash): Server metrics queries
// - Analyst Agent (Gemini Pro): Pattern analysis & anomaly detection
// - Reporter Agent (Llama 70b): Incident reports & RAG
//
// Vercel LangGraph code removed to reduce bundle size (~2MB) and
// simplify architecture. This proxy forwards all requests to Cloud Run.
//
// ============================================================================
