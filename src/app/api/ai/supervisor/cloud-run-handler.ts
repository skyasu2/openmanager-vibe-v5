/**
 * Cloud Run Proxy Handler
 *
 * supervisor/route.ts에서 분리된 Cloud Run 프록시 로직
 * - Stream 모드: plain text 응답
 * - JSON 모드: JSON 응답
 * - Circuit Breaker + Fallback 패턴
 *
 * @created 2026-02-01 (route.ts SRP 분리)
 */

import { NextResponse } from 'next/server';
import { type AIEndpoint, setAICache } from '@/lib/ai/cache/ai-response-cache';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import { proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { logger } from '@/lib/logging';
import type { NormalizedMessage } from '@/lib/ai/utils/message-normalizer';
import { cloudRunResponseSchema } from './schemas';

interface CloudRunHandlerParams {
  messagesToSend: NormalizedMessage[];
  sessionId: string;
  userQuery: string;
  dynamicTimeout: number;
  skipCache: boolean;
  cacheEndpoint: AIEndpoint;
  securityWarning?: string;
}

/**
 * Cloud Run Stream 모드 프록시
 * plain text 응답 반환 (TextStreamChatTransport 호환)
 */
export async function handleCloudRunStream(
  params: CloudRunHandlerParams
): Promise<NextResponse> {
  const {
    messagesToSend,
    sessionId,
    userQuery,
    dynamicTimeout,
    skipCache,
    cacheEndpoint,
    securityWarning,
  } = params;

  const warningHeaders: Record<string, string> = securityWarning
    ? { 'X-Security-Warning': securityWarning }
    : {};

  const result = await executeWithCircuitBreakerAndFallback<
    NextResponse<unknown>
  >(
    'cloud-run-supervisor-stream',
    async () => {
      const proxyResult = await proxyToCloudRun({
        path: '/api/ai/supervisor',
        body: { messages: messagesToSend, sessionId },
        timeout: dynamicTimeout,
      });

      if (!proxyResult.success || !proxyResult.data) {
        throw new Error(proxyResult.error ?? 'Cloud Run request failed');
      }

      const parseResult = cloudRunResponseSchema.safeParse(proxyResult.data);
      if (!parseResult.success) {
        throw new Error(
          `Invalid Cloud Run response: ${parseResult.error.message}`
        );
      }

      const data = parseResult.data;

      if (data.success && data.response) {
        if (!skipCache) {
          setAICache(
            sessionId,
            userQuery,
            { success: true, response: data.response, source: 'cloud-run' },
            cacheEndpoint
          ).catch((err) => logger.warn('[Supervisor] Cache set failed:', err));
        }

        return new NextResponse(data.response, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Session-Id': sessionId,
            'X-Backend': 'cloud-run',
            'X-Cache': 'MISS',
            ...warningHeaders,
          },
        });
      } else if (data.error) {
        const errorMessage = `⚠️ AI 오류: ${data.error}`;
        return new NextResponse(errorMessage, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Session-Id': sessionId,
            'X-Backend': 'cloud-run',
          },
        });
      }

      throw new Error('Invalid response from Cloud Run');
    },
    () => {
      const fallback = createFallbackResponse('supervisor', {
        query: userQuery,
      });
      const fallbackText = fallback.data?.response ?? fallback.message;

      return new NextResponse(fallbackText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Session-Id': sessionId,
          'X-Backend': 'fallback',
          'X-Fallback-Response': 'true',
          'X-Retry-After': '30000',
        },
      });
    }
  );

  if (result.source === 'fallback') {
    logger.info('⚠️ [Supervisor] Using fallback response (stream mode)');
  }

  return result.data;
}

/**
 * Cloud Run JSON 모드 프록시
 * JSON 응답 반환
 */
export async function handleCloudRunJson(
  params: CloudRunHandlerParams
): Promise<NextResponse> {
  const {
    messagesToSend,
    sessionId,
    userQuery,
    dynamicTimeout,
    skipCache,
    cacheEndpoint,
    securityWarning,
  } = params;

  const warningHeaders: Record<string, string> = securityWarning
    ? { 'X-Security-Warning': securityWarning }
    : {};

  const result = await executeWithCircuitBreakerAndFallback<
    Record<string, unknown>
  >(
    'cloud-run-supervisor-json',
    async () => {
      const proxyResult = await proxyToCloudRun({
        path: '/api/ai/supervisor',
        body: { messages: messagesToSend, sessionId },
        timeout: dynamicTimeout,
      });

      if (!proxyResult.success || !proxyResult.data) {
        throw new Error(proxyResult.error ?? 'Cloud Run request failed');
      }

      return {
        ...(proxyResult.data as Record<string, unknown>),
        _backend: 'cloud-run',
      };
    },
    () =>
      ({
        ...createFallbackResponse('supervisor', { query: userQuery }),
        sessionId,
        _backend: 'fallback',
      }) as Record<string, unknown>
  );

  if (result.source === 'fallback') {
    logger.info('⚠️ [Supervisor] Using fallback response (json mode)');
    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Session-Id': sessionId,
        'X-Fallback-Response': 'true',
        'X-Retry-After': '30000',
      },
    });
  }

  if (!skipCache && result.data) {
    const responseData = result.data as {
      success?: boolean;
      response?: string;
    };
    if (responseData.success && responseData.response) {
      setAICache(
        sessionId,
        userQuery,
        { success: true, response: responseData.response, source: 'cloud-run' },
        cacheEndpoint
      ).catch((err) => logger.warn('[Supervisor] Cache set failed:', err));
    }
  }

  return NextResponse.json(result.data, {
    headers: {
      'X-Session-Id': sessionId,
      'X-Cache': 'MISS',
      ...warningHeaders,
    },
  });
}
