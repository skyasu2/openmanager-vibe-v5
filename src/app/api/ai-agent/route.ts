import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { getAISessionStorage, saveAIResponse } from '@/lib/ai-session-storage';
import { EdgeLogger } from '@/lib/edge-runtime-utils';
import { AIRequest } from '@/types/ai-types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 배포환경 AI 에이전트 (v5.44.3 아키텍처)
 *
 * 새로운 UnifiedAIEngineRouter와 통합된 AI 에이전트 엔드포인트
 * - Supabase RAG 엔진 중심
 * - 다층 폴백 시스템
 * - 3가지 운영 모드 (AUTO, LOCAL, GOOGLE_ONLY)
 * - 성능 최적화
 */

/**
 * 🤖 OpenManager Vibe v5 AI Agent API
 * - 2-Mode 시스템 (LOCAL 기본값, GOOGLE_ONLY 자연어 처리용)
 * - LOCAL: Supabase RAG + Korean AI + MCP 통합
 * - GOOGLE_ONLY: Google AI 전용 (자연어 처리에서만 사용자 선택)
 * - Edge Runtime 완전 호환
 * - Vercel Hobby/Pro 플랜 지원
 */

const logger = EdgeLogger.getInstance();

// Edge Runtime 설정 (Pro 플랜 최적화, Hobby 플랜 폴백 지원)
export const runtime = 'edge';
export const preferredRegion = ['icn1', 'hnd1', 'sin1']; // 아시아 지역 최적화

// Vercel 플랜별 제한사항
const VERCEL_LIMITS = {
  hobby: {
    maxExecutionTime: 10000, // 10초
    maxMemory: 128, // MB
    requestsPerMinute: 100,
  },
  pro: {
    maxExecutionTime: 15000, // 15초 (기본)
    maxMemory: 1024, // MB
    requestsPerMinute: 1000,
  },
} as const;

interface AIAgentRequest {
  message?: string;
  query?: string;
  context?: {
    source?: string;
    timestamp?: string;
    mode?: 'LOCAL' | 'GOOGLE_ONLY';
    [key: string]: any;
  };
}

interface AIRouterRequest {
  query: string;
  mode?: 'LOCAL' | 'GOOGLE_ONLY';
  context?: Record<string, any>;
  sessionId?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    includeThinking?: boolean;
    saveSession?: boolean;
  };
}

interface SystemMetrics {
  timestamp: string;
  performance: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  aiEngines: {
    supabaseRAG: {
      status: 'active' | 'inactive' | 'limited';
      requestCount: number;
      lastRequest: string;
    };
    googleAI: {
      status: 'active' | 'inactive' | 'limited';
      requestCount: number;
      lastRequest: string;
    };
    unified: {
      status: 'active' | 'inactive';
      engines: string[];
    };
  };
  database: {
    supabase: {
      status: 'connected' | 'disconnected';
      responseTime: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      responseTime: number;
    };
  };
  errors: {
    recent: number;
    critical: number;
  };
}

interface AIRequestBody {
  query?: string;
  action?: string;
  context?: {
    sessionId?: string;
    mode?: 'LOCAL' | 'GOOGLE_ONLY';
    priority?: number;
    timeout?: number;
  };
  metadata?: Record<string, any>;
}

interface AIResponseBody {
  success: boolean;
  response?: string;
  data?: any;
  error?: string;
  metadata?: {
    mode?: 'LOCAL' | 'GOOGLE_ONLY';
    enginePath?: string;
    duration?: number;
    sessionId?: string;
    timestamp?: string;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Vercel 플랜 감지
  const isProPlan =
    process.env.VERCEL_PLAN === 'pro' || process.env.NODE_ENV === 'development';
  const limits = isProPlan ? VERCEL_LIMITS.pro : VERCEL_LIMITS.hobby;

  // 타임아웃 설정
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, limits.maxExecutionTime);

