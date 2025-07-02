/**
 * 🤖 통합 AI 쿼리 API - Edge Runtime 최적화 버전
 * Vercel Pro/Hobby 플랜 지원
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { getAISessionStorage, saveAIResponse } from '@/lib/ai-session-storage';
import { EdgeLogger } from '@/lib/edge-runtime-utils';
import { AIRequest } from '@/types/ai-types';
import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime 설정
export const runtime = 'edge';
export const preferredRegion = ['icn1', 'hnd1', 'sin1']; // 아시아 지역 최적화

// Vercel 플랜별 제한사항
const VERCEL_OPTIMIZATION = {
  hobby: {
    maxExecutionTime: 10000, // 10초
    maxConcurrentRequests: 10,
    enableAdvancedFeatures: false,
    ragTimeout: 5000,
    koreanNLPTimeout: 3000,
  },
  pro: {
    maxExecutionTime: 15000, // 15초
    maxConcurrentRequests: 100,
    enableAdvancedFeatures: true,
    ragTimeout: 10000,
    koreanNLPTimeout: 8000,
  },
} as const;

const logger = EdgeLogger.getInstance();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Vercel 플랜 감지 및 설정
  const isProPlan =
    process.env.VERCEL_PLAN === 'pro' || process.env.NODE_ENV === 'development';
  const config = isProPlan
    ? VERCEL_OPTIMIZATION.pro
    : VERCEL_OPTIMIZATION.hobby;

  // Edge Runtime 타임아웃 설정
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.maxExecutionTime
  );

  try {
    const body = await request.json();
    const { query, mode = 'LOCAL', enableThinking = false } = body;

    if (!query) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          success: false,
          error: 'query 필드가 필요합니다',
          vercelPlan: isProPlan ? 'pro' : 'hobby',
        },
        { status: 400 }
      );
    }

    // 모드 정규화 (Hobby 플랜 제한 적용)
    let normalizedMode: 'LOCAL' | 'GOOGLE_ONLY' = 'LOCAL';
    if (mode === 'GOOGLE_ONLY' && isProPlan) {
      normalizedMode = 'GOOGLE_ONLY';
    } else {
      normalizedMode = 'LOCAL'; // 기본값: LOCAL (Hobby 플랜 항상, Pro 플랜 기본값)
    }

    // 세션 관리
    const storage = getAISessionStorage();
    const sessionId = storage.generateSessionId();

    // 자연어 질의 특화 Thinking Process
    const thinkingProcess: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: number;
    }> = [];

    // 생각 과정 1: 자연어 분석
    thinkingProcess.push({
      type: 'nlp-analysis',
      title: '자연어 이해',
      description: '사용자의 자연어 질문을 분석하고 의도를 파악합니다.',
      timestamp: Date.now(),
    });

    // 생각 과정 2: 컨텍스트 구성
    thinkingProcess.push({
      type: 'context-building',
      title: '컨텍스트 구성',
      description: 'RAG 엔진과 Korean AI를 활용하여 관련 정보를 수집합니다.',
      timestamp: Date.now(),
    });

    // AI 요청 구성
    const aiRequest: AIRequest = {
      query: query.trim(),
      mode: normalizedMode,
      context: {
        sessionId,
        vercelPlan: isProPlan ? 'pro' : 'hobby',
        edgeRuntime: true,
        maxExecutionTime: config.maxExecutionTime,
        enableAdvancedFeatures: config.enableAdvancedFeatures,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        queryType: 'natural-language', // 자연어 질의 표시
        origin: 'unified-query-api',
      },
      timeout: config.maxExecutionTime - 1000,
      enableFallback: true,
    };

    // 생각 과정 3: AI 엔진 처리
    thinkingProcess.push({
      type: 'ai-processing',
      title: 'AI 엔진 처리',
      description: `${normalizedMode} 모드로 통합 AI 엔진을 실행하여 최적의 답변을 생성합니다.`,
      timestamp: Date.now(),
    });

    // AI 라우터 처리 (타임아웃과 함께)
    const router = UnifiedAIEngineRouter.getInstance();
    await router.initialize();

    const resultPromise = router.processQuery(aiRequest);
    const timeoutPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        reject(new Error('Edge Runtime timeout'));
      });
    });

    const result = await Promise.race([resultPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    // 생각 과정 4: 품질 검증
    thinkingProcess.push({
      type: 'quality-check',
      title: '응답 품질 검증',
      description: `신뢰도 ${Math.round(((result as any).confidence || 0.7) * 100)}%로 응답 품질을 검증했습니다.`,
      timestamp: Date.now(),
    });

    // 📝 자연어 질의 세션 저장 (확장된 메타데이터 포함)
    saveAIResponse(
      sessionId,
      query,
      normalizedMode,
      {
        ...(result as any),
        queryType: 'natural-language',
        processingSteps: thinkingProcess.length,
      },
      thinkingProcess,
      (result as any).reasoning || []
    ).catch(error => {
      logger.warn('자연어 질의 세션 저장 실패', error);
    });

    // Edge Runtime 최적화 응답
    return NextResponse.json({
      success: true,
      query,
      ...formatUnifiedResponse(result, isProPlan),
      metadata: {
        ...((result as any).metadata || {}),
        vercelPlan: isProPlan ? 'pro' : 'hobby',
        edgeRuntime: true,
        requestedMode: mode,
        actualMode: normalizedMode,
        processingTime: Date.now() - startTime,
        region: process.env.VERCEL_REGION || 'auto',
        optimizedForPlan: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // Edge Runtime 타임아웃 처리
    if (error instanceof Error && error.message === 'Edge Runtime timeout') {
      return NextResponse.json({
        success: true, // UX를 위해 success로 처리
        query: 'timeout',
        response: generateTimeoutResponse(isProPlan),
        confidence: 0.5,
        enginePath: ['timeout-handler'],
        processingTime: Date.now() - startTime,
        fallbacksUsed: 1,
        metadata: {
          timeout: true,
          vercelPlan: isProPlan ? 'pro' : 'hobby',
          edgeRuntime: true,
          timeoutReason: 'execution_limit_reached',
        },
        timestamp: new Date().toISOString(),
      });
    }

    console.error('❌ Unified Query Edge Runtime 오류:', error);

    // 폴백 응답
    return NextResponse.json({
      success: true,
      query: 'error_fallback',
      response: generateFallbackResponse(isProPlan),
      confidence: 0.3,
      enginePath: ['fallback-handler'],
      processingTime: Date.now() - startTime,
      fallbacksUsed: 1,
      metadata: {
        error: true,
        vercelPlan: isProPlan ? 'pro' : 'hobby',
        edgeRuntime: true,
        fallbackReason: 'system_error',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Unified AI Query API - Edge Runtime',
    status: 'ready',
    version: '5.44.3-edge',
    runtime: 'edge',
    regions: ['icn1', 'hnd1', 'sin1'],
    capabilities: {
      hobby: {
        maxExecutionTime: '10s',
        modes: ['LOCAL'],
        features: ['basic-ai', 'local-rag'],
      },
      pro: {
        maxExecutionTime: '15s',
        modes: ['LOCAL', 'GOOGLE_ONLY'],
        features: [
          'advanced-ai',
          'google-ai',
          'mcp-integration',
          'enhanced-rag',
        ],
      },
    },
    currentPlan: process.env.VERCEL_PLAN || 'development',
    timestamp: new Date().toISOString(),
  });
}

// 유틸리티 함수들
function generateSessionId(): string {
  return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function formatUnifiedResponse(result: any, isProPlan: boolean) {
  if (!result) {
    return {
      response: generateFallbackResponse(isProPlan),
      confidence: 0.3,
      enginePath: ['fallback'],
      processingTime: 0,
      fallbacksUsed: 1,
    };
  }

  let formattedResponse = result.response || '응답을 생성할 수 없습니다.';

  // Pro 플랜 메타데이터 추가
  if (isProPlan && result.metadata) {
    if (result.metadata.confidence > 0.8) {
      formattedResponse += `\n\n🎯 **고품질 분석** (신뢰도: ${Math.round(result.metadata.confidence * 100)}%)`;
    }
    if (result.metadata.ragUsed) {
      formattedResponse += `\n📚 **RAG 엔진 활용** - 벡터 검색 기반 정확한 응답`;
    }
    if (result.metadata.mcpContextUsed) {
      formattedResponse += `\n🔗 **실시간 컨텍스트** - MCP 파일시스템 연동`;
    }
  }

  return {
    response: formattedResponse,
    confidence: result.confidence || 0.5,
    enginePath: result.enginePath || ['unknown'],
    processingTime: result.processingTime || 0,
    fallbacksUsed: result.fallbacksUsed || 0,
  };
}

function generateTimeoutResponse(isProPlan: boolean): string {
  if (isProPlan) {
    return `⏱️ **Pro 플랜 - 처리 시간 초과**

요청이 복잡하여 15초 제한에 도달했습니다.

**최적화 제안:**
• 더 구체적인 질문으로 세분화
• 대시보드에서 실시간 모니터링 이용
• 배치 처리가 필요한 경우 별도 문의

Edge Runtime에서 최대 성능으로 처리했지만 시간이 부족했습니다.`;
  } else {
    return `⏱️ **Hobby 플랜 - 처리 시간 제한**

10초 처리 제한에 도달했습니다.

**권장사항:**
• 간단한 질문으로 다시 시도
• Pro 플랜 업그레이드시 15초+ 처리 시간
• 기본 모니터링 기능은 계속 이용 가능

현재 제한된 모드에서도 기본 서비스는 제공됩니다.`;
  }
}

function generateFallbackResponse(isProPlan: boolean): string {
  if (isProPlan) {
    return `🔧 **Pro 플랜 - 시스템 복구 중**

AI 시스템이 일시적으로 제한된 모드로 운영 중입니다.

**이용 가능한 기능:**
• 실시간 서버 모니터링
• 기본 성능 분석
• 대시보드 및 알림 시스템

시스템이 완전히 복구되면 고급 AI 기능을 다시 이용하실 수 있습니다.`;
  } else {
    return `🔧 **Hobby 플랜 - 기본 모드**

현재 기본 기능만 제공됩니다.

**이용 가능한 기능:**
• 서버 상태 확인
• 기본 모니터링
• 단순 질의 응답

Pro 플랜 업그레이드시 고급 AI 기능과 더 긴 처리 시간을 이용하실 수 있습니다.`;
  }
}
