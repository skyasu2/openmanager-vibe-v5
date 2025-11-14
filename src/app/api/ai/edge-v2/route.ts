/**
 * 🚀 Edge AI API Route v2 - Google AI Only
 *
 * 순수 Google AI API만 사용
 * - 구글 AI 모드 전용 엔드포인트
 * - RAG나 다른 서비스 사용 안함
 * - 빠르고 직접적인 Google AI 호출
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAIModel } from '@/lib/ai/google-ai-client';
import { supabaseRealtimeAdapter } from '@/services/ai/adapters/service-adapters';
import debug from '@/utils/debug';

// Edge Runtime 설정
// Edge Runtime 제거 - 안정성 우선 (AI 교차 검증 결과)
export const preferredRegion = 'icn1'; // 서울
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const clientData = requestCounts.get(clientIp) || {
      count: 0,
      resetTime: now + RATE_LIMIT.windowMs,
    };

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
    const { query, userId, sessionId } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const sessionIdString = sessionId || crypto.randomUUID();
    const startTime = Date.now();

    // 3. 생각중 상태 시작 (비동기)
    const thinkingPromise = supabaseRealtimeAdapter
      .addThinkingStep(
        sessionIdString,
        {
          step: 'Google AI 처리 시작',
          description: query.substring(0, 100),
          status: 'processing',
          timestamp: Date.now(),
        },
        userId
      )
      .catch(debug.warn);

    // 4. Google AI 직접 호출
    const generativeModel = getGoogleAIModel('gemini-1.5-flash');
    
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topK: 40,
        topP: 0.95,
      },
    });

    const response = result.response;
    const text = response.text();
    const processingTime = Date.now() - startTime;

    // 5. 통합 응답 포맷 (기존 형식 유지)
    const unifiedResponse = {
      success: true,
      response: text,
      engine: 'google-ai',
      confidence: 0.9,
      metadata: {
        model: 'gemini-1.5-flash',
        processingTime,
        actualTokens: response.usageMetadata?.totalTokenCount || 0,
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
      processing: {
        totalTime: processingTime,
        services: ['google-ai'],
        cacheHit: false,
      },
      timestamp: new Date().toISOString(),
    };

    // 6. 생각중 상태 완료 (비동기)
    thinkingPromise.then(() =>
      supabaseRealtimeAdapter
        .addThinkingStep(
          sessionIdString,
          {
            step: 'Google AI 처리 완료',
            status: 'completed',
            timestamp: Date.now(),
            duration: processingTime,
          },
          userId
        )
        .catch(debug.warn)
    );

    // 7. 응답 반환
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Processing-Time': `${processingTime}ms`,
      'X-AI-Engine': 'google-ai',
      'Cache-Control': 'no-cache', // Google AI는 캐싱 안함
    });

    return NextResponse.json(unifiedResponse, { headers });
  } catch (error) {
    debug.error('Google AI API Error:', error);

    // 에러 응답
    return NextResponse.json(
      {
        success: false,
        error: 'Google AI request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET 요청: API 상태 및 정보 제공
export function GET(_req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    version: 'v2-google-ai',
    description: 'Edge AI API v2 - 순수 Google AI 전용',
    runtime: 'nodejs',
    region: 'icn1 (Seoul)',
    features: {
      aiEngine: '순수 Google AI (Gemini Pro)',
      realtime: 'Supabase Realtime 기반 생각중 상태',
      rateLimit: '무료 티어 보호 (10req/min)',
      noRAG: 'RAG나 다른 서비스 사용 안함',
    },
    services: [
      'google-ai-only'
    ],
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        query: 'string (required) - 처리할 질의',
        userId: 'string (optional) - 사용자 ID',
        sessionId: 'string (optional) - 세션 ID (자동 생성)',
      },
    },
    aiModel: {
      provider: 'Google AI',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
      constraints: 'Google AI 무료 한도 (1,000 요청/일)',
    },
    timestamp: new Date().toISOString(),
  });
}

// OPTIONS 요청 처리 (CORS)
export function OPTIONS(_req: NextRequest) {
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
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime + RATE_LIMIT.windowMs) {
        requestCounts.delete(ip);
      }
    }
  },
  5 * 60 * 1000
);