  try {
    const body: AIRequestBody = await request.json();
    const { query, action, context, metadata } = body;

    // 1. 입력 검증
    if (!query && !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'query 또는 action이 필요합니다',
          metadata: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // 2. 모드 설정 및 검증 (기본값: LOCAL)
    const requestedMode = context?.mode || 'LOCAL';
    const mode = ['LOCAL', 'GOOGLE_ONLY'].includes(requestedMode)
      ? requestedMode
      : 'LOCAL';

    if (mode !== requestedMode) {
      console.warn(`⚠️ 지원하지 않는 모드 ${requestedMode}, LOCAL 모드로 처리`);
    }

    logger.info('🤖 AI Agent 요청 처리 시작', { query, mode });

    // 쿼리 검증
    if (!query || query.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_QUERY',
            message: '질문이 필요합니다.',
          },
        },
        { status: 400 }
      );
    }

    // 세션 ID 생성
    const storage = getAISessionStorage();
    const sessionId = storage.generateSessionId();

    // Thinking Process 추적을 위한 배열
    const thinkingProcess: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: number;
    }> = [];

    // 생각 과정 1: 질의 분석
    thinkingProcess.push({
      type: 'analysis',
      title: '질의 분석',
      description: `사용자 질문을 분석하고 적절한 AI 모드(${mode})를 선택했습니다.`,
      timestamp: Date.now(),
    });

    // AI 요청 생성
    const aiRequest: AIRequest = {
      query: query.trim(),
      mode,
      context: {
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
      },
    };

    // 생각 과정 2: 엔진 호출
    thinkingProcess.push({
      type: 'processing',
      title: 'AI 엔진 호출',
      description:
        'Unified AI Engine Router를 통해 최적의 AI 엔진들을 호출합니다.',
      timestamp: Date.now(),
    });

    // Unified AI Router로 처리
    const unifiedAIRouter = UnifiedAIEngineRouter.getInstance();
    await unifiedAIRouter.initialize();
    const response = await unifiedAIRouter.processQuery(aiRequest);

    // 생각 과정 3: 응답 생성
    thinkingProcess.push({
      type: 'completion',
      title: '응답 생성 완료',
      description: `${response.enginePath?.length || 1}개 엔진을 사용하여 응답을 생성했습니다.`,
      timestamp: Date.now(),
    });

    // 📝 AI 세션 저장 (비동기, 실패해도 응답은 계속)
    saveAIResponse(
      sessionId,
      query.trim(),
      mode,
      response,
      thinkingProcess,
      (response as any).reasoning || []
    ).catch(error => {
      logger.warn('AI 세션 저장 실패 (응답에는 영향 없음)', error);
    });

    // Edge Runtime 최적화된 응답 포맷
    const optimizedResponse = formatForEdgeDeployment(response, isProPlan);

    return NextResponse.json({
      success: true,
      query: query || '',
      response: optimizedResponse,
      metadata: {
        processingMethod: 'unified-ai-router-edge',
        requestedMode: requestedMode,
        actualMode: mode,
        vercelPlan: isProPlan ? 'pro' : 'hobby',
        edgeRuntime: true,
        region: process.env.VERCEL_REGION || 'auto',
        engine: (response as any).engine || 'unknown',
        responseTime: Date.now() - startTime,
        confidence: (response as any).confidence || 0.5,
        planOptimized: isProPlan,
      },
      timestamp: new Date().toISOString(),
      source: 'ai-agent-edge-v5.44.3',
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ AI 에이전트 Edge Runtime 오류:', error);

    // Edge Runtime 폴백 처리
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({
        success: true, // 타임아웃도 성공으로 처리 (사용자 경험)
        query: 'timeout',
        response: generateTimeoutFallback(isProPlan),
        metadata: {
          processingMethod: 'timeout-fallback',
          vercelPlan: isProPlan ? 'pro' : 'hobby',
          edgeRuntime: true,
          timeout: true,
          responseTime: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
        source: 'timeout-fallback-edge',
      });
    }

    // 일반 폴백 처리
    try {
      const body: AIAgentRequest = await request.json();
      const { message, query } = body;
      const userQuery = message || query || 'unknown';

      const fallbackResponse = await processQueryFallback(userQuery, {
        edgeRuntime: true,
        isProPlan,
      });
      return NextResponse.json({
        success: true,
        query: userQuery,
        response: fallbackResponse,
        metadata: {
          processingMethod: 'fallback-edge',
          fallbackUsed: true,
          vercelPlan: isProPlan ? 'pro' : 'hobby',
          edgeRuntime: true,
        },
        timestamp: new Date().toISOString(),
        source: 'fallback-ai-agent-edge',
      });
    } catch (fallbackError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI 서비스 일시 중단',
          details: isProPlan
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'Resource limited',
          vercelPlan: isProPlan ? 'pro' : 'hobby',
          edgeRuntime: true,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    let response;

    switch (action) {
      case 'status':
        response = await getSystemStatus();
        break;
      case 'metrics':
        response = await getSystemMetrics();
        break;
      case 'health':
        response = await getHealthCheck();
        break;
      default:
        response = {
          message: 'AI 에이전트가 준비되었습니다',
          availableActions: ['status', 'metrics', 'health'],
        };
    }

    return NextResponse.json({
      success: true,
      action,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI 에이전트 GET 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 새로운 아키텍처 지원 함수들
 */
function determineUrgency(
  query: string
): 'low' | 'medium' | 'high' | 'critical' {
  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes('긴급') ||
    lowerQuery.includes('심각') ||
    lowerQuery.includes('critical')
  ) {
    return 'critical';
  }
  if (
    lowerQuery.includes('빠르게') ||
    lowerQuery.includes('즉시') ||
    lowerQuery.includes('urgent')
  ) {
    return 'high';
  }
  if (
    lowerQuery.includes('중요') ||
    lowerQuery.includes('우선') ||
    lowerQuery.includes('important')
  ) {
    return 'medium';
  }
  return 'low';
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 🚀 Edge Runtime 최적화된 응답 포맷
 */
function formatForEdgeDeployment(result: any, isProPlan: boolean): string {
  if (typeof result === 'string') {
    return result;
  }

  if (result && result.response) {
    let response = result.response;

    // Pro 플랜: 풍부한 메타데이터 포함
    if (isProPlan && result.metadata) {
      if (result.metadata.confidence) {
        response += `\n\n🎯 **신뢰도**: ${Math.round(result.metadata.confidence * 100)}%`;
      }
      if (result.metadata.processingTime) {
        response += `\n⚡ **처리시간**: ${result.metadata.processingTime}ms (Edge Runtime)`;
      }
    }

    return response;
  }

  // 기본 응답
  return isProPlan
    ? '현재 AI 시스템이 응답을 준비 중입니다. Edge Runtime에서 최적화된 처리를 진행하고 있습니다.'
    : '현재 시스템이 제한된 모드로 운영 중입니다. 기본적인 응답만 제공됩니다.';
}

/**
 * 📱 타임아웃 폴백 응답 생성
 */
function generateTimeoutFallback(isProPlan: boolean): string {
  if (isProPlan) {
    return `⏱️ **처리 시간 초과 (Pro 플랜)**

요청하신 분석이 예상보다 복잡하여 시간이 초과되었습니다. 

**즉시 도움을 받으시려면:**
1. 더 구체적인 질문으로 다시 시도
2. 시스템 대시보드에서 실시간 상태 확인
3. 문제가 지속되면 지원팀 문의

**Pro 플랜 혜택**: 더 긴 처리 시간과 고급 분석 기능을 이용하실 수 있습니다.`;
  } else {
    return `⏱️ **처리 시간 제한 (Hobby 플랜)**

Hobby 플랜의 10초 처리 제한에 도달했습니다.

**권장사항:**
1. 더 간단한 질문으로 다시 시도
2. 기본 모니터링 기능 이용
3. Pro 플랜 업그레이드 시 15초+ 처리 시간 제공

현재 제한된 모드에서도 기본적인 서버 상태 확인은 가능합니다.`;
  }
}

async function processQueryFallback(
  query: string,
  context?: any
): Promise<string> {
  const isProPlan = context?.isProPlan || false;
  const lowerQuery = query.toLowerCase();

  // Edge Runtime 최적화된 키워드 기반 응답
  if (lowerQuery.includes('서버') || lowerQuery.includes('모니터링')) {
    return isProPlan
      ? `**서버 모니터링 (Pro 플랜)**: "${query}"\n\n실시간 서버 상태를 확인하여 상세한 분석을 제공하겠습니다. Edge Runtime에서 최적화된 처리로 빠른 응답을 보장합니다.\n\n• 고급 분석 기능 활용 가능\n• 예측적 모니터링 지원\n• 다중 서버 상관 분석`
      : `**서버 모니터링 (Hobby 플랜)**: "${query}"\n\n기본 서버 상태 확인이 가능합니다.\n\n• 기본 메트릭 제공\n• 실시간 상태 표시\n• Pro 플랜 업그레이드시 고급 기능 이용 가능`;
  }

  if (lowerQuery.includes('ai') || lowerQuery.includes('인공지능')) {
    return isProPlan
      ? `**AI 시스템 (Pro 플랜)**: "${query}"\n\nOpenManager Vibe v5의 모든 AI 기능을 이용하실 수 있습니다.\n\n• Supabase RAG 엔진\n• Google AI 통합\n• MCP 파일시스템 연동\n• Edge Runtime 최적화`
      : `**AI 시스템 (Hobby 플랜)**: "${query}"\n\n기본 AI 기능을 제공합니다.\n\n• 로컬 AI 엔진\n• 기본 분석 기능\n• 제한된 응답 시간`;
  }

  // 기본 응답
  return isProPlan
    ? `**Pro 플랜 응답**: "${query}"\n\nEdge Runtime에서 최적화된 처리가 진행되었습니다. 더 정확한 분석을 위해 AI 시스템이 완전히 복구된 후 다시 문의해주세요.`
    : `**Hobby 플랜 응답**: "${query}"\n\n제한된 기능으로 기본 응답만 제공됩니다. Pro 플랜 업그레이드시 고급 AI 기능과 더 긴 처리 시간을 이용하실 수 있습니다.`;
}

/**
 * 시스템 상태 조회
 */
async function getSystemStatus(): Promise<SystemMetrics> {
  // 실제 시스템 메트릭 수집 (시뮬레이션)
  const now = new Date();

  return {
    timestamp: now.toISOString(),
    performance: {
      responseTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
      memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
      cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
    },
    aiEngines: {
      supabaseRAG: {
        status: Math.random() > 0.8 ? 'limited' : 'active',
        requestCount: Math.floor(Math.random() * 80) + 10,
        lastRequest: new Date(
          now.getTime() - Math.random() * 300000
        ).toISOString(),
      },
      googleAI: {
        status: Math.random() > 0.8 ? 'limited' : 'active',
        requestCount: Math.floor(Math.random() * 80) + 10,
        lastRequest: new Date(
          now.getTime() - Math.random() * 300000
        ).toISOString(),
      },
      unified: {
        status: 'active',
        engines: ['google-ai', 'local-rag', 'hybrid-engine'],
      },
    },
    database: {
      supabase: {
        status: Math.random() > 0.95 ? 'disconnected' : 'connected',
        responseTime: Math.floor(Math.random() * 100) + 20,
      },
      redis: {
        status: Math.random() > 0.98 ? 'disconnected' : 'connected',
        responseTime: Math.floor(Math.random() * 50) + 10,
      },
    },
    errors: {
      recent: Math.floor(Math.random() * 10),
      critical: Math.floor(Math.random() * 3),
    },
  };
}

/**
 * 시스템 메트릭 조회
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
  return await getSystemStatus();
}

/**
 * 헬스 체크
 */
async function getHealthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '5.44.0',
    environment: process.env.NODE_ENV || 'development',
  };
}
