/**
 * 🚀 Edge AI API Route v2
 * 
 * Supabase Realtime 기반 Edge Runtime API
 * - Supabase로 생각중 상태 저장
 * - 캐시 우선 전략으로 Edge Runtime 시간 절약
 * - 스마트 폴백으로 안정성 확보
 */

import { NextRequest, NextResponse } from 'next/server';
import { edgeAIRouter } from '@/services/ai/edge/edge-ai-router';
import { unifiedResponseFormatter } from '@/services/ai/formatters/unified-response-formatter';
import { supabaseRealtimeAdapter } from '@/services/ai/adapters/service-adapters';
import type { EdgeRouterRequest } from '@/services/ai/interfaces/distributed-ai.interface';
import debug from '@/utils/debug';

// Edge Runtime 설정
export const runtime = 'edge';
export const preferredRegion = 'icn1'; // 서울

// 요청 제한 (무료 티어 보호)
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 10,
};

// 메모리 내 레이트 리미터 (Edge Runtime 호환)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: NextRequest) {
  try {
    // 1. 레이트 리미팅 (무료 티어 보호)
    const clientIp = req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };
    
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + RATE_LIMIT.windowMs;
    }
    
    if (clientData.count >= RATE_LIMIT.maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    clientData.count++;
    requestCounts.set(clientIp, clientData);

    // 2. 요청 파싱
    const body = await req.json();
    const { query, userId, sessionId, services, parallel, metadata } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 3. Edge Router 요청 구성
    const routerRequest: EdgeRouterRequest = {
      id: crypto.randomUUID(),
      query,
      userId,
      sessionId: sessionId || crypto.randomUUID(),
      services: services || ['redis-cache', 'supabase-rag', 'gcp-korean-nlp'],
      parallel: parallel ?? true,
      metadata,
      fallbackChain: ['gcp-ml-analytics'], // 무료 폴백
    };

    // 4. 생각중 상태 시작 (비동기)
    const thinkingPromise = supabaseRealtimeAdapter.addThinkingStep(
      routerRequest.sessionId!,
      {
        step: 'AI 처리 시작',
        description: query.substring(0, 100),
        status: 'processing',
        timestamp: Date.now(),
      },
      userId
    ).catch(debug.warn); // 실패해도 계속 진행

    // 5. Edge Router 실행
    const startTime = Date.now();
    const response = await edgeAIRouter.route(routerRequest);

    // 6. 통합 응답 포맷팅
    const unifiedResponse = unifiedResponseFormatter.formatEdgeRouterResponse(
      response,
      { id: routerRequest.id, query },
      startTime
    );

    // 7. 생각중 상태 완료 (비동기)
    thinkingPromise.then(() => 
      supabaseRealtimeAdapter.addThinkingStep(
        routerRequest.sessionId!,
        {
          step: 'AI 처리 완료',
          status: 'completed',
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        },
        userId
      ).catch(debug.warn)
    );

    // 8. 응답 헤더 설정 (캐시 제어)
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Processing-Time': String(unifiedResponse.processing.totalTime),
      'X-Cache-Status': unifiedResponse.metadata.cacheHit ? 'HIT' : 'MISS',
    });

    // 캐시 히트인 경우 브라우저 캐싱 허용
    if (unifiedResponse.metadata.cacheHit) {
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    } else {
      headers.set('Cache-Control', 'no-cache');
    }

    return NextResponse.json(unifiedResponse, { headers });

  } catch (error) {
    debug.error('Edge AI Route v2 Error:', error);
    
    // 에러 응답
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET 요청: API 상태 및 정보 제공
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    version: 'v2',
    description: 'Edge AI API v2 - Supabase Realtime 기반',
    runtime: 'edge',
    region: 'icn1 (Seoul)',
    features: {
      realtime: 'Supabase Realtime 기반 생각중 상태',
      caching: '캐시 우선 전략으로 Edge Runtime 최적화',
      fallback: '스마트 폴백으로 안정성 확보',
      rateLimit: '무료 티어 보호 (10req/min)',
    },
    services: [
      'redis-cache',
      'supabase-rag', 
      'gcp-korean-nlp',
      'gcp-ml-analytics'
    ],
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        query: 'string (required) - 처리할 질의',
        userId: 'string (optional) - 사용자 ID',
        sessionId: 'string (optional) - 세션 ID (자동 생성)',
        services: 'array (optional) - 사용할 서비스 목록',
        parallel: 'boolean (optional) - 병렬 처리 여부 (기본: true)',
        metadata: 'object (optional) - 추가 메타데이터',
      },
    },
    migration: {
      status: 'completed',
      from: 'Redis Streams',
      to: 'Supabase Realtime',
      benefits: [
        '실시간성: 1초 폴링 → 즉시 (WebSocket)',
        '네트워크: SSE + 폴링 → WebSocket 단일',
        '저장 기간: 1시간 TTL → 영구 저장',
        '쿼리 기능: 제한적 → Full SQL'
      ],
    },
    timestamp: new Date().toISOString(),
  });
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// 주기적 메모리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime + RATE_LIMIT.windowMs) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);