/**
 * 🚀 Ultra-Fast AI API Endpoint
 *
 * 152ms 목표 달성을 위한 최적화된 AI API 엔드포인트
 * - Node.js Runtime 최적화 (Vercel 호환)
 * - 스트리밍 응답 지원
 * - 메모리 기반 초고속 캐싱
 * - 병렬 처리 최적화
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUltraFastAIRouter } from '@/services/ai/ultrafast-ai-router';
import { createCachedResponse } from '@/lib/cache/unified-cache';
import { aiLogger } from '@/lib/logger';
import { extractProperty } from '@/types/type-utils';

// Node.js Runtime 사용 (Vercel 경고 해결)
export const runtime = 'nodejs';
export const preferredRegion = 'icn1'; // 서울 리전

interface AIRequest {
  query: string;
  userId?: string;
  mode?: 'local-ai' | 'google-ai';
  enableStreaming?: boolean;
  maxResponseTime?: number;
}

interface AIResponse {
  success: boolean;
  response: string;
  processingTime: number;
  engine: string;
  confidence: number;
  cached: boolean;
  metadata?: {
    ultraFast: boolean;
    targetAchieved: boolean;
    cacheType?: string;
    streamingUsed?: boolean;
    optimizations?: string[];
  };
  error?: string;
}

const ultraFastRouter = getUltraFastAIRouter({
  enableStreamingEngine: true,
  enableInstantCache: true,
  enablePredictiveLoading: true,
  maxParallelOperations: 4,
  targetResponseTime: 152,
  aggressiveCaching: true,
  skipSecurityForSpeed: false,
  preferredEngine: 'local-ai', // 기본값
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = performance.now();

  try {
    // 요청 파싱 (빠른 처리를 위해 최소화)
    const body = (await request.json()) as AIRequest;
    const {
      query,
      userId,
      mode: rawMode = 'UNIFIED', // v4.0: UNIFIED로 고정
      enableStreaming = true,
      maxResponseTime = 152,
    } = body;

    // v4.0: AI 모드는 UNIFIED로 고정 (자동 라우팅)
    const mode = 'UNIFIED';

    // 레거시 모드 파라미터 경고 (v4.0: 하위 호환성)
    if (rawMode && rawMode !== 'UNIFIED' && rawMode !== 'local-ai') {
      console.warn(
        `[ultra-fast] [Deprecated] AI mode "${rawMode}"는 더 이상 지원되지 않습니다. UNIFIED 사용.`
      );
    }

    // 입력 검증 (최소한으로)
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          response: '쿼리를 입력해주세요.',
          processingTime: performance.now() - startTime,
          engine: 'validation',
          confidence: 0,
          cached: false,
          error: 'Invalid query',
        } as AIResponse,
        { status: 400 }
      );
    }

    // AI 라우터 실행
    const result = await ultraFastRouter.route({
      query: query.trim(),
      userId,
      mode,
      options: {
        timeoutMs: maxResponseTime,
        cached: true,
      },
    });

    const processingTime = performance.now() - startTime;
    const targetAchieved = processingTime <= maxResponseTime;

    // 응답 구성
    const aiResponse: AIResponse = {
      success: result.success,
      response: result.response,
      processingTime,
      engine: result.routingInfo?.selectedEngine || result.engine || 'unknown',
      confidence: result.confidence || 0,
      cached: Boolean(extractProperty(result.metadata, 'cached')),
      metadata: {
        ultraFast: true,
        targetAchieved,
        cacheType: String(extractProperty(result.metadata, 'cacheType') || ''),
        streamingUsed:
          enableStreaming &&
          Boolean(extractProperty(result.metadata, 'streaming')),
        optimizations: [
          targetAchieved ? 'target_achieved' : 'target_missed',
          result.metadata?.cached ? 'cache_hit' : 'cache_miss',
          result.routingInfo?.fallbackUsed ? 'fallback_used' : 'primary_engine',
          ...(result.routingInfo?.processingPath || []),
        ],
      },
    };

    // 성능 로깅
    if (!targetAchieved) {
      aiLogger.warn('성능 목표 미달성', {
        query: query.substring(0, 50),
        processingTime,
        target: maxResponseTime,
        engine: aiResponse.engine,
      });
    }

    // 응답 생성 (캐시 헤더 포함)
    return createCachedResponse(aiResponse, {
      status: 200,
      maxAge: targetAchieved ? 30 : 10, // 빠른 응답일수록 longer cache
      sMaxAge: targetAchieved ? 60 : 30,
      staleWhileRevalidate: 300,
    });
  } catch (error) {
    const processingTime = performance.now() - startTime;

    aiLogger.error('Ultra-Fast AI API 오류', {
      error: error instanceof Error ? error.message : String(error),
      processingTime,
      requestId,
    });

    const errorResponse: AIResponse = {
      success: false,
      response: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      processingTime,
      engine: 'error-handler',
      confidence: 0,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        ultraFast: true,
        targetAchieved: false,
        optimizations: ['error_fallback'],
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          response: 'Query parameter is required',
          processingTime: 0,
          engine: 'validation',
          confidence: 0,
          cached: false,
          error: 'Missing query parameter',
        } as AIResponse,
        { status: 400 }
      );
    }

    // GET 요청은 POST로 전달
    return await POST(
      new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ query }),
      })
    );
  } catch (error) {
    aiLogger.error('Ultra-Fast AI GET 오류', error);

    return NextResponse.json(
      {
        success: false,
        response: 'Invalid request format',
        processingTime: 0,
        engine: 'error-handler',
        confidence: 0,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as AIResponse,
      { status: 400 }
    );
  }
}

// OPTIONS 메서드 (CORS 지원)
export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24시간
    },
  });
}
